/* ============================================================
   economy.js — LÓGICA ECONÔMICA (FUNÇÕES PURAS, SEM DOM)
   Tudo aqui é matemática testável: custo, compra em lote,
   marcos, produção por segundo, valor do clique e prestígio.
   Como não toca no DOM, dá pra rodar e testar no Node.
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = (root.JT && root.JT.config) ? root.JT.config
            : (typeof require !== "undefined" ? require("./config.js") : null);
  const ST = (root.JT && root.JT.state) ? root.JT.state
            : (typeof require !== "undefined" ? require("./state.js") : null);

  const genById = {};
  CFG.GENERATORS.forEach((g) => (genById[g.id] = g));

  /* ---------- CUSTOS ---------- */
  // preço da PRÓXIMA unidade, dado quantas já tem
  function cost(gen, owned) {
    return Math.ceil(gen.baseCost * Math.pow(gen.growth, owned));
  }
  // custo total para comprar `qty` unidades de uma vez (soma geométrica)
  function bulkCost(gen, owned, qty) {
    const r = gen.growth;
    const first = gen.baseCost * Math.pow(r, owned);
    return Math.ceil(first * (Math.pow(r, qty) - 1) / (r - 1));
  }
  // quantas unidades dá pra comprar com `coins` (forma fechada)
  function maxAfford(gen, owned, coins) {
    const r = gen.growth;
    const first = gen.baseCost * Math.pow(r, owned);
    const val = coins * (r - 1) / first + 1;
    if (val <= 1) return 0;
    return Math.max(0, Math.floor(Math.log(val) / Math.log(r)));
  }
  // resolve o custo conforme a quantidade escolhida (1/10/100/Máx)
  function priceFor(S, gen, qty) {
    const owned = S.gens[gen.id] || 0;
    if (qty === "max") {
      const n = maxAfford(gen, owned, S.coins);
      return { n, total: n > 0 ? bulkCost(gen, owned, n) : Infinity };
    }
    return { n: qty, total: bulkCost(gen, owned, qty) };
  }

  /* ---------- MARCOS ---------- */
  function milestoneMult(owned) {
    let m = 1;
    for (const t of CFG.MILESTONES) if (owned >= t) m *= 2;
    return m;
  }
  function nextMilestone(owned) {
    for (const t of CFG.MILESTONES) if (owned < t) return t;
    return null;
  }

  /* ---------- UPGRADES DE GERADOR (gerados automaticamente) ----------
     Cada gerador ganha 4 upgrades que multiplicam só a produção dele,
     liberados conforme você compra mais unidades. Conteúdo "de graça".
  */
  const GEN_TIERS = [
    { at: 10,  mult: 2, label: "Ferradura Nova" },
    { at: 25,  mult: 3, label: "Treinamento Especial" },
    { at: 50,  mult: 2, label: "Turbo do Sertão" },
    { at: 100, mult: 2, label: "Lenda Local" },
  ];
  let _genUps = null;
  function genUpgrades() {
    if (_genUps) return _genUps;
    _genUps = [];
    CFG.GENERATORS.forEach((g) => {
      GEN_TIERS.forEach((t, i) => {
        _genUps.push({
          id: "g_" + g.id + "_" + t.at,
          name: t.label + " — " + g.name,
          icon: g.icon,
          cost: Math.ceil(cost(g, t.at) * 12),
          kind: "genMult",
          genId: g.id,
          at: t.at,
          mult: t.mult,
          desc: g.name + " produz x" + t.mult + " (precisa de " + t.at + " unidades).",
        });
      });
    });
    return _genUps;
  }
  // todos os upgrades (mão + gerados), util pra loja
  function allUpgrades() {
    return CFG.UPGRADES.concat(genUpgrades());
  }
  function upgradeById(id) {
    return allUpgrades().find((u) => u.id === id) || null;
  }

  /* ---------- MULTIPLICADORES ---------- */
  // bônus que valem pra TUDO (produção e clique)
  function permanentMult(S) {
    const starBonus = S.lendas.cosmico ? 0.03 : CFG.STAR_BONUS;
    let m = (1 + S.prestige * starBonus);            // prestígio
    m *= (1 + ST.totalAchs(S) * 0.01);               // conquistas: +1% cada
    if (S.lendas.rei) m *= 2;                         // Lenda Rei do Sertão
    return m;
  }
  // multiplicador global de PRODUÇÃO
  function prodMult(S) {
    let m = permanentMult(S);
    CFG.UPGRADES.forEach((u) => {
      if (S.ups[u.id] && u.kind === "globalMult") m *= u.mult;
    });
    if (S.lendas.sangue) m *= 1.5;                    // Lenda Sangue de Campeão
    m *= cosmeticProd(S);                              // bônus de cosméticos equipados
    return m;
  }
  // multiplicador de CLIQUE (sem o carinho, que é somado à parte)
  function clickMult(S) {
    let m = permanentMult(S);
    CFG.UPGRADES.forEach((u) => {
      if (S.ups[u.id] && u.kind === "clickMult") m *= u.mult;
    });
    if (S.lendas.maos) m *= 3;                        // Lenda Mãos de Ouro
    m *= cosmeticClick(S);                             // bônus de cosméticos equipados
    return m;
  }
  // maior % de carinho comprado (clique ganha % da produção/seg)
  function carinhoPct(S) {
    let p = 0;
    CFG.UPGRADES.forEach((u) => {
      if (S.ups[u.id] && u.kind === "carinho") p = Math.max(p, u.pct);
    });
    return p;
  }

  /* ---------- COSMÉTICOS EQUIPADOS (bônus do Guarda-Roupa) ---------- */
  const COSMO_BY_ID = {};
  (CFG.COSMETICS || []).forEach((c) => (COSMO_BY_ID[c.id] = c));
  function equippedCosmetics(S) {
    const out = [];
    const eq = S.equip || {};
    for (const slot in eq) { const c = COSMO_BY_ID[eq[slot]]; if (c) out.push(c); }
    return out;
  }
  function cosmeticMult(S, kinds) {
    let m = 1;
    equippedCosmetics(S).forEach((c) => {
      if (c.bonus && kinds.indexOf(c.bonus.kind) >= 0) m *= c.bonus.mult;
    });
    return m;
  }
  const cosmeticProd  = (S) => cosmeticMult(S, ["prod", "all"]);
  const cosmeticClick = (S) => cosmeticMult(S, ["click", "all"]);
  const cosmeticGolden = (S) => cosmeticMult(S, ["golden"]);   // estende duração do dourado
  const cosmeticOffline = (S) => cosmeticMult(S, ["offline"]); // eficiência offline
  // multiplicador de produção só de UM gerador (marcos + upgrades dele)
  function genUpMult(S, genId) {
    let m = 1;
    genUpgrades().forEach((u) => {
      if (u.genId === genId && S.ups[u.id]) m *= u.mult;
    });
    return m;
  }

  /* ---------- PRODUÇÃO ---------- */
  // produção/seg de um gerador (com marcos e upgrades dele, SEM global)
  function genBase(S, genId) {
    const g = genById[genId];
    const owned = S.gens[genId] || 0;
    if (!g || owned <= 0) return 0;
    return g.baseProd * owned * milestoneMult(owned) * genUpMult(S, genId);
  }
  // soma de todos os geradores, SEM multiplicador global
  function rawBase(S) {
    let sum = 0;
    for (const g of CFG.GENERATORS) sum += genBase(S, g.id);
    return sum;
  }
  // produção/seg final, SEM buffs temporários (usada em cálculos estáveis)
  function cpsRaw(S) {
    return rawBase(S) * prodMult(S);
  }
  // produção/seg final COM buffs temporários
  function cps(S, buffProd) {
    return cpsRaw(S) * (buffProd || 1);
  }

  /* ---------- CLIQUE ---------- */
  // valor de um clique (carinho usa cpsRaw pra não oscilar com buffs)
  function clickValue(S, buffClick) {
    const base = 1 * clickMult(S);
    const carinho = carinhoPct(S) * cpsRaw(S);
    return (base + carinho) * (buffClick || 1);
  }

  /* ---------- PRESTÍGIO ---------- */
  // quantas estrelas você ganharia renascendo agora
  function starsOnPrestige(S) {
    const earned = Math.floor(Math.sqrt(S.lifetimeAll / CFG.STAR_DIVISOR));
    return Math.max(0, earned - S.prestige);
  }
  // quanto falta de lifetimeAll pra próxima estrela
  function lifetimeForStar(stars) {
    return Math.pow(stars, 2) * CFG.STAR_DIVISOR;
  }

  const ECON = {
    genById, cost, bulkCost, maxAfford, priceFor,
    milestoneMult, nextMilestone,
    genUpgrades, allUpgrades, upgradeById, GEN_TIERS,
    permanentMult, prodMult, clickMult, carinhoPct, genUpMult,
    cosmeticProd, cosmeticClick, cosmeticGolden, cosmeticOffline, equippedCosmetics,
    genBase, rawBase, cpsRaw, cps, clickValue,
    starsOnPrestige, lifetimeForStar,
  };

  root.JT = root.JT || {};
  root.JT.economy = ECON;
  if (typeof module !== "undefined" && module.exports) module.exports = ECON;
})(typeof window !== "undefined" ? window : globalThis);
