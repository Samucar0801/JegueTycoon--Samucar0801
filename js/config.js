/* ============================================================
   config.js — DADOS E BALANCEAMENTO DO JOGO
   Tudo que é "conteúdo" (geradores, upgrades, lendas, buffs,
   conquistas, manchetes) mora aqui. Mexer no jogo = mexer aqui,
   sem precisar tocar na lógica. (separação de responsabilidades)
   ============================================================ */
(function (root) {
  "use strict";

  const CONFIG = {
    SAVE_KEY: "jegueTycoonSave_v2",
    SAVE_EVERY_MS: 15000,
    TICK_MS: 100, // 10 ticks por segundo
    OFFLINE_CAP_H: 3, // teto de ganhos offline (horas)
    OFFLINE_EFF: 0.5, // eficiência offline base (50%)
    STAR_DIVISOR: 1e6, // 1 estrela a cada sqrt(lifetimeAll/1e6)
    STAR_BONUS: 0.02, // +2% global por estrela de prestígio
    GOLDEN_MIN_S: 55, // intervalo do jegue dourado (min)
    GOLDEN_MAX_S: 150, // (max)
    GOLDEN_LIFE_S: 11, // tempo na tela
    EVENT_MIN_S: 150, // mini-eventos aleatórios
    EVENT_MAX_S: 320,
  };

  /* ---------- GERADORES (o lado Tycoon) ----------
     baseCost  = preço do 1º
     baseProd  = moedas/seg de UMA unidade (sem multiplicadores)
     growth    = quanto o preço sobe a cada compra
  */
  const GENERATORS = [
    { id: "capim",      name: "Cocho de Capim",        icon: "🌾", baseCost: 15,     baseProd: 0.1,   growth: 1.15, desc: "Onde tudo começa. Capim fresco pro brother de orelha grande." },
    { id: "cenoura",    name: "Horta de Cenoura",      icon: "🥕", baseCost: 100,    baseProd: 1,     growth: 1.15, desc: "Cenoura é o combustível premium do jegue." },
    { id: "pasto",      name: "Pasto Comunitário",     icon: "🌳", baseCost: 1100,   baseProd: 8,     growth: 1.15, desc: "Espaço pro jegue relaxar e fazer um forrozinho." },
    { id: "carroca",    name: "Carroça de Feira",      icon: "🛒", baseCost: 12000,  baseProd: 47,    growth: 1.15, desc: "O jegue trabalhador da feira livre. Receba!" },
    { id: "carga",      name: "Jegue de Carga",        icon: "📦", baseCost: 130000, baseProd: 260,   growth: 1.15, desc: "Carrega de tudo. Inclusive seus sonhos." },
    { id: "forro",      name: "Forró do Jegue",        icon: "🪗", baseCost: 1.4e6,  baseProd: 1400,  growth: 1.15, desc: "Sanfona, zabumba e triângulo. O jegue arrasta o pé." },
    { id: "corrida",    name: "Corrida de Jegue",      icon: "🏁", baseCost: 2.0e7,  baseProd: 7800,  growth: 1.15, desc: "Aposta na corrida de jumento. Esporte sério no sertão." },
    { id: "leite",      name: "Leite de Jega",         icon: "🥛", baseCost: 3.3e8,  baseProd: 44000, growth: 1.15, desc: "Iguaria rara. Dizem que cura até desilusão." },
    { id: "vaquejada",  name: "Vaquejada Premium",     icon: "🤠", baseCost: 5.1e9,  baseProd: 2.6e5, growth: 1.15, desc: "Couro, poeira e muito aboio. É sobre isso." },
    { id: "parque",     name: "Parque do Jegue",       icon: "🎡", baseCost: 7.5e10, baseProd: 1.6e6, growth: 1.15, desc: "DisneyWorld? Aqui é JegueWorld, parceiro." },
    { id: "influencer", name: "Jegue Influencer",      icon: "📱", baseCost: 1.0e12, baseProd: 1.0e7, growth: 1.15, desc: "Milhões de seguidores no TikTok. Dancinha viral garantida." },
    { id: "mina",       name: "Mina de Ouro do Jegue", icon: "⛏️", baseCost: 1.4e13, baseProd: 6.5e7, growth: 1.15, desc: "Jegue achou ouro. Agora é magnata do sertão." },
    { id: "espaco",     name: "Programa Espacial",     icon: "🚀", baseCost: 1.7e14, baseProd: 4.3e8, growth: 1.15, desc: "Jegue na Lua. Please come to Brazil, disseram os marcianos." },
    { id: "multi",      name: "Multiverso do Jegue",   icon: "🌌", baseCost: 2.1e15, baseProd: 2.9e9, growth: 1.15, desc: "Infinitos jegues em infinitos universos. Tipo Nazaré calculando." },
  ];

  // Marcos: cada quantidade atingida DOBRA a produção daquele gerador.
  const MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 750, 1000];

  /* ---------- UPGRADES FEITOS À MÃO (a Loja) ----------
     kind: clickMult | carinho | globalMult | genMult
     Aplicação fica em economy.js. Aqui só descreve.
  */
  const UPGRADES = [
    // — clique —
    { id: "dedo",      name: "Dedo Reforçado",       icon: "👆", cost: 500,    kind: "clickMult", mult: 2,    desc: "Carinho com o dobro de potência." },
    { id: "luva",      name: "Luva de Couro",        icon: "🧤", cost: 6000,   kind: "clickMult", mult: 2,    desc: "Couro legítimo do sertão. Clique x2." },
    { id: "palma",     name: "Palma Calejada",       icon: "✋", cost: 70000,  kind: "clickMult", mult: 2,    desc: "Mão de quem trabalha. Clique x2." },
    { id: "bencao",    name: "Bênção do Vaqueiro",   icon: "🙏", cost: 5e6,    kind: "clickMult", mult: 3,    desc: "Fé move jegue. Clique x3." },
    { id: "trovao",    name: "Mão de Trovão",        icon: "⚡", cost: 8e9,    kind: "clickMult", mult: 3,    desc: "Cada carinho é um estrondo. Clique x3." },
    // — carinho (clique ganha % da produção/seg) —
    { id: "carinho1",  name: "Carinho Profissional", icon: "💛", cost: 1e5,    kind: "carinho",   pct: 0.01,  desc: "Cada carinho rende 1% da sua produção por segundo." },
    { id: "carinho2",  name: "Mãos de Curandeiro",   icon: "🌿", cost: 1e8,    kind: "carinho",   pct: 0.03,  desc: "Carinho rende 3% da produção/seg." },
    { id: "carinho3",  name: "Conexão Espiritual",   icon: "✨", cost: 1e11,   kind: "carinho",   pct: 0.05,  desc: "Carinho rende 5% da produção/seg." },
    // — produção global —
    { id: "racao",     name: "Ração Turbinada",      icon: "🌽", cost: 1e4,    kind: "globalMult", mult: 2,   desc: "Toda a fazenda produz o dobro." },
    { id: "vitamina",  name: "Vitamina de Jegue",    icon: "💊", cost: 1e7,    kind: "globalMult", mult: 2,   desc: "Produção global x2." },
    { id: "genetica",  name: "Engenharia Genética",  icon: "🧬", cost: 1e10,   kind: "globalMult", mult: 2,   desc: "Jegues turbinados. Produção global x2." },
    { id: "quantico",  name: "Jegue Quântico",       icon: "⚛️", cost: 1e13,   kind: "globalMult", mult: 3,   desc: "Produz e não produz ao mesmo tempo. Global x3." },
    // — sinergias (desbloqueiam ao ter N de um gerador) —
    { id: "sin_forro", name: "Sanfona Afinada",      icon: "🎶", cost: 5e6,    kind: "globalMult", mult: 1.5, req: { gen: "forro", n: 1 }, desc: "O forró embala a fazenda toda. Global x1.5." },
    { id: "sin_tiktok",name: "Algoritmo do Jegue",   icon: "🔥", cost: 5e12,   kind: "globalMult", mult: 2,   req: { gen: "influencer", n: 1 }, desc: "O algoritmo ama jegue. Global x2." },
  ];

  /* ---------- LENDAS (loja de prestígio, custa Estrelas ⭐) ----------
     Compra única. Persistem entre renascimentos.
  */
  const LENDAS = [
    { id: "sangue",   name: "Sangue de Campeão",  icon: "🩸", cost: 1,  desc: "Produção global permanente x1.5." },
    { id: "maos",     name: "Mãos de Ouro",       icon: "🫳", cost: 2,  desc: "Poder de clique permanente x3." },
    { id: "sorte",    name: "Sorte do Sertão",    icon: "🍀", cost: 3,  desc: "Jegue Dourado aparece com mais frequência e dura +50%." },
    { id: "heranca",  name: "Herança do Vovô",    icon: "👴", cost: 5,  desc: "Após renascer, já começa com 10 Hortas e 5 Pastos." },
    { id: "saojorge", name: "São Jorge na Frente", icon: "🐎", cost: 8,  desc: "Ganhos offline sobem de 50% para 85% de eficiência." },
    { id: "berrante", name: "Berrante de Ouro",   icon: "📯", cost: 13, desc: "Mini-eventos do sertão acontecem com o dobro da frequência." },
    { id: "cosmico",  name: "Bênção Cósmica",     icon: "🌟", cost: 21, desc: "Cada Estrela passa a dar +3% (em vez de +2%)." },
    { id: "rei",      name: "Rei do Sertão",      icon: "👑", cost: 34, desc: "Produção x2 E clique x2, para sempre." },
  ];

  /* ---------- BUFFS DO JEGUE DOURADO (recompensa variável) ---------- */
  const BUFFS = [
    { id: "festa",     name: "Festa do Jegue! 🎉",   weight: 32, type: "prod",  mult: 7,   dur: 18, msg: "Produção x7 por 18s!" },
    { id: "chuva",     name: "Chuva de Moedas! 🪙",  weight: 26, type: "lump",              msg: "Choveu moeda do céu!" },
    { id: "turbo",     name: "Carinho Turbo! 💥",    weight: 22, type: "click", mult: 777, dur: 15, msg: "Cada clique vale 777x por 15s!" },
    { id: "frenetico", name: "Forró Frenético! 🪗",  weight: 16, type: "both",  mult: 3,   dur: 30, msg: "Produção e clique x3 por 30s!" },
    { id: "cosmico",   name: "Jegue Cósmico! 🌌",    weight: 4,  type: "prod",  mult: 77,  dur: 13, msg: "RARO! Produção x77 por 13s!" },
  ];

  /* ---------- MINI-EVENTOS DO SERTÃO (toasts automáticos) ---------- */
  const EVENTS = [
    { id: "vaquejada",  name: "Vaquejada na cidade!", icon: "🤠", type: "prod",  mult: 2,  dur: 25, msg: "Todo mundo veio ver. Produção x2 por 25s!" },
    { id: "feira",      name: "Dia de Feira!",        icon: "🧺", type: "click", mult: 5,  dur: 20, msg: "Movimento na feira! Clique x5 por 20s." },
    { id: "chuva_boa",  name: "Chuva no sertão!",     icon: "🌧️", type: "prod",  mult: 3,  dur: 18, msg: "Choveu! O capim cresceu. Produção x3 por 18s." },
    { id: "viral",      name: "Jegue viralizou!",     icon: "📈", type: "both",  mult: 2,  dur: 22, msg: "Bombou na internet! Tudo x2 por 22s." },
  ];

  /* ---------- MANCHETES (news ticker — estilo Cookie Clicker) ----------
     Flavor humorístico. Referências culturais em paródia, texto original.
  */
  const NEWS = [
    "Jegue local viraliza no TikTok fazendo dancinha. \"Receba\", disse ele.",
    "Vira-lata caramelo é flagrado torcendo pelo seu império de jegues.",
    "Cientistas continuam confusos com os cálculos da sua fazenda. (foto: senhora rodeada de fórmulas)",
    "\"Please come to Brazil\", imploram jegues estrangeiros ao seu rebanho.",
    "É verdade esse bilete: jegue do interior agora ganha mais que economista.",
    "Forró do jegue lota arena. Sanfoneiro pede aumento.",
    "Jegue declara: \"Tô na paz\" antes de produzir 1 milhão de moedas.",
    "Vaqueiro afirma que seu jegue \"é sobre isso, e tá tudo bem\".",
    "Bolsa de Valores do Sertão fecha em alta puxada por leite de jega.",
    "Pesquisa aponta: 9 em cada 10 jegues preferem cenoura premium.",
    "Jegue astronauta planta bandeira na Lua e pede um forrozinho.",
    "Influencer de orelha grande fecha publi milionária com marca de ração.",
    "Berrante de ouro é leiloado por fortuna em vaquejada exclusiva.",
    "Especialistas alertam: seu jegue pode estar ganhando autoconsciência.",
    "Multiverso confirma existência de infinitos jegues. Todos fofos.",
    "Carroça elétrica é lançada. Jegue aprova, mas prefere o modelo clássico.",
    "Seca? Que seca. Sua fazenda transborda moeda há 3 semanas.",
    "Jegue quântico está produzindo e descansando ao mesmo tempo.",
    "Prefeitura inaugura estátua de jegue na praça central. Povo ovaciona.",
    "Jega dá à luz gêmeos. Produção de leite dobra da noite pro dia.",
    "Documentário sobre seu império de jegues ganha prêmio internacional.",
    "Mercado de pulgas vira mercado de moedas graças aos seus jegues.",
    "Jegue recusa proposta de Hollywood: \"meu lugar é no sertão\".",
    "Economistas renomeiam 'Efeito Borboleta' para 'Efeito Jegue'.",
    "Crianças trocam figurinhas raras do seu Jegue Influencer.",
  ];

  /* ---------- COSMÉTICOS (Guarda-Roupa do Jegue) ----------
     kind: 'skin' (pelagem, recolore o SVG) | 'acc' (acessório, mostra um <g>)
     slot: pele | cabeca | olhos | pescoco | extra | orelha
     bonus: pequeno upgrade temático ao equipar (kind: click|prod|all|golden|offline)
     unlock(S,h): condição pra desbloquear. unlockDesc: texto da condição.
     back:true  -> acessório desenhado ATRÁS do jegue (capa, asas)
     vars: cores da pelagem (skins)
  */
  const COSMO_SLOTS = [
    { id: "pele",    name: "Pelagem",   icon: "🎨" },
    { id: "cabeca",  name: "Cabeça",    icon: "🎩" },
    { id: "olhos",   name: "Olhos",     icon: "🕶️" },
    { id: "pescoco", name: "Pescoço",   icon: "🧣" },
    { id: "orelha",  name: "Orelha",    icon: "🌼" },
    { id: "extra",   name: "Costas",    icon: "🦸" },
  ];

  const COSMETICS = [
    // ===== PELAGENS (skins) =====
    { id: "pele_cinza",   name: "Cinza Clássico", icon: "🩶", slot: "pele", kind: "skin",
      vars: { coat: "#a9b0b8", lt: "#cfd4da", mane: "#6d7177", muz: "#dfe3e7", tail: "#7d8189" },
      unlock: () => true, unlockDesc: "Padrão" },
    { id: "pele_caramelo",name: "Caramelo",       icon: "🟤", slot: "pele", kind: "skin",
      vars: { coat: "#c8843d", lt: "#e6b170", mane: "#8a531f", muz: "#f0c48a", tail: "#a96a2a" },
      bonus: { kind: "click", mult: 1.05 },
      unlock: (S) => S.lifetimeAll >= 1e4, unlockDesc: "Acumule 10 mil moedas (vira-lata caramelo!)" },
    { id: "pele_rosa",    name: "Rosa Choque",    icon: "🩷", slot: "pele", kind: "skin",
      vars: { coat: "#e88fb0", lt: "#f7c2d6", mane: "#c25c84", muz: "#fcdded", tail: "#cf6d96" },
      bonus: { kind: "prod", mult: 1.05 },
      unlock: (S) => S.prestige >= 1, unlockDesc: "Renasça 1 vez" },
    { id: "pele_pampa",   name: "Pampa (P&B)",    icon: "🐴", slot: "pele", kind: "skin",
      vars: { coat: "#ededf0", lt: "#ffffff", mane: "#2b2b30", muz: "#f6f6f8", tail: "#2b2b30" },
      bonus: { kind: "all", mult: 1.03 },
      unlock: (S, h) => h.totalGens(S) >= 50, unlockDesc: "Tenha 50 geradores no total" },
    { id: "pele_dourado", name: "Jegue de Ouro",  icon: "🟡", slot: "pele", kind: "skin", glow: "gold",
      vars: { coat: "#e8b53a", lt: "#f6d877", mane: "#b8841a", muz: "#fbe9a8", tail: "#c89522" },
      bonus: { kind: "prod", mult: 1.10 },
      unlock: (S) => S.goldenCaught >= 5, unlockDesc: "Pegue 5 Jegues Dourados" },
    { id: "pele_galactico",name: "Galáctico",     icon: "🟣", slot: "pele", kind: "skin", glow: "cosmic",
      vars: { coat: "#5b4b8a", lt: "#8a78c0", mane: "#2e2450", muz: "#b9a8e8", tail: "#6a59a0" },
      bonus: { kind: "all", mult: 1.05 },
      unlock: (S) => (S.gens.multi || 0) >= 1, unlockDesc: "Abra o Multiverso do Jegue" },

    // ===== CABEÇA =====
    { id: "chapeu_cangaceiro", name: "Chapéu de Cangaceiro", icon: "🤠", slot: "cabeca", kind: "acc", svg: "chapeu",
      bonus: { kind: "click", mult: 1.08 },
      unlock: (S) => (S.gens.vaquejada || 0) >= 1, unlockDesc: "Tenha 1 Vaquejada Premium" },
    { id: "cartola",   name: "Cartola Chique",  icon: "🎩", slot: "cabeca", kind: "acc", svg: "cartola",
      bonus: { kind: "prod", mult: 1.08 },
      unlock: (S) => S.coins >= 1e7, unlockDesc: "Tenha 10 milhões guardadas" },
    { id: "astronauta",name: "Capacete Espacial",icon: "🪐", slot: "cabeca", kind: "acc", svg: "astronauta",
      bonus: { kind: "all", mult: 1.05 },
      unlock: (S) => (S.gens.espaco || 0) >= 1, unlockDesc: "Lance o Programa Espacial" },
    { id: "coroa",     name: "Coroa do Sertão", icon: "👑", slot: "cabeca", kind: "acc", svg: "coroa", glow: "gold",
      bonus: { kind: "all", mult: 1.10 },
      unlock: (S) => S.prestige >= 5, unlockDesc: "Acumule 5 Estrelas de prestígio" },

    // ===== OLHOS =====
    { id: "oculos_escuros", name: "Óculos Escuros", icon: "🕶️", slot: "olhos", kind: "acc", svg: "oculosesc",
      bonus: { kind: "golden", mult: 1.25 },
      unlock: (S) => S.clicks >= 200, unlockDesc: "Faça 200 carinhos" },
    { id: "oculos_nerd",    name: "Óculos de Nerd", icon: "👓", slot: "olhos", kind: "acc", svg: "oculosnerd",
      bonus: { kind: "prod", mult: 1.04 },
      unlock: (S, h) => h.totalUps(S) >= 8, unlockDesc: "Compre 8 upgrades" },

    // ===== PESCOÇO =====
    { id: "bandana",   name: "Bandana",          icon: "🔴", slot: "pescoco", kind: "acc", svg: "bandana",
      bonus: { kind: "click", mult: 1.05 },
      unlock: (S) => (S.gens.carga || 0) >= 1, unlockDesc: "Tenha 1 Jegue de Carga" },
    { id: "lenco_forro",name: "Lenço de Forró",  icon: "🟧", slot: "pescoco", kind: "acc", svg: "lenco",
      bonus: { kind: "prod", mult: 1.06 },
      unlock: (S) => (S.gens.forro || 0) >= 5, unlockDesc: "Tenha 5 Forrós do Jegue" },

    // ===== ORELHA =====
    { id: "flor",      name: "Flor na Orelha",   icon: "🌼", slot: "orelha", kind: "acc", svg: "flor",
      bonus: { kind: "all", mult: 1.03 },
      unlock: (S) => (S.gens.pasto || 0) >= 10, unlockDesc: "Tenha 10 Pastos Comunitários" },

    // ===== COSTAS (atrás) =====
    { id: "capa",      name: "Capa de Herói",    icon: "🦸", slot: "extra", kind: "acc", svg: "capa", back: true,
      bonus: { kind: "prod", mult: 1.08 },
      unlock: (S) => (S.gens.influencer || 0) >= 1, unlockDesc: "Tenha 1 Jegue Influencer" },
    { id: "asas",      name: "Asas de Anjo",     icon: "🪽", slot: "extra", kind: "acc", svg: "asas", back: true,
      bonus: { kind: "offline", mult: 1.15 },
      unlock: (S) => S.prestige >= 10, unlockDesc: "Acumule 10 Estrelas de prestígio" },
  ];

  const ACHS = [
    { id: "a_click1",   name: "Primeiro Carinho",     icon: "👋", desc: "Faça carinho no jegue 1 vez.",          test: (S) => S.clicks >= 1 },
    { id: "a_click100", name: "Mão de Vento",         icon: "🌀", desc: "100 cliques.",                          test: (S) => S.clicks >= 100 },
    { id: "a_click1k",  name: "Carinho Compulsivo",   icon: "🤲", desc: "1.000 cliques.",                        test: (S) => S.clicks >= 1000 },
    { id: "a_coins1k",  name: "Primeiro Trocado",     icon: "🪙", desc: "Acumule 1.000 moedas no total.",        test: (S) => S.lifetime >= 1000 },
    { id: "a_coins1m",  name: "Milionário do Sertão", icon: "💰", desc: "Acumule 1 milhão no total.",            test: (S) => S.lifetime >= 1e6 },
    { id: "a_coins1b",  name: "Bilionário de Bota",   icon: "🤑", desc: "Acumule 1 bilhão no total.",            test: (S) => S.lifetime >= 1e9 },
    { id: "a_coins1t",  name: "Magnata Trilionário",  icon: "🏦", desc: "Acumule 1 trilhão no total.",           test: (S) => S.lifetime >= 1e12 },
    { id: "a_gen1",     name: "Primeiro Funcionário", icon: "🌾", desc: "Compre seu primeiro gerador.",          test: (S, h) => h.totalGens(S) >= 1 },
    { id: "a_gen50",    name: "Patrão Exigente",      icon: "🧑‍🌾", desc: "Tenha 50 geradores no total.",        test: (S, h) => h.totalGens(S) >= 50 },
    { id: "a_gen200",   name: "Império em Pé",        icon: "🏗️", desc: "Tenha 200 geradores no total.",         test: (S, h) => h.totalGens(S) >= 200 },
    { id: "a_gen500",   name: "Senhor do Sertão",     icon: "🏜️", desc: "Tenha 500 geradores no total.",         test: (S, h) => h.totalGens(S) >= 500 },
    { id: "a_capim25",  name: "Rei do Capim",         icon: "🌾", desc: "25 Cochos de Capim.",                   test: (S) => (S.gens.capim || 0) >= 25 },
    { id: "a_forro1",   name: "Arrasta-pé",           icon: "🪗", desc: "Monte seu primeiro Forró do Jegue.",    test: (S) => (S.gens.forro || 0) >= 1 },
    { id: "a_influ1",   name: "Bombou!",              icon: "📱", desc: "Tenha um Jegue Influencer.",            test: (S) => (S.gens.influencer || 0) >= 1 },
    { id: "a_espaco1",  name: "Houston, é jegue",     icon: "🚀", desc: "Lance o Programa Espacial.",            test: (S) => (S.gens.espaco || 0) >= 1 },
    { id: "a_multi1",   name: "Multijegue",           icon: "🌌", desc: "Abra o Multiverso do Jegue.",           test: (S) => (S.gens.multi || 0) >= 1 },
    { id: "a_up5",      name: "Comprador",            icon: "🛍️", desc: "Compre 5 upgrades da loja.",            test: (S, h) => h.totalUps(S) >= 5 },
    { id: "a_up15",     name: "Gastador",             icon: "💳", desc: "Compre 15 upgrades.",                   test: (S, h) => h.totalUps(S) >= 15 },
    { id: "a_golden1",  name: "Pé de Coelho",         icon: "🍀", desc: "Pegue 1 Jegue Dourado.",               test: (S) => S.goldenCaught >= 1 },
    { id: "a_golden10", name: "Caçador de Sorte",     icon: "🎯", desc: "Pegue 10 Jegues Dourados.",            test: (S) => S.goldenCaught >= 10 },
    { id: "a_prestige1",name: "Renascido",            icon: "⭐", desc: "Renasça pela primeira vez.",            test: (S) => S.prestige >= 1 },
    { id: "a_prestige10",name: "Lenda Viva",          icon: "🌟", desc: "Acumule 10 Estrelas de prestígio.",     test: (S) => S.prestige >= 10 },
    { id: "a_lenda1",   name: "Aprendiz de Lenda",    icon: "📜", desc: "Compre sua primeira Lenda.",            test: (S, h) => h.totalLendas(S) >= 1 },
    { id: "a_lendaAll", name: "Lenda Completa",       icon: "🏆", desc: "Compre todas as Lendas.",              test: (S, h) => h.totalLendas(S) >= LENDAS.length },
    { id: "a_cps1k",    name: "Esteira Ligada",       icon: "⚙️", desc: "Chegue a 1.000 moedas/seg.",            test: (S, h) => h.cps() >= 1000 },
    { id: "a_cps1m",    name: "Fábrica de Jegue",     icon: "🏭", desc: "Chegue a 1 milhão moedas/seg.",         test: (S, h) => h.cps() >= 1e6 },
    { id: "a_rich",     name: "Tá Rico!",             icon: "💎", desc: "Tenha 1 bilhão de moedas guardadas.",   test: (S) => S.coins >= 1e9 },
    { id: "a_patient",  name: "Volta, Vaqueiro",      icon: "🌙", desc: "Receba ganhos offline ao voltar.",      test: (S) => S.gotOffline === true },
  ];

  CONFIG.GENERATORS = GENERATORS;
  CONFIG.MILESTONES = MILESTONES;
  CONFIG.UPGRADES = UPGRADES;
  CONFIG.LENDAS = LENDAS;
  CONFIG.BUFFS = BUFFS;
  CONFIG.EVENTS = EVENTS;
  CONFIG.NEWS = NEWS;
  CONFIG.ACHS = ACHS;
  CONFIG.COSMETICS = COSMETICS;
  CONFIG.COSMO_SLOTS = COSMO_SLOTS;

  // expõe no namespace global JT (browser) e em module.exports (node/teste)
  root.JT = root.JT || {};
  root.JT.config = CONFIG;
  if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
})(typeof window !== "undefined" ? window : globalThis);
