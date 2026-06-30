/* ============================================================
   achievements.js — CONQUISTAS
   Avalia as condições e devolve as recém-desbloqueadas (pra toast).
   Cada conquista vale +1% global (somado em economy.permanentMult).
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = root.JT.config;
  const E = root.JT.economy;
  const ST = root.JT.state;

  // helpers que algumas conquistas usam
  function helpers(S) {
    return {
      totalGens: ST.totalGens,
      totalUps: ST.totalUps,
      totalLendas: ST.totalLendas,
      cps: () => E.cpsRaw(S),
    };
  }

  // verifica tudo; marca em S.achs; retorna lista das novas
  function check(S) {
    const h = helpers(S);
    const novas = [];
    for (const a of CFG.ACHS) {
      if (S.achs[a.id]) continue;
      let got = false;
      try { got = !!a.test(S, h); } catch (e) { got = false; }
      if (got) { S.achs[a.id] = true; novas.push(a); }
    }
    return novas;
  }

  root.JT.ach = { check, helpers };
})(window);
