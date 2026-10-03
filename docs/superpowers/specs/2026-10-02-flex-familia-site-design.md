# Flex Família — Site Interativo: Design

**Data:** 2026-10-02 (revisado em 2026-10-03 após os protótipos)
**Status:** aprovado; implementação autorizada
**Fonte de conteúdo:** canal https://www.youtube.com/@flexfamiliaonline (a própria professora)

## 1. Objetivo

Um site que valoriza os vídeos de alongamento do canal Flex Família, com chamadas mostrando os benefícios de cada vídeo, e uma experiência lúdica para as crianças usarem.

Prioridade dos objetivos:
1. **Ferramenta de uso real** — crianças usam no dia a dia (com um adulto por perto).
2. **Crescimento do canal** — visualizações e inscritos no YouTube.
3. **Vendas (futuro)** — aulas/cursos; fora do escopo agora, mas a arquitetura não pode impedir.

**Duas experiências, um site:**
- **Site para os pais** (página principal, `/`) — quem chega primeiro são os pais/responsáveis.
- **Modo Criança** (`/crianca`) — experiência lúdica para crianças de **3 a 6 anos** (não leem).

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Progresso | Sem login; salvo no aparelho (localStorage). Nenhum dado pessoal de criança é coletado (LGPD). |
| Voz | Voz sintetizada (Web Speech API, pt-BR) agora; módulo preparado para trocar por gravações da professora. |
| Visual do site dos pais | **B · Vídeo em primeiro plano** — abertura escura em tela cheia, seções claras de papel, Nunito. |
| Visual do Modo Criança | **C · Livro de Histórias** — papel, aquarela, letra de mão (Gaegu). |
| Tecnologia | **Astro** (site estático) + ilhas interativas em TypeScript puro; hospedagem gratuita (Netlify ou Cloudflare Pages). |
| Referência visual | Os protótipos aprovados: `prototype/site/index.html` (pais) e `prototype/index.html` (Modo Criança). O site real deve reproduzi-los. |
| Textos e imagens | Benefícios, etiquetas, foto e apresentação da professora entram como estão nos protótipos e podem ser trocados depois, só editando dados. |

## 3. Telas e fluxo

### Site para os pais (`/`)
Menu fixo: **Histórias · Desafios · Para você · Professora · [Modo Criança]** (vira menu sanfona no celular).

1. **Abertura** — vídeo mudo de fundo em tela cheia, trocando a cada 14 s entre 3 destaques; capa como reserva; título, frase, botões "Ver as histórias" e "Abrir o Modo Criança", etiquetas de benefícios; cartão "Agora na tela".
2. **Números** — 10 histórias · 3–9 min · 3 a 6 anos · 0 cadastros (calculados do catálogo quando possível).
3. **Histórias** — grade de cards (capa, duração, etiquetas de objetivo) com **filtros por objetivo**. Clicar abre o **player sobreposto** com benefícios ao lado e link para o YouTube.
4. **Por que funciona** — 3 blocos (corpo, imaginação, tempo junto).
5. **Desafios em família** — faixa verde com os 3 desafios.
6. **Para você, adulto** — Home Office Stretch e Soltar Quadril.
7. **A professora** — foto, apresentação, citação, botão "Inscreva-se no canal".
8. **Rodapé** — links, canal, aviso de privacidade.

### Páginas por vídeo (`/videos/[slug]`)
Uma página indexável por vídeo (título, player, benefícios, etiquetas, outros vídeos), para o Google (objetivo 2). Os cards continuam abrindo o player sobreposto; a página por vídeo é o link compartilhável e o que o Google indexa.

### Modo Criança (`/crianca`) — sem texto obrigatório; tudo por toque + voz
1. **Mundo Flex** — livro com 3 páginas (Floresta, Mar e Céu, Castelo e Jardim); personagens tocáveis; 1º toque balança + voz, 2º toque (ou ▶) abre o vídeo; estrela nos já feitos; virar página pela orelha ou arrastando, com som de papel.
2. **Hora da História** — vídeo grande, play/pausa gigantes, camada sobre o vídeo impede sair para o YouTube.
3. **Festa!** — confete, adesivo carimbado, "Muito bem!"; botões casinha, álbum, "mais uma".
4. **Meu Álbum** — adesivos ganhos e silhuetas; seção de adesivos da família.
5. **Modo Família** — 3 desafios; ao fim, "Criança ⭐ + Adulto ⭐" → adesivo da família.
6. **Saída para adultos** — cadeado + "segure 3 segundos" leva ao site dos pais (`/`). Na barra do Modo Criança fica também o botão de som.

## 4. Identidade visual

