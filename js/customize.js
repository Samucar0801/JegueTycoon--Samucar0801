/* ============================================================
   customize.js — GUARDA-ROUPA DO JEGUE
   Desbloqueia cosméticos por progresso, equipa por slot e aplica
   a pelagem (cores via variáveis CSS) e os acessórios (grupos SVG)
   no jegue da tela.
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = root.JT.config, ST = root.JT.state, U = root.JT.util;

  const BY_ID = {};
  CFG.COSMETICS.forEach((c) => (BY_ID[c.id] = c));

  function helpers(S) {
    return { totalGens: ST.totalGens, totalUps: ST.totalUps, totalLendas: ST.totalLendas };
  }
  function isUnlocked(c, S) {
    try { return !!c.unlock(S, helpers(S)); } catch (e) { return false; }
  }

  // desbloqueios novos (pra avisar com toast 1x)
  function checkUnlocks(S) {
    const novas = [];
    CFG.COSMETICS.forEach((c) => {
      if (S.cosmoSeen[c.id]) return;
      if (isUnlocked(c, S)) { S.cosmoSeen[c.id] = true; if (c.id !== "pele_cinza") novas.push(c); }
    });
    return novas;
  }

  function bySlot(slotId, S) {
    return CFG.COSMETICS.filter((c) => c.slot === slotId).map((c) => ({
      def: c, unlocked: isUnlocked(c, S), equipped: (S.equip[c.slot] === c.id),
    }));
  }

  // equipa/desequipa. Pelagem sempre tem uma. Acessório: clicar de novo tira.
  function equip(S, id) {
    const c = BY_ID[id]; if (!c) return false;
    if (!isUnlocked(c, S)) return false;
    if (c.kind === "skin") { S.equip.pele = id; }
    else { S.equip[c.slot] = (S.equip[c.slot] === id) ? null : id; }
    return true;
  }

  // aplica visual no SVG
  function applyToSvg(S) {
    const svg = U.$("#jegue");
    const wrap = U.$("#jegue-wrap");
    if (!svg) return;
    // pelagem
    const skin = BY_ID[S.equip.pele] || BY_ID.pele_cinza;
    if (skin && skin.vars) {
      svg.style.setProperty("--coat", skin.vars.coat);
      svg.style.setProperty("--coat-lt", skin.vars.lt);
      svg.style.setProperty("--mane", skin.vars.mane);
      svg.style.setProperty("--muz", skin.vars.muz);
      svg.style.setProperty("--tail", skin.vars.tail);
    }
    // brilho especial
    if (wrap) { wrap.classList.remove("glow-gold", "glow-cosmic"); if (skin && skin.glow) wrap.classList.add("glow-" + skin.glow); }

    // acessórios: mostra os equipados, esconde o resto
    const equippedSvgIds = {};
    for (const slot in S.equip) { const c = BY_ID[S.equip[slot]]; if (c && c.svg) equippedSvgIds[c.svg] = (c.glow || true); }
    CFG.COSMETICS.forEach((c) => {
      if (!c.svg) return;
      const g = document.getElementById("acc-" + c.svg);
      if (g) g.style.display = equippedSvgIds[c.svg] ? "" : "none";
    });
  }

  function countUnlocked(S) { return CFG.COSMETICS.filter((c) => isUnlocked(c, S)).length; }

  root.JT.customize = { isUnlocked, checkUnlocks, bySlot, equip, applyToSvg, countUnlocked, BY_ID };
})(window);
