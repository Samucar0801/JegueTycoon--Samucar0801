/* ============================================================
   render.js — TODA A RENDERIZAÇÃO (DOM)
   Desenha HUD, cards de gerador, loja, lendas, conquistas, abas,
   modais, toasts e a barra de buffs. Não decide regras — só mostra.
   Atualizações pesadas só acontecem quando algo muda de fato.
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = root.JT.config, E = root.JT.economy, U = root.JT.util, ST = root.JT.state, B = root.JT.buffs;
  const fmt = U.fmt;

  let el = {};
  const genCards = {};   // cache dos cards de gerador
  let lastStoreSig = "", lastLendaSig = "", lastAchSig = "", lastBuffSig = "", lastVisualSig = "";
  let prevClick = 0, prevCps = 0;

  function bump(node) {
    if (!node) return;
    node.classList.remove("bump"); void node.offsetWidth; node.classList.add("bump");
  }

  function init() {
    el = {
      coins: U.$("#coins"), cps: U.$("#cps"), clickVal: U.$("#click-val"),
      stars: U.$("#stars"), prestigeLvl: U.$("#prestige-lvl"), clicks: U.$("#clicks"),
      list: U.$("#list"), buffbar: U.$("#buffbar"), toasts: U.$("#toasts"),
      overlay: U.$("#overlay"), mTitle: U.$("#m-title"), mText: U.$("#m-text"), mRow: U.$("#m-row"),
      taphint: U.$("#taphint"), starWrap: U.$("#star-wrap"),
    };
  }

  /* ---------- HUD ---------- */
  function updateHud(S, cpsNow, clickNow) {
    el.coins.textContent = fmt(S.coins);
    el.cps.textContent = fmt(cpsNow) + "/s";
    el.clickVal.textContent = "+" + fmt(clickNow) + "/carinho";
    el.clicks.textContent = fmt(S.clicks);
    el.prestigeLvl.textContent = fmt(S.prestige);
    el.stars.textContent = fmt(S.stars);
    el.starWrap.style.display = (S.prestige > 0 || S.stars > 0) ? "" : "none";
    // feedback: pulsa quando o poder aumenta (ex.: comprou upgrade / pegou buff)
    if (clickNow > prevClick * 1.0001) bump(el.clickVal);
    if (cpsNow > prevCps * 1.0001) bump(el.cps);
    prevClick = clickNow; prevCps = cpsNow;
  }

  /* ---------- visibilidade progressiva ---------- */
  function revealed(S, g, idx) {
    if ((S.gens[g.id] || 0) > 0) return true;
    if (S.coins >= g.baseCost * 0.3) return true;
    if (idx > 0) { const prev = CFG.GENERATORS[idx - 1]; if ((S.gens[prev.id] || 0) > 0) return true; }
    return false;
  }

  /* ---------- ESTÁBULO (geradores) ---------- */
  function buildGenCards(S) {
    el.list.innerHTML = "";
    for (const k in genCards) delete genCards[k];
    CFG.GENERATORS.forEach((g, idx) => {
      const card = document.createElement("div");
      card.className = "card gen-card";
      card.innerHTML =
        '<div class="gen-ic">' + g.icon + '</div>' +
        '<div class="gen-mid">' +
          '<div class="gen-name">' + g.name + '</div>' +
          '<div class="gen-desc">' + g.desc + '</div>' +
          '<div class="gen-meta" data-meta></div>' +
          '<div class="ms-bar"><div class="ms-fill" data-msfill></div></div>' +
          '<div class="gen-ms" data-ms></div>' +
        '</div>' +
        '<div class="gen-right">' +
          '<div class="gen-owned" data-owned>0</div>' +
          '<button class="buy" data-buy><span data-buytxt>Comprar</span><span class="buy-cost" data-cost></span></button>' +
        '</div>';
      el.list.appendChild(card);
      genCards[g.id] = {
        card, meta: card.querySelector("[data-meta]"), ms: card.querySelector("[data-ms]"),
        msfill: card.querySelector("[data-msfill]"), owned: card.querySelector("[data-owned]"),
        buy: card.querySelector("[data-buy]"), cost: card.querySelector("[data-cost]"),
        buytxt: card.querySelector("[data-buytxt]"),
      };
      card.querySelector("[data-buy]").addEventListener("click", () => root.JT.game.buyGen(g.id));
    });
  }

  function refreshGenCards(S, qty) {
    CFG.GENERATORS.forEach((g, idx) => {
      const c = genCards[g.id]; if (!c) return;
      const show = revealed(S, g, idx);
      c.card.style.display = show ? "" : "none";
      if (!show) return;
      const owned = S.gens[g.id] || 0;
      const price = E.priceFor(S, g, qty);
      const perSec = E.genBase(S, g.id) * E.prodMult(S);
      c.owned.textContent = owned;
      c.meta.innerHTML = (owned > 0)
        ? ('Produz <b>' + fmt(perSec) + '</b>/s &middot; cada: ' + fmt(g.baseProd * E.milestoneMult(owned) * E.genUpMult(S, g.id) * E.prodMult(S)) + '/s')
        : ('Produz <b>' + fmt(g.baseProd * E.prodMult(S)) + '</b>/s por unidade');
      const nm = E.nextMilestone(owned);
      if (nm) {
        const prev = CFG.MILESTONES.filter((m) => m <= owned).pop() || 0;
        const pctv = ((owned - prev) / (nm - prev)) * 100;
        c.msfill.style.width = U.clamp(pctv, 0, 100) + "%";
        c.ms.textContent = "Próximo marco: " + owned + "/" + nm + " (x2)";
      } else { c.msfill.style.width = "100%"; c.ms.textContent = "Marcos no máximo! 🏆"; }
      const can = isFinite(price.total) && S.coins >= price.total && price.n > 0;
      c.buy.classList.toggle("off", !can);
      c.buytxt.textContent = price.n > 1 ? ("Comprar x" + price.n) : "Comprar";
      c.cost.textContent = (price.n > 0 && isFinite(price.total)) ? ("🪙 " + fmt(price.total)) : "—";
    });
  }

  /* ---------- LOJA (upgrades) ---------- */
  function visibleUpgrades(S) {
    const out = [];
    // de mão
    CFG.UPGRADES.forEach((u) => {
      if (S.ups[u.id]) return;
      if (u.req && (S.gens[u.req.gen] || 0) < u.req.n) return;
      if (S.coins < u.cost * 0.2 && !(u.req)) return;
      out.push(u);
    });
    // de gerador (libera quando você tem unidades suficientes)
    E.genUpgrades().forEach((u) => {
      if (S.ups[u.id]) return;
      if ((S.gens[u.genId] || 0) < u.at) return;
      out.push(u);
    });
    out.sort((a, b) => a.cost - b.cost);
    return out;
  }

  function renderStore(S) {
    const ups = visibleUpgrades(S);
    // ícones dos upgrades já comprados (feedback de que estão ATIVOS)
    const owned = E.allUpgrades().filter((u) => S.ups[u.id]);
    const ownSig = owned.map((u) => u.id).join(",");
    const sig = ups.map((u) => u.id + (S.coins >= u.cost ? "1" : "0")).join(",") + "|own:" + ownSig;
    if (sig === lastStoreSig) return;
    lastStoreSig = sig;
    el.list.innerHTML = "";

    if (owned.length > 0) {
      const strip = document.createElement("div");
      strip.className = "owned-strip";
      strip.innerHTML = '<span class="owned-lbl">⚡ Ativos (' + owned.length + '):</span> ' +
        owned.map((u) => '<span class="owned-ic" title="' + u.name + '">' + u.icon + '</span>').join("");
      el.list.appendChild(strip);
    }

    if (ups.length === 0) {
      const e = document.createElement("div");
      e.className = "empty";
      e.innerHTML = "Nenhum upgrade novo por enquanto.<br>Compre geradores e faça carinho pra liberar mais! 🫏";
      el.list.appendChild(e);
      return;
    }
    ups.forEach((u) => {
      const can = S.coins >= u.cost;
      const card = document.createElement("div");
      card.className = "card up-card" + (can ? "" : " off");
      card.innerHTML =
        '<div class="up-ic">' + u.icon + '</div>' +
        '<div class="up-mid"><div class="up-name">' + u.name + '</div>' +
        '<div class="up-desc">' + u.desc + '</div></div>' +
        '<div class="up-cost">🪙 ' + fmt(u.cost) + '</div>';
      card.addEventListener("click", () => root.JT.game.buyUpgrade(u.id));
      el.list.appendChild(card);
    });
  }

  /* ---------- LENDAS (prestígio) ---------- */
  function renderLendas(S) {
    const sig = "p" + S.prestige + "s" + S.stars + Object.keys(S.lendas).sort().join(",");
    if (sig === lastLendaSig) return;
    lastLendaSig = sig;
    el.list.innerHTML = "";

    const head = document.createElement("div");
    head.className = "lenda-head";
    const canPrest = E.starsOnPrestige(S) > 0;
    const ganho = E.starsOnPrestige(S);
    head.innerHTML =
      '<div class="lenda-stars">⭐ <b>' + fmt(S.stars) + '</b> estrelas para gastar</div>' +
      '<div class="lenda-info">Cada estrela = +' + (S.lendas.cosmico ? 3 : 2) + '% de produção, pra sempre. Você tem ' + fmt(S.prestige) + ' acumuladas.</div>' +
      '<button id="do-prestige" class="prestige-btn ' + (canPrest ? "" : "off") + '">🔄 Renascer agora <small>+' + fmt(ganho) + ' ⭐</small></button>' +
      '<div class="lenda-next">' + prestigeHint(S) + '</div>';
    el.list.appendChild(head);
    head.querySelector("#do-prestige").addEventListener("click", () => root.JT.game.askPrestige());

    CFG.LENDAS.forEach((l) => {
      const owned = !!S.lendas[l.id];
      const can = !owned && S.stars >= l.cost;
      const card = document.createElement("div");
      card.className = "card lenda-card" + (owned ? " owned" : (can ? "" : " off"));
      card.innerHTML =
        '<div class="up-ic">' + l.icon + '</div>' +
        '<div class="up-mid"><div class="up-name">' + l.name + (owned ? ' <span class="tag">ativa</span>' : '') + '</div>' +
        '<div class="up-desc">' + l.desc + '</div></div>' +
        '<div class="up-cost">' + (owned ? '✅' : '⭐ ' + l.cost) + '</div>';
      if (!owned) card.addEventListener("click", () => root.JT.game.buyLenda(l.id));
      el.list.appendChild(card);
    });
  }

  function prestigeHint(S) {
    const have = E.starsOnPrestige(S) + S.prestige;
    const need = E.lifetimeForStar(have + 1);
    const falta = Math.max(0, need - S.lifetimeAll);
    return "Próxima estrela em <b>" + fmt(falta) + "</b> moedas no total acumulado.";
  }

  /* ---------- CONQUISTAS ---------- */
  function renderAchs(S) {
    const got = ST.totalAchs(S);
    const sig = got + "/" + CFG.ACHS.length;
    if (sig === lastAchSig) return;
    lastAchSig = sig;
    el.list.innerHTML = "";
    const head = document.createElement("div");
    head.className = "ach-head";
    head.innerHTML = '🏆 <b>' + got + '</b> / ' + CFG.ACHS.length + ' conquistas &middot; bônus atual: +' + got + '% global';
    el.list.appendChild(head);
    const grid = document.createElement("div");
    grid.className = "ach-grid";
    CFG.ACHS.forEach((a) => {
      const has = !!S.achs[a.id];
      const it = document.createElement("div");
      it.className = "ach" + (has ? " on" : "");
      it.innerHTML = '<div class="ach-ic">' + (has ? a.icon : "🔒") + '</div>' +
        '<div class="ach-name">' + a.name + '</div>' +
        '<div class="ach-desc">' + a.desc + '</div>';
      grid.appendChild(it);
    });
    el.list.appendChild(grid);
  }

  /* ---------- GUARDA-ROUPA (cosméticos) ---------- */
  function renderVisual(S) {
    const C = root.JT.customize;
    const sig = JSON.stringify(S.equip) + "|" + C.countUnlocked(S) + "|" + Object.keys(S.cosmoSeen).length;
    if (sig === lastVisualSig) return;
    lastVisualSig = sig;
    el.list.innerHTML = "";

    const head = document.createElement("div");
    head.className = "visual-head";
    head.innerHTML = "👕 <b>" + C.countUnlocked(S) + "</b> / " + CFG.COSMETICS.length +
      " visuais desbloqueados &middot; equipar dá um bônus extra!";
    el.list.appendChild(head);

    CFG.COSMO_SLOTS.forEach((slot) => {
      const itens = C.bySlot(slot.id, S);
      if (itens.length === 0) return;
      const group = document.createElement("div");
      group.className = "cosmo-group";
      const title = document.createElement("div");
      title.className = "cosmo-title";
      title.innerHTML = slot.icon + " " + slot.name;
      group.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "cosmo-grid";
      itens.forEach((it) => {
        const c = it.def;
        const cell = document.createElement("div");
        cell.className = "cosmo" + (it.equipped ? " equipped" : "") + (it.unlocked ? "" : " locked");
        const bonus = c.bonus ? bonusLabel(c.bonus) : "";
        cell.innerHTML =
          '<div class="cosmo-ic">' + (it.unlocked ? c.icon : "🔒") + '</div>' +
          '<div class="cosmo-name">' + c.name + '</div>' +
          (it.unlocked
            ? '<div class="cosmo-bonus">' + (bonus || "visual") + '</div>' + (it.equipped ? '<div class="cosmo-tag">equipado</div>' : '')
            : '<div class="cosmo-lock">' + c.unlockDesc + '</div>');
        if (it.unlocked) cell.addEventListener("click", () => root.JT.game.equipCosmetic(c.id));
        grid.appendChild(cell);
      });
      group.appendChild(grid);
      el.list.appendChild(group);
    });
  }
  function bonusLabel(b) {
    const pct = Math.round((b.mult - 1) * 100);
    const map = { click: "+" + pct + "% clique", prod: "+" + pct + "% produção", all: "+" + pct + "% tudo", golden: "+dourado", offline: "+" + pct + "% offline" };
    return map[b.kind] || "";
  }

  /* ---------- ABAS ---------- */
  function setActiveTab(tab) {
    U.$$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    // força recomputar assinaturas ao trocar de aba
    lastStoreSig = lastLendaSig = lastAchSig = lastVisualSig = "";
  }

  /* ---------- BARRA DE BUFFS ---------- */
  function refreshBuffs(now) {
    const list = B.activeList(now);
    const sig = list.map((b) => b.name + b.secsLeft).join("|");
    if (sig === lastBuffSig) return;
    lastBuffSig = sig;
    el.buffbar.innerHTML = "";
    list.forEach((b) => {
      const chip = document.createElement("div");
      chip.className = "buff-chip";
      chip.textContent = b.name + " " + b.secsLeft + "s";
      el.buffbar.appendChild(chip);
    });
  }

  /* ---------- TOASTS ---------- */
  function toast(icon, title, sub) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<div class="toast-ic">' + icon + '</div><div><div class="toast-t">' + title + '</div>' +
      (sub ? '<div class="toast-s">' + sub + '</div>' : '') + '</div>';
    el.toasts.appendChild(t);
    setTimeout(() => t.classList.add("show"), 20);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 4200);
  }

  /* ---------- MODAL ---------- */
  function modal(title, html, buttons) {
    el.mTitle.innerHTML = title;
    el.mText.innerHTML = html;
    el.mRow.innerHTML = "";
    (buttons || [{ label: "Ok", cls: "yes", fn: closeModal }]).forEach((b) => {
      const x = document.createElement("button");
      x.className = "mbtn " + (b.cls || "");
      x.textContent = b.label;
      x.addEventListener("click", b.fn);
      el.mRow.appendChild(x);
    });
    el.overlay.classList.add("show");
  }
  function closeModal() { el.overlay.classList.remove("show"); }

  function hideTapHint() { if (el.taphint) el.taphint.style.display = "none"; }
  function showTapHint() { if (el.taphint) el.taphint.style.display = ""; }
  function resetSigs() { lastStoreSig = lastLendaSig = lastAchSig = lastBuffSig = lastVisualSig = ""; }

  root.JT.render = {
    init, updateHud, buildGenCards, refreshGenCards, renderStore, renderLendas,
    renderAchs, renderVisual, setActiveTab, refreshBuffs, toast, modal, closeModal,
    hideTapHint, showTapHint, resetSigs, el: () => el,
  };
})(window);
