/* ============================================================
   util.js — FUNÇÕES UTILITÁRIAS (sem estado, sem DOM pesado)
   Formatação de números grandes, sorteios, tempo, atalhos de DOM.
   ============================================================ */
(function (root) {
  "use strict";

  // sufixos pt-BR para números enormes (estilo idle game)
  const SUF = ["", "K", "Mi", "Bi", "Tri", "Qa", "Qi", "Sx", "St", "Oc", "No",
               "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Std", "Ocd", "Nod", "Vg"];

  function fmt(n) {
    if (n == null || isNaN(n)) return "0";
    if (n < 0) return "-" + fmt(-n);
    if (n < 1000) {
      // mostra casas decimais só quando faz sentido
      if (n < 10 && n % 1 !== 0) return (Math.floor(n * 10) / 10).toString();
      return Math.floor(n).toString();
    }
    let tier = Math.floor(Math.log10(n) / 3);
    if (tier >= SUF.length) {
      // notação científica para além da tabela
      return n.toExponential(2).replace("e+", "e");
    }
    const scaled = n / Math.pow(1000, tier);
    const str = scaled >= 100 ? scaled.toFixed(0)
              : scaled >= 10 ? scaled.toFixed(1)
              : scaled.toFixed(2);
    return str.replace(/\.?0+$/, "") + " " + SUF[tier];
  }

  // tempo curto: 1h 02m, 45m 10s, 30s
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
    if (m > 0) return m + "m " + String(sec).padStart(2, "0") + "s";
    return sec + "s";
  }

  const rng = (min, max) => Math.random() * (max - min) + min;
  const randi = (min, max) => Math.floor(rng(min, max + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // sorteio ponderado (para os buffs do jegue dourado)
  function weighted(arr) {
    const total = arr.reduce((s, x) => s + (x.weight || 1), 0);
    let r = Math.random() * total;
    for (const x of arr) { r -= (x.weight || 1); if (r <= 0) return x; }
    return arr[arr.length - 1];
  }

  // atalhos de DOM (só no browser)
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const UTIL = { fmt, fmtTime, rng, randi, pick, clamp, weighted, $, $$ };

  root.JT = root.JT || {};
  root.JT.util = UTIL;
  if (typeof module !== "undefined" && module.exports) module.exports = UTIL;
})(typeof window !== "undefined" ? window : globalThis);
