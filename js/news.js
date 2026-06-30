/* ============================================================
   news.js — LETREIRO DE NOTÍCIAS (news ticker)
   Manchetes humorísticas que passam rolando, estilo Cookie Clicker.
   ============================================================ */
(function (root) {
  "use strict";
  const CFG = root.JT.config;
  const U = root.JT.util;
  let el = null, timer = null, last = -1;

  function next() {
    if (!el) return;
    let i = U.randi(0, CFG.NEWS.length - 1);
    if (i === last && CFG.NEWS.length > 1) i = (i + 1) % CFG.NEWS.length;
    last = i;
    el.classList.remove("news-in");
    void el.offsetWidth;
    el.textContent = "📰 " + CFG.NEWS[i];
    el.classList.add("news-in");
  }

  function start(element) {
    el = element;
    next();
    clearInterval(timer);
    timer = setInterval(next, 11000);
  }

  // permite empurrar uma manchete especial (ex.: ao renascer)
  function flash(text) {
    if (!el) return;
    el.classList.remove("news-in"); void el.offsetWidth;
    el.textContent = "📰 " + text;
    el.classList.add("news-in");
  }

  root.JT.news = { start, next, flash };
})(window);
