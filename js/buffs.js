/* ============================================================
   buffs.js — BUFFS TEMPORÁRIOS, JEGUE DOURADO E MINI-EVENTOS
   Guarda a lista de buffs ativos (não salva — são temporários) e
   calcula os multiplicadores de produção/clique que estão valendo.
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = root.JT.config;
  const U = root.JT.util;
  let active = []; // { id, name, type, mult, endsAt }

  function tick(now) {
    const before = active.length;
    active = active.filter((b) => b.endsAt > now);
    return active.length !== before;
  }

  function add(def, now, durMult) {
    const dur = (def.dur || 10) * (durMult || 1);
    active.push({
      id: def.id + "_" + now,
      baseId: def.id,
      name: def.name,
      type: def.type,
      mult: def.mult,
      endsAt: now + dur * 1000,
    });
  }

  function prodFactor() {
    let m = 1;
    for (const b of active) if (b.type === "prod" || b.type === "both") m *= b.mult;
    return m;
  }
  function clickFactor() {
    let m = 1;
    for (const b of active) if (b.type === "click" || b.type === "both") m *= b.mult;
    return m;
  }

  function activeList(now) {
    return active.map((b) => ({
      baseId: b.baseId,
      name: b.name,
      type: b.type,
      mult: b.mult,
      secsLeft: Math.max(0, Math.ceil((b.endsAt - now) / 1000)),
    }));
  }

  function rollGolden() { return U.weighted(CFG.BUFFS); }
  function rollEvent() { return U.pick(CFG.EVENTS); }
  function clear() { active = []; }
  function count() { return active.length; }

  root.JT.buffs = { tick, add, prodFactor, clickFactor, activeList, rollGolden, rollEvent, clear, count };
})(window);
