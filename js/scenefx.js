/* ============================================================
   scenefx.js — O CENÁRIO REAGE AO JOGO
   1) Buffs ativos mudam o clima da cena (festa, turbo, forró, cósmico…)
      pra dar feedback visual claro de que você pegou o poder.
   2) A fazenda evolui conforme você desbloqueia geradores (decorações).
   ============================================================ */
(function (root) {
  "use strict";
  const U = root.JT.util;

  // buff base id -> classe de cena
  const BUFF_CLASS = {
    festa: "sc-festa", turbo: "sc-turbo", frenetico: "sc-forro", cosmico: "sc-cosmico",
    vaquejada: "sc-vaquejada", feira: "sc-feira", chuva_boa: "sc-chuva", viral: "sc-viral",
  };
  const ALL_BUFF_CLASSES = Object.values(BUFF_CLASS);
  let lastSig = "";

  function applyBuffs(activeList) {
    const scene = U.$("#scene"); if (!scene) return;
    const want = {};
    activeList.forEach((b) => { const cls = BUFF_CLASS[b.baseId]; if (cls) want[cls] = true; });
    const sig = Object.keys(want).sort().join(",");
    if (sig === lastSig) return;
    lastSig = sig;
    ALL_BUFF_CLASSES.forEach((c) => scene.classList.toggle(c, !!want[c]));
    scene.classList.toggle("sc-buffed", Object.keys(want).length > 0);
  }

  // decorações reveladas por progresso
  const DECOR = [
    { gen: "forro",      el: "dec-forro" },
    { gen: "vaquejada",  el: "dec-vaquejada" },
    { gen: "parque",     el: "dec-parque" },
    { gen: "influencer", el: "dec-influencer" },
    { gen: "espaco",     el: "dec-espaco" },
    { gen: "multi",      el: "dec-multi" },
  ];
  let lastDecor = "";
  function applyProgress(S) {
    const sig = DECOR.map((d) => ((S.gens[d.gen] || 0) > 0 ? 1 : 0)).join("");
    if (sig === lastDecor) return;
    lastDecor = sig;
    DECOR.forEach((d) => { const e = document.getElementById(d.el); if (e) e.style.display = (S.gens[d.gen] || 0) > 0 ? "" : "none"; });
  }

  function reset() { lastSig = ""; lastDecor = ""; }

  root.JT.scenefx = { applyBuffs, applyProgress, reset };
})(window);
