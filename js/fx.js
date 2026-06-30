/* ============================================================
   fx.js — EFEITOS VISUAIS
   Texto flutuante, explosão de partículas, confete, tremor de tela,
   ondinha de clique. Tudo respeitando "reduzir movimento".
   ============================================================ */
(function (root) {
  "use strict";
  const U = root.JT.util;
  let scene = null;
  let reduce = false;

  function init(sceneEl) {
    scene = sceneEl;
    try { reduce = matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) { reduce = false; }
  }

  function floaty(x, y, txt, cls) {
    if (!scene) return;
    const f = document.createElement("div");
    f.className = "floaty" + (cls ? " " + cls : "");
    f.textContent = txt;
    f.style.left = x + "px"; f.style.top = y + "px";
    scene.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }

  const PARTS = ["🪙", "🥕", "✨", "🌟", "💛", "🌾"];
  function burst(x, y, set, count) {
    if (!scene || reduce) return;
    const arr = set || PARTS;
    const n = count || U.randi(4, 7);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.textContent = U.pick(arr);
      p.style.left = x + "px"; p.style.top = y + "px";
      p.style.setProperty("--dx", U.rng(-70, 70) + "px");
      p.style.setProperty("--dy", U.rng(-110, -40) + "px");
      p.style.setProperty("--dr", U.rng(-200, 200) + "deg");
      scene.appendChild(p);
      setTimeout(() => p.remove(), 850);
    }
  }

  // mostra a "ferramenta" de clique (dedo/luva/etc.) dando um tapinha — feedback claro
  function tool(x, y, icon) {
    if (!scene || !icon) return;
    const t = document.createElement("div");
    t.className = "clicktool";
    t.textContent = icon;
    t.style.left = x + "px"; t.style.top = y + "px";
    scene.appendChild(t);
    setTimeout(() => t.remove(), 480);
  }

  function ripple(x, y) {
    if (!scene || reduce) return;
    const r = document.createElement("div");
    r.className = "ripple";
    r.style.left = x + "px"; r.style.top = y + "px";
    scene.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }

  function shake(el, big) {
    if (!el || reduce) return;
    el.classList.remove("shake", "shake-big");
    void el.offsetWidth;
    el.classList.add(big ? "shake-big" : "shake");
    setTimeout(() => el.classList.remove("shake", "shake-big"), 600);
  }

  const CONF = ["#ffd23f", "#ff8c42", "#6a994e", "#e76f51", "#a7c957", "#4cc9f0"];
  function confetti(amount) {
    if (reduce) return;
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    document.body.appendChild(layer);
    const n = amount || 60;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = U.rng(0, 100) + "vw";
      c.style.background = U.pick(CONF);
      c.style.setProperty("--fall", U.rng(1.6, 3.2) + "s");
      c.style.setProperty("--delay", U.rng(0, 0.8) + "s");
      c.style.setProperty("--rot", U.rng(-360, 360) + "deg");
      c.style.width = U.rng(6, 12) + "px";
      c.style.height = U.rng(8, 16) + "px";
      layer.appendChild(c);
    }
    setTimeout(() => layer.remove(), 3600);
  }

  root.JT.fx = { init, floaty, burst, tool, ripple, shake, confetti };
})(window);
