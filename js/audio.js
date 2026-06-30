/* ============================================================
   audio.js — MOTOR DE SOM (WebAudio, sem arquivos externos)
   Tudo sintetizado na hora. Iniciado só no 1º gesto do usuário.
   Se o navegador não suportar, vira no-op (nunca quebra o jogo).
   ============================================================ */
(function (root) {
  "use strict";
  let ctx = null;
  let master = null;
  let enabled = true;
  let musicOn = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  function resume() { try { if (ctx && ctx.state === "suspended") ctx.resume(); } catch (e) {} }

  // toca uma nota simples
  function tone(freq, dur, type, vol, when, slideTo) {
    if (!enabled) return;
    const c = ensure(); if (!c) return;
    try {
      const t0 = (when || c.currentTime);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) {}
  }

  function chord(freqs, dur, type, vol) {
    const c = ensure(); if (!c) return;
    freqs.forEach((f, i) => tone(f, dur, type, (vol || 0.15), c.currentTime + i * 0.04));
  }

  const sfx = {
    click() { tone(220 + Math.random() * 60, 0.08, "triangle", 0.16, 0, 140); },
    buy() { tone(330, 0.09, "square", 0.16); tone(494, 0.12, "square", 0.14, ensure() ? ctx.currentTime + 0.06 : 0); },
    upgrade() { chord([392, 523, 659], 0.25, "triangle", 0.16); },
    error() { tone(140, 0.18, "sawtooth", 0.12, 0, 90); },
    golden() { chord([784, 988, 1175, 1568], 0.3, "sine", 0.14); },
    catch() { tone(1047, 0.1, "sine", 0.2, 0, 1568); tone(1568, 0.25, "sine", 0.16, ensure() ? ctx.currentTime + 0.08 : 0, 2093); },
    ach() { chord([523, 659, 784], 0.3, "triangle", 0.18); tone(1047, 0.35, "sine", 0.14, ensure() ? ctx.currentTime + 0.18 : 0); },
    prestige() {
      const c = ensure(); if (!c) return;
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i) => tone(f, 0.4, "triangle", 0.16, c.currentTime + i * 0.12));
    },
    event() { chord([440, 554, 659], 0.22, "sine", 0.14); },
  };

  // música ambiente: baixo + nota em padrão simples estilo arrasta-pé
  const BASS = [110, 110, 146.83, 110, 130.81, 130.81, 98, 98];
  const LEAD = [440, 523, 587, 523, 494, 440, 392, 440];
  function musicTick() {
    if (!musicOn) return;
    const c = ensure(); if (!c) { return; }
    const i = musicStep % 8;
    tone(BASS[i], 0.22, "triangle", 0.06);
    if (i % 2 === 0) tone(LEAD[i], 0.18, "sine", 0.05);
    musicStep++;
  }

  const AUDIO = {
    init() { ensure(); resume(); },
    isEnabled: () => enabled,
    setEnabled(v) { enabled = !!v; if (enabled) { ensure(); resume(); } if (!enabled) this.setMusic(false); },
    sfx,
    isMusicOn: () => musicOn,
    setMusic(v) {
      musicOn = !!v && enabled;
      clearInterval(musicTimer); musicTimer = null;
      if (musicOn) { ensure(); resume(); musicStep = 0; musicTimer = setInterval(musicTick, 300); }
    },
    resume,
  };

  root.JT = root.JT || {};
  root.JT.audio = AUDIO;
})(window);
