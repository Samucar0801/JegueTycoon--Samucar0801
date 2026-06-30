/* ============================================================
   storage.js — SALVAR / CARREGAR (à prova de falhas)
   Prioriza localStorage (funciona em deploy e abrindo o arquivo).
   Se existir window.storage (preview do Claude), usa também.
   NADA aqui pode travar o init: tudo em try/catch e síncrono.
   ============================================================ */
(function (root) {
  "use strict";
  const KEY = root.JT.config.SAVE_KEY;

  function save(S) {
    let str;
    try { str = JSON.stringify(S); } catch (e) { return false; }
    let ok = false;
    try { localStorage.setItem(KEY, str); ok = true; } catch (e) {}
    // espelha no window.storage do preview, sem bloquear (fire-and-forget)
    try {
      if (root.storage && typeof root.storage.set === "function") {
        Promise.resolve(root.storage.set(KEY, str)).catch(() => {});
      }
    } catch (e) {}
    return ok;
  }

  // load é SÍNCRONO (lê localStorage). Devolve objeto ou null.
  function load() {
    let str = null;
    try { str = localStorage.getItem(KEY); } catch (e) {}
    if (!str) return null;
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  // tenta migrar de um save do preview (window.storage) caso localStorage esteja vazio.
  // assíncrono e opcional — chamado no init com await curto e protegido.
  async function loadFromCloud() {
    try {
      if (root.storage && typeof root.storage.get === "function") {
        const r = await root.storage.get(KEY);
        if (r && r.value) return JSON.parse(r.value);
      }
    } catch (e) {}
    return null;
  }

  function wipe() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { if (root.storage && root.storage.delete) Promise.resolve(root.storage.delete(KEY)).catch(() => {}); } catch (e) {}
  }

  root.JT.storage = { save, load, loadFromCloud, wipe, KEY };
})(window);