- **Paleta comum:** papel `#f6ecd9`, creme `#fbf6ec`, terracota `#b5543a`, sálvia `#7f9c96`, mostarda `#d9a441`, tinta `#3a2e22`/`#4a3a2a`, noite `#231c15`.
- **Tipografia:** Nunito (site dos pais e textos); Gaegu (Modo Criança).
- **Personagens:** SVG com filtro de aquarela, um por história, como no protótipo.
- **Acessibilidade:** foco visível; alvos de toque ≥ 64px no Modo Criança; respeita `prefers-reduced-motion` (sem vídeo de fundo, sem confete, sem animações); player sobreposto fecha com Esc e devolve o foco.

## 5. Catálogo inicial (15 vídeos)

| ID YouTube | slug | Título | Categoria | Duração |
|---|---|---|---|---|
| MCIFwfr5iyg | lebre | A Lebre e a Tartaruga | historia | 7:19 |
| u-beIpngxCk | ana | Ana e os Alecrins | historia | 5:27 |
| EH-uvdTY2bs | baleia | A Baleia no Mar | historia | 5:55 |
| FhwKmpQJ7OQ | castelo | Val e o Castelo | historia | 6:25 |
| AWbMAYgKn9s | boneco | O Boneco de Borracha | historia | 4:20 |
| XnkesburZt8 | chuva | A Chuva | historia | 3:01 |
| LonFp66OCb0 | mae | Você é minha Mãe? | historia | 9:16 |
| rFX-Vw-cbz4 | cachorro | O Cachorro e seu Osso | historia | 5:39 |
| nH7hqLsBSyc | pascoa | A Páscoa | historia | 4:45 |
| 3jK7Ep7Fjmg | leao | O Rato e o Leão | historia | 6:00 |
| RaA6PlsffA4 | aviao | Aviãozinho | desafio | 0:27 |
| Kd9wF1n3Hcs | ombro | Mobilidade de Ombro | desafio | 0:17 |
| H_UmX0C8q48 | quadril | Mobilidade do Quadril | desafio | 0:28 |
| M1FZADDZFlI | office | Home Office Stretch | adultos | 1:22 |
| M4HIEzNaLzQ | soltar | Sequência para "Soltar Quadril" | adultos | 1:01 |

**Modelo de cada entrada:** `id`, `slug`, `titulo`, `categoria` (`historia` | `desafio` | `adultos`), `duracao` ("m:ss"), `objetivos[]`, `beneficios[]`, `pagina` (0–2, só histórias: página do livro), `destaque` (bool, abertura), `revisadoPelaProfessora` (bool).

**Benefícios:** entram os rascunhos dos protótipos, sem selo de "rascunho" no site público. O campo `revisadoPelaProfessora` (inicialmente `false`) serve para acompanhar a revisão: o build lista no terminal as entradas ainda não revisadas.

## 6. Arquitetura (Astro)

**Rotas:** `/`, `/videos/[slug]`, `/crianca`.

**Unidades (uma responsabilidade cada):**
- **Catálogo** (`src/data/videos.ts` + validação com zod) — fonte única; vídeo novo = nova entrada (+ arte do personagem, se for história).
- **Personagens** (`src/kids/arte.ts`) — SVG de cada personagem/cenário por slug.
- **Progresso** (`src/lib/progresso.ts`) — adesivos, família e preferência de som em localStorage, sempre em try/catch.
- **Voz** (`src/lib/voz.ts`) — `falar(texto)`/`calar()`; hoje Web Speech pt-BR.
- **Sons** (`src/lib/sons.ts`) — efeitos gerados por Web Audio.
- **Player YouTube** (`src/lib/youtube.ts`) — carrega a IFrame API uma vez (promessa), cria players `youtube-nocookie`.
- **Segurar para confirmar** (`src/lib/segurar.ts`) — lógica do "segure 3 s", testável sem DOM real.
- **Ilhas do site dos pais** — abertura (vídeo de fundo + rotação), filtros, player sobreposto, menu.
- **App do Modo Criança** (`src/kids/app.ts`) — telas internas (livro, vídeo, festa, álbum, família) numa única ilha.

**Erros e casos-limite:** vídeo indisponível/offline → aviso ilustrado; API do YouTube não carrega → capa no lugar do vídeo de fundo; voz indisponível → segue só com visual e sons; armazenamento bloqueado → sem progresso, sem erro visível.

**Testes:** Vitest para Catálogo (esquema, slugs únicos), Progresso (inclusive storage que lança erro), Segurar (temporizador), Filtros (lógica pura); Playwright para: site dos pais carrega e filtra; player sobreposto abre/fecha; Modo Criança → vídeo → "pular para o fim" (só em modo de teste) → Festa! → adesivo no Álbum.

## 7. Fora do escopo agora

Contas/login, vendas e pagamentos, área de professores/escolas, versão em inglês, gravações de voz da professora (preparado, não feito), domínio próprio e deploy (feito depois, com o usuário).
