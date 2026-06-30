/* ============================================================
   game.js — LÓGICA DE JOGO (ações + loop + init)
   Liga as peças: ações do jogador, o relógio do jogo (loop),
   ganhos offline e a inicialização à prova de falhas.
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = root.JT.config, E = root.JT.economy, U = root.JT.util, ST = root.JT.state;
  const STORE = root.JT.storage, A = root.JT.audio, FX = root.JT.fx, R = root.JT.render;
  const ACH = root.JT.ach, B = root.JT.buffs, NEWS = root.JT.news;
  const C = root.JT.customize, SFX = root.JT.scenefx;

  let S = ST.newState();
  let tab = "estabulo";
  let qty = 1;                  // 1 | 10 | 100 | "max"
  let lastTick = 0, lastSave = 0;
  let nextGolden = 0, nextEvent = 0;
  let started = false;

  /* ---------- helpers de multiplicador vivo ---------- */
  const liveCps = () => E.cps(S, B.prodFactor());
  const liveClick = () => E.clickValue(S, B.clickFactor());

  // ícone da "ferramenta" de clique mais forte que você tem (feedback visual)
  const CLICK_ICONS = { dedo: "👆", luva: "🧤", palma: "✋", bencao: "🙏", trovao: "⚡" };
  function clickToolIcon() {
    let icon = "👆";
    CFG.UPGRADES.forEach((u) => { if (u.kind === "clickMult" && S.ups[u.id] && CLICK_ICONS[u.id]) icon = CLICK_ICONS[u.id]; });
    return icon;
  }

  /* ---------- AÇÕES ---------- */
  function doClick(x, y) {
    const v = liveClick();
    S.coins += v; S.lifetime += v; S.lifetimeAll += v; S.clicks++;
    const svg = U.$("#jegue");
    if (svg) { svg.classList.remove("clicked"); void svg.offsetWidth; svg.classList.add("clicked"); }
    A.sfx.click();
    if (x != null) {
      const big = v >= 1000;
      FX.floaty(x, y, "+" + U.fmt(v), big ? "big" : "");
      FX.burst(x, y, null, big ? U.randi(7, 11) : U.randi(4, 7));
      FX.ripple(x, y);
      FX.tool(x, y, clickToolIcon());        // a "ferramenta" dá um tapinha — feedback do upgrade
    }
    if (S.clicks === 1) R.hideTapHint();
    afterChange();
  }

  function buyGen(id) {
    const g = E.genById[id]; if (!g) return;
    const price = E.priceFor(S, g, qty);
    if (!isFinite(price.total) || price.n <= 0 || S.coins < price.total) { A.sfx.error(); return; }
    S.coins -= price.total;
    S.gens[id] = (S.gens[id] || 0) + price.n;
    A.sfx.buy();
    refreshActiveTab();
    afterChange();
  }

  function buyUpgrade(id) {
    if (S.ups[id]) return;
    const u = E.upgradeById(id); if (!u) return;
    if (S.coins < u.cost) { A.sfx.error(); return; }
    S.coins -= u.cost; S.ups[id] = true;
    A.sfx.upgrade();
    R.toast(u.icon, "Upgrade: " + u.name, u.desc);
    R.updateHud(S, liveCps(), liveClick());   // atualiza JÁ (não espera o próximo frame) -> número salta na hora
    refreshActiveTab();
    afterChange();
  }

  function buyLenda(id) {
    if (S.lendas[id]) return;
    const l = CFG.LENDAS.find((x) => x.id === id); if (!l) return;
    if (S.stars < l.cost) { A.sfx.error(); R.toast("⭐", "Faltam estrelas", "Você precisa de " + l.cost + " ⭐ para " + l.name); return; }
    S.stars -= l.cost; S.lendas[id] = true;
    A.sfx.prestige();
    R.toast(l.icon, "Lenda desbloqueada!", l.name);
    refreshActiveTab();
    afterChange();
  }

  // equipar/desequipar cosmético (Guarda-Roupa)
  function equipCosmetic(id) {
    if (!C.equip(S, id)) { A.sfx.error(); return; }
    C.applyToSvg(S);
    A.sfx.upgrade();
    R.updateHud(S, liveCps(), liveClick());   // bônus do cosmético reflete na hora
    if (tab === "visual") R.renderVisual(S);
    afterChange();
  }

  function askPrestige() {
    const ganho = E.starsOnPrestige(S);
    if (ganho <= 0) {
      R.modal("Ainda não dá pra renascer 🫏",
        "Você ganha estrelas acumulando moedas no total. Falta um pouco!<br><br>" +
        "<small>" + prestigeNeedText() + "</small>",
        [{ label: "Beleza", cls: "yes", fn: R.closeModal }]);
      return;
    }
    R.modal("Renascer? 🔄⭐",
      "Você vai <b>zerar moedas, geradores e upgrades</b> desta vida.<br>" +
      "Em troca ganha <b>" + U.fmt(ganho) + " estrela(s)</b> — bônus de produção <b>permanente</b> e poder de comprar Lendas.<br><br>" +
      "Vale muito a pena quando o progresso travar. As Lendas e conquistas continuam!",
      [
        { label: "Renascer (+" + U.fmt(ganho) + "⭐)", cls: "yes", fn: () => { R.closeModal(); doPrestige(); } },
        { label: "Agora não", cls: "no", fn: R.closeModal },
      ]);
  }

  function doPrestige() {
    const ganho = E.starsOnPrestige(S);
    if (ganho <= 0) return;
    S.prestige += ganho;
    S.stars += ganho;
    // zera a vida atual (mantém prestige, stars, lendas, achs, goldenCaught, lifetimeAll)
    S.coins = 0; S.lifetime = 0; S.gens = {}; S.ups = {};
    // Herança do Vovô
    if (S.lendas.heranca) { S.gens.cenoura = 10; S.gens.pasto = 5; }
    B.clear();
    A.sfx.prestige(); FX.confetti(90);
    NEWS.flash("Um novo império de jegues renasce das cinzas! ⭐");
    R.toast("⭐", "Renasceu!", "+" + U.fmt(ganho) + " estrelas. Bora de novo!");
    R.resetSigs();
    SFX.reset(); SFX.applyProgress(S); C.applyToSvg(S);
    R.buildGenCards(S);
    refreshActiveTab();
    afterChange();
  }

  function prestigeNeedText() {
    const have = S.prestige;
    const need = E.lifetimeForStar(have + 1);
    return "Falta acumular " + U.fmt(Math.max(0, need - S.lifetimeAll)) + " moedas no total para a 1ª estrela.";
  }

  /* ---------- TROCA DE ABA ---------- */
  function setTab(t) {
    tab = t; R.setActiveTab(t);
    if (t === "estabulo") { R.buildGenCards(S); R.refreshGenCards(S, qty); }
    else if (t === "loja") R.renderStore(S);
    else if (t === "lendas") R.renderLendas(S);
    else if (t === "conquistas") R.renderAchs(S);
    else if (t === "visual") R.renderVisual(S);
  }
  function setQty(q) { qty = q; if (tab === "estabulo") R.refreshGenCards(S, qty); }
  // atualiza só o conteúdo da aba atual (sem reconstruir do zero)
  function refreshActiveTab() {
    if (tab === "estabulo") R.refreshGenCards(S, qty);
    else if (tab === "loja") R.renderStore(S);
    else if (tab === "lendas") R.renderLendas(S);
    else if (tab === "conquistas") R.renderAchs(S);
    else if (tab === "visual") R.renderVisual(S);
  }

  /* ---------- JEGUE DOURADO ---------- */
  function spawnGolden() {
    const g = U.$("#golden"); if (!g) return;
    const pad = 60;
    const scene = U.$("#scene"); const w = scene.clientWidth, h = scene.clientHeight;
    g.style.left = U.rng(pad, Math.max(pad, w - pad)) + "px";
    g.style.top = U.rng(pad, Math.max(pad, h - pad * 1.6)) + "px";
    g.classList.add("show");
    A.sfx.golden();
    const durMult = (S.lendas.sorte ? 1.5 : 1) * E.cosmeticGolden(S);
    g._until = performance.now() + CFG.GOLDEN_LIFE_S * durMult * 1000;
  }
  function hideGolden() { const g = U.$("#golden"); if (g) g.classList.remove("show"); }

  function catchGolden() {
    const g = U.$("#golden"); if (!g || !g.classList.contains("show")) return;
    hideGolden();
    S.goldenCaught++;
    A.sfx.catch();
    const def = B.rollGolden();
    if (def.type === "lump") {
      const lump = Math.max(liveCps() * 70, S.coins * 0.12, liveClick() * 50);
      S.coins += lump; S.lifetime += lump; S.lifetimeAll += lump;
      R.toast("🪙", def.name, "+" + U.fmt(lump) + " moedas!");
      const r = g.getBoundingClientRect(), sr = U.$("#scene").getBoundingClientRect();
      FX.floaty(r.left - sr.left, r.top - sr.top, "+" + U.fmt(lump), "big");
      FX.burst(r.left - sr.left, r.top - sr.top, ["🪙", "💰", "💛"]);
    } else {
      B.add(def, performance.now(), (S.lendas.sorte ? 1.5 : 1) * E.cosmeticGolden(S));
      R.toast("🌟", def.name, def.msg);
      FX.confetti(40);
    }
    R.resetSigs();
    afterChange();
  }

  /* ---------- MINI-EVENTOS ---------- */
  function fireEvent() {
    const def = B.rollEvent();
    B.add(def, performance.now(), 1);
    A.sfx.event();
    R.toast(def.icon, def.name, def.msg);
  }

  /* ---------- pós-mudança: salva sinais e checa conquistas ---------- */
  function afterChange() {
    const novas = ACH.check(S);
    novas.forEach((a) => { A.sfx.ach(); R.toast(a.icon, "Conquista: " + a.name, a.desc); FX.confetti(24); });
    // novos visuais desbloqueados pelo Guarda-Roupa
    const visuais = C.checkUnlocks(S);
    visuais.forEach((c) => { A.sfx.ach(); R.toast(c.icon, "Novo visual: " + c.name, "Desbloqueado no Guarda-Roupa! 👕"); });
    if (novas.length || visuais.length) R.resetSigs();
  }

  /* ---------- LOOP PRINCIPAL ---------- */
  function loop(now) {
    try {
      if (!lastTick) lastTick = now;
      const dt = Math.min(1000, now - lastTick) / 1000; // segundos
      lastTick = now;

      // produção passiva
      const cpsNow = liveCps();
      if (cpsNow > 0) { const ganho = cpsNow * dt; S.coins += ganho; S.lifetime += ganho; S.lifetimeAll += ganho; }

      // expira buffs
      if (B.tick(now)) R.resetSigs();

      // jegue dourado
      if (now >= nextGolden) {
        spawnGolden();
        const freq = S.lendas.sorte ? 0.6 : 1;
        nextGolden = now + U.rng(CFG.GOLDEN_MIN_S, CFG.GOLDEN_MAX_S) * freq * 1000;
      }
      const g = U.$("#golden");
      if (g && g.classList.contains("show") && g._until && now > g._until) hideGolden();

      // mini-eventos
      if (now >= nextEvent) {
        fireEvent();
        const freq = S.lendas.berrante ? 0.5 : 1;
        nextEvent = now + U.rng(CFG.EVENT_MIN_S, CFG.EVENT_MAX_S) * freq * 1000;
      }

      // HUD + barra de buffs sempre; aba ativa atualiza leve
      R.updateHud(S, cpsNow, liveClick());
      R.refreshBuffs(now);
      SFX.applyBuffs(B.activeList(now));   // o cenário reage aos poderes ativos
      SFX.applyProgress(S);                // a fazenda evolui com os geradores
      if (tab === "estabulo") R.refreshGenCards(S, qty);
      else if (tab === "loja") R.renderStore(S);
      else if (tab === "lendas") R.renderLendas(S);
      else if (tab === "conquistas") R.renderAchs(S);
      else if (tab === "visual") R.renderVisual(S);

      // conquistas dependentes de cps/coins acumulado
      afterChange();

      // autosave
      if (now - lastSave > CFG.SAVE_EVERY_MS) { lastSave = now; S.lastSeen = Date.now(); STORE.save(S); }
    } catch (e) {
      console.error("[JEGUE] erro no loop:", e);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- GANHOS OFFLINE ---------- */
  function applyOffline() {
    const elapsed = Math.max(0, (Date.now() - (S.lastSeen || Date.now())) / 1000);
    if (elapsed < 30) return; // ignora ausências curtas
    const cap = Math.min(elapsed, CFG.OFFLINE_CAP_H * 3600);
    const eff = S.lendas.saojorge ? 0.85 : CFG.OFFLINE_EFF;
    const ganho = E.cpsRaw(S) * cap * eff;
    if (ganho <= 0) return;
    S.coins += ganho; S.lifetime += ganho; S.lifetimeAll += ganho; S.gotOffline = true;
    R.modal("Bem-vindo de volta! 🌙🫏",
      "Seus jegues trabalharam por <b>" + U.fmt(cap) + "s</b> enquanto você estava fora.<br><br>" +
      "Você ganhou <b>" + U.fmt(ganho) + "</b> moedas!<br>" +
      "<small style='opacity:.7'>(eficiência offline " + Math.round(eff * 100) + "%, máx " + CFG.OFFLINE_CAP_H + "h)</small>",
      [{ label: "Receba! 🤑", cls: "yes", fn: R.closeModal }]);
  }

  /* ---------- INIT (à prova de falhas) ---------- */
  async function init() {
    // 1) carrega (síncrono) — não pode travar
    let data = STORE.load();
    if (!data) {
      try { const cloud = await Promise.race([STORE.loadFromCloud(), new Promise((r) => setTimeout(() => r(null), 800))]); if (cloud) data = cloud; }
      catch (e) {}
    }
    if (data && typeof data === "object") {
      S = Object.assign(ST.newState(), data);
      S.gens = data.gens || {}; S.ups = data.ups || {}; S.lendas = data.lendas || {}; S.achs = data.achs || {};
    }

    // 2) prepara render
    R.init();
    A.setEnabled(S.sound !== false);
    R.buildGenCards(S);
    if (S.clicks > 0) R.hideTapHint();

    // 2b) cosméticos: marca como "já visto" o que já está desbloqueado (sem spam de toast)
    //     e aplica pelagem/acessórios equipados + decorações de progresso no cenário
    if (!S.equip || !S.equip.pele) S.equip = Object.assign({ pele: "pele_cinza" }, S.equip || {});
    C.checkUnlocks(S);
    C.applyToSvg(S);
    SFX.reset(); SFX.applyProgress(S);

    // 3) ganhos offline
    applyOffline();

    // 4) timers iniciais
    const now = performance.now();
    nextGolden = now + U.rng(20, 45) * 1000;       // primeiro dourado relativamente cedo
    nextEvent = now + U.rng(60, 120) * 1000;

    // 5) news + primeira pintura
    NEWS.start(U.$("#news"));
    setTab("estabulo");
    R.updateHud(S, liveCps(), liveClick());

    // 6) loop
    started = true;
    requestAnimationFrame(loop);
  }

  function getState() { return S; }
  function hardReset() {
    STORE.wipe(); S = ST.newState(); B.clear(); R.resetSigs();
    C.checkUnlocks(S); C.applyToSvg(S); SFX.reset(); SFX.applyProgress(S);
    R.buildGenCards(S); R.hideTapHint(); R.showTapHint(); setTab("estabulo");
    R.updateHud(S, 0, 1);
  }
  function manualSave() { S.lastSeen = Date.now(); return STORE.save(S); }
  function markSeen() { S.lastSeen = Date.now(); }

  root.JT.game = {
    init, doClick, buyGen, buyUpgrade, buyLenda, equipCosmetic, askPrestige, catchGolden,
    setTab, setQty, getState, hardReset, manualSave, markSeen,
    toggleSound: () => { S.sound = !S.sound; A.setEnabled(S.sound); return S.sound; },
    toggleMusic: () => { S.music = !S.music; A.setMusic(S.music); return S.music; },
  };
})(window);
