# 🫏 JEGUE TYCOON — o império do sertão

Idle / clicker + tycoon brasileiríssimo. Faça **carinho no jegue** pra ganhar moeda,
monte sua fazenda do sertão, contrate geradores, compre upgrades, pegue o **Jegue
Dourado**, renasça por **Estrelas** e vire magnata. Forró, vaquejada, foguete e multiverso inclusos.

---

## ▶️ Como rodar

**Mais fácil:** dê dois cliques em `index.html`. Abre direto no navegador, sem instalar nada.
(Os scripts são clássicos de propósito — funcionam tanto no arquivo local quanto publicado.)

**Publicar online (Vercel / GitHub Pages):**
- **Vercel:** arraste a pasta inteira em vercel.com (ou `vercel` no terminal). Pronto.
- **GitHub Pages:** suba a pasta no repositório e ative o Pages apontando pra raiz.
- Não tem build, não tem dependência. É só HTML/CSS/JS estático.

---

## 🎮 Como jogar

1. **Faça carinho** no jegue (clique/toque) — cada carinho rende moedas.
2. **Estábulo:** compre geradores (Capim → Cenoura → … → Multiverso). Eles produzem sozinhos.
   - A cada marco (10, 25, 50, 100…) a produção daquele gerador **dobra**.
   - Botões **x1 / x10 / x100 / Máx** pra comprar em lote.
3. **Loja:** upgrades de clique, de produção global e de cada gerador.
4. **Visual (Guarda-Roupa):** troque a **pelagem** do jegue (caramelo, dourado, galáctico…) e ponha **acessórios** (chapéu de cangaceiro, óculos, coroa, capa…). Cada peça é desbloqueada por progresso e dá um **bônus pequeno** ao equipar — é cosmético E aprimora.
5. **Jegue Dourado:** aparece de vez em quando — clique rápido pra pegar um **buff**. Quando um poder está ativo, **o cenário muda** (festa, turbo, forró, espaço…) pra você saber na hora.
6. **Lendas (prestígio):** quando travar, **renasça**. Zera a partida atual mas ganha **Estrelas** que dão bônus **permanente** e desbloqueiam Lendas.
7. **Conquistas:** cada uma dá **+1% de produção global**.
8. **Ganhos offline:** seus jegues trabalham enquanto você está fora (até 3h).

Salva sozinho a cada 15 segundos e ao fechar a aba.

---

## 🧩 Estrutura modular (pra atualizar fácil)

Tudo separado por responsabilidade. Quer mexer em algo? Vá direto no arquivo certo:

```
jegue-tycoon/
├── index.html            ← a página (estrutura + SVG do jegue + carrega tudo)
├── css/
│   ├── tokens.css        ← VARIÁVEIS de cor, fonte, espaçamento (mude a "cara" aqui)
│   ├── base.css          ← reset, tipografia, header, layout
│   ├── scene.css         ← a cena do jegue, parallax, partículas
│   ├── components.css    ← abas, cards, botões, seletor de quantidade
│   ├── panels.css        ← loja, lendas, conquistas, guarda-roupa, toasts, modal
│   ├── animations.css    ← todos os @keyframes (+ respeito a "reduzir movimento")
│   └── scenefx.css       ← o cenário reagindo aos poderes + decorações de progresso
└── js/
    ├── config.js         ← 🎯 CONTEÚDO: geradores, upgrades, lendas, buffs, conquistas, COSMÉTICOS, manchetes
    ├── util.js           ← formatação de números, sorteios, helpers
    ├── state.js          ← o estado do jogo (o que é salvo)
    ├── storage.js        ← salvar/carregar (à prova de falhas)
    ├── economy.js        ← 🧮 a matemática pura (custo, produção, prestígio, bônus de cosmético) — testável
    ├── audio.js          ← efeitos sonoros sintetizados + música ambiente
    ├── fx.js             ← efeitos visuais (partículas, confete, tremor, ferramenta do clique)
    ├── achievements.js   ← lógica das conquistas
    ├── buffs.js          ← buffs temporários, jegue dourado, mini-eventos
    ├── customize.js      ← 👕 Guarda-Roupa: desbloqueio/equipar pelagens e acessórios
    ├── scenefx.js        ← 🌄 cenário reage aos buffs + decorações por progresso
    ├── news.js           ← letreiro de notícias
    ├── render.js         ← desenha tudo na tela
    ├── game.js           ← ações + loop principal + init
    └── main.js           ← liga os eventos da tela e dá o boot
```

### Quero adicionar/mexer em…
- **Um gerador, upgrade, lenda, buff, conquista, COSMÉTICO ou manchete?** → `js/config.js`
- **As cores ou fontes?** → `css/tokens.css`
- **O balanceamento (custo/produção/prestígio)?** → `js/economy.js`
- **Como o cenário reage a um poder?** → `js/scenefx.js` + `css/scenefx.css`
- **Como um acessório é desenhado no jegue?** → grupo `<g id="acc-...">` no `index.html` + `js/customize.js`
- **Um efeito visual novo?** → `js/fx.js` + `css/animations.css`
- **Um som novo?** → `js/audio.js`

---

## ✅ Testado de verdade

Tem suíte de testes automatizada (rodada num DOM headless, simulando um jogador):
- `node test_econ.js` → 24 testes da economia (custos, marcos, prestígio…).
- `node test_upgrades.js` → 7 testes provando que os upgrades da loja REALMENTE mexem no jogo (clique dobra, produção dobra etc.).
- `node test_game.js` → 43 testes de integração (clique gera moeda + animação, compra, abas, conquista, jegue dourado, salvar, **guarda-roupa: desbloquear/equipar/recolorir + bônus**, **cenário reagindo aos poderes**, faixa de upgrades ativos, renascimento).

Resultado: **74/74 passando, 0 erros**.

---

Feito com 💛 no sertão. Bora vender jegue pro multiverso. **Receba!**
