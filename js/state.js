/* ============================================================
   state.js — ESTADO DO JOGO
   Um único objeto "S" guarda TUDO que precisa ser salvo.
   newState() devolve um estado limpo. Aqui também ficam contadores
   derivados simples (quantos geradores/upgrades/lendas no total).
   ============================================================ */
(function (root) {
  "use strict";

  function newState() {
    return {
      v: 2,
      coins: 0,            // saldo atual
      lifetime: 0,         // total ganho nesta "vida" (zera ao renascer)
      lifetimeAll: 0,      // total ganho em todas as vidas (base do prestígio)
      clicks: 0,           // cliques no jegue
      gens: {},            // { genId: quantidade }
      ups: {},             // { upgradeId: true }
      lendas: {},          // { lendaId: true }
      achs: {},            // { achId: true }
      prestige: 0,         // estrelas acumuladas (high-water) -> bônus permanente
      stars: 0,            // estrelas disponíveis pra gastar em Lendas
      goldenCaught: 0,     // jegues dourados pegos
      equip: { pele: "pele_cinza" }, // cosméticos equipados por slot
      cosmoSeen: {},       // cosméticos já desbloqueados (pra avisar 1x)
      sound: true,         // som ligado?
      music: false,        // música ambiente ligada?
      gotOffline: false,   // já recebeu ganho offline alguma vez?
      lastSeen: Date.now(),// pra calcular tempo offline
      started: Date.now(), // quando começou a jogar
    };
  }

  // contadores derivados (usados por conquistas e UI)
  const totalGens   = (S) => Object.values(S.gens || {}).reduce((a, b) => a + b, 0);
  const totalUps    = (S) => Object.keys(S.ups || {}).length;
  const totalLendas = (S) => Object.keys(S.lendas || {}).length;
  const totalAchs   = (S) => Object.keys(S.achs || {}).length;

  const STATE = { newState, totalGens, totalUps, totalLendas, totalAchs };

  root.JT = root.JT || {};
  root.JT.state = STATE;
  if (typeof module !== "undefined" && module.exports) module.exports = STATE;
})(typeof window !== "undefined" ? window : globalThis);
