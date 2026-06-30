/* ============================================================
   main.js — LIGAÇÃO COM A TELA (eventos) + BOOT
   Conecta cliques, teclado, parallax/3D, abas, botões e dispara o
   init protegido. Se algo quebrar, mostra o erro NA TELA.
   ============================================================ */
(function (root) {
  "use strict";
  const U = root.JT.util, A = root.JT.audio, FX = root.JT.fx, G = root.JT.game;

  let audioReady = false;
  function wakeAudio() { if (!audioReady) { audioReady = true; A.init(); } A.resume(); }

  function showFatal(msg) {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:#1a0f06;color:#ffd23f;font-family:system-ui;z-index:999;text-align:center";
    box.innerHTML = "<div><h2>🫏 Eita, deu ruim no jegue</h2><p style='color:#fff;opacity:.8;max-width:560px'>O jogo encontrou um erro ao iniciar. Tente recarregar a página. Se persistir, me mande este texto:</p><pre style='white-space:pre-wrap;color:#ff8c42;background:#0008;padding:12px;border-radius:8px;max-width:560px;overflow:auto'>" + msg + "</pre></div>";
    document.body.appendChild(box);
  }

  function wire() {
    const scene = U.$("#scene");
    const wrap = U.$("#jegue-wrap");
    FX.init(scene);

    // clique no jegue
    function clickAt(e) {
      wakeAudio();
      const r = scene.getBoundingClientRect();
      let x, y;
      if (e && e.touches && e.touches[0]) { x = e.touches[0].clientX - r.left; y = e.touches[0].clientY - r.top; }
      else if (e && e.clientX != null) { x = e.clientX - r.left; y = e.clientY - r.top; }
      else { x = r.width / 2; y = r.height / 2; }
      G.doClick(x, y);
    }
    wrap.addEventListener("click", clickAt);
    wrap.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); clickAt(); } });

    // jegue dourado
    const golden = U.$("#golden");
    if (golden) golden.addEventListener("click", (e) => { e.stopPropagation(); wakeAudio(); G.catchGolden(); });

    // parallax + tilt 3D (respeita "reduzir movimento")
    let reduce = false; try { reduce = matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) {}
    if (!reduce) {
      const sun = U.$("#sun"), hills = U.$("#hills"), c1 = U.$("#c1"), c2 = U.$("#c2");
      scene.addEventListener("mousemove", (e) => {
        const r = scene.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (sun) sun.style.transform = `translate(${px * 18}px,${py * 10}px)`;
        if (hills) hills.style.transform = `translate(${px * 26}px,0)`;
        if (c1) c1.style.transform = `translate(${px * 40}px,${py * 10}px)`;
        if (c2) c2.style.transform = `translate(${px * 55}px,${py * 14}px)`;
        wrap.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 9}deg)`;
      });
      scene.addEventListener("mouseleave", () => { wrap.style.transform = "rotateY(0) rotateX(0)"; });
    }

    // abas
    U.$$(".tab").forEach((t) => t.addEventListener("click", () => { wakeAudio(); G.setTab(t.dataset.tab); }));

    // seletor de quantidade
    U.$$(".qbtn").forEach((b) => b.addEventListener("click", () => {
      U.$$(".qbtn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      const q = b.dataset.qty === "max" ? "max" : parseInt(b.dataset.qty, 10);
      G.setQty(q);
    }));

    // rodapé
    const bind = (id, fn) => { const e = U.$(id); if (e) e.addEventListener("click", fn); };
    bind("#btn-save", () => { wakeAudio(); const ok = G.manualSave(); root.JT.render.toast("💾", ok ? "Jogo salvo!" : "Não consegui salvar", ok ? "Seu progresso está guardado." : "Verifique se o navegador permite armazenamento."); });
    bind("#btn-sound", () => { wakeAudio(); const on = G.toggleSound(); U.$("#btn-sound").textContent = on ? "🔊 Som" : "🔇 Mudo"; });
    bind("#btn-music", () => { wakeAudio(); const on = G.toggleMusic(); U.$("#btn-music").textContent = on ? "🎵 Música" : "🎵 Música (off)"; });
    bind("#btn-reset", () => {
      root.JT.render.modal("Apagar tudo? ⚠️",
        "Isso apaga <b>todo</b> o seu progresso, inclusive prestígio e lendas. Não dá pra desfazer.",
        [
          { label: "Apagar tudo", cls: "no", fn: () => { G.hardReset(); root.JT.render.closeModal(); root.JT.render.toast("🧹", "Tudo limpo", "Bom recomeço!"); } },
          { label: "Cancelar", cls: "yes", fn: root.JT.render.closeModal },
        ]);
    });

    // salvar ao sair / trocar de aba do navegador
    document.addEventListener("visibilitychange", () => { if (document.hidden) { G.markSeen(); G.manualSave(); } });
    root.addEventListener("beforeunload", () => { try { G.markSeen(); G.manualSave(); } catch (e) {} });
    // primeiro gesto qualquer destrava o áudio
    root.addEventListener("pointerdown", wakeAudio, { once: true });
  }

  function boot() {
    try {
      wire();
      const r = G.init();
      if (r && typeof r.catch === "function") r.catch((e) => { console.error(e); showFatal(String(e && e.stack || e)); });
    } catch (e) {
      console.error(e);
      showFatal(String(e && e.stack || e));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
