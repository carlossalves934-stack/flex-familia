# Flex Família — Site Interativo: Design

**Data:** 2026-10-02
**Status:** aprovado em conversa; aguardando revisão do documento
**Fonte de conteúdo:** canal https://www.youtube.com/@flexfamiliaonline (a própria professora)

## 1. Objetivo

Um site infantil e interativo que valoriza os vídeos de alongamento do canal Flex Família.

Prioridade dos objetivos:
1. **Ferramenta de uso real** — crianças usam no dia a dia (com um adulto por perto).
2. **Crescimento do canal** — visualizações e inscritos no YouTube.
3. **Vendas (futuro)** — aulas/cursos; fora do escopo agora, mas a arquitetura não pode impedir.

**Público principal:** crianças de **3 a 6 anos** (não leem). **Público secundário:** pais/responsáveis, atendidos no "Cantinho dos Pais", onde ficam as chamadas de benefícios.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Progresso | Sem login; salvo no aparelho (localStorage). Nenhum dado pessoal de criança é coletado (LGPD). |
| Voz | Voz sintetizada (Web Speech API, pt-BR) agora; módulo preparado para trocar por gravações da professora. |
| Estilo visual | **C · Livro de Histórias** — papel, aquarela, letra de mão. |
| Tecnologia final | **Astro** (site estático) + ilhas interativas; hospedagem gratuita (Netlify ou Cloudflare Pages). |
| Processo | Spec → **protótipo navegável** (HTML único publicado) → retorno da professora → plano de implementação → site real. |

## 3. Telas e fluxo

### Lado da criança (sem texto obrigatório; tudo por toque + voz)
1. **Mundo Flex (entrada)** — um livro aberto; cada página é um cenário (mar, floresta, castelo, céu de chuva) com personagens tocáveis. Tocar → o personagem se mexe e a voz diz o nome da história. Personagens já assistidos exibem uma estrela.
2. **Hora da História** — vídeo grande, botões gigantes de play/pausa, botão "casinha". Sem busca, sem links externos.
3. **Festa!** — ao fim do vídeo: confete de papel picado, adesivo "carimbado" no álbum com som, voz "Muito bem!". Botões: "mais uma" e "casinha". Esta tela cobre as recomendações do YouTube.
4. **Meu Álbum** — última página do livro; adesivos ganhos coloridos, faltantes como silhuetas.

### Modo Família (criança + adulto)
5. Botão especial no Mundo Flex abre os **Desafios** (Aviãozinho, Mobilidade de Ombro, Mobilidade do Quadril). A tela mostra "Criança ⭐ + Adulto ⭐"; os dois marcam que completaram e ganham um **adesivo duplo de família**.

### Lado dos adultos
6. **Cantinho dos Pais** — acesso só pela barreira "segure o botão por 3 segundos". Contém: card por vídeo com benefícios, duração e faixa etária; apresentação da professora; botão grande "Inscreva-se no canal"; alongamentos para adultos (Home Office Stretch, Soltar Quadril); botão "zerar progresso".

**Navegação:** "casinha" sempre visível no lado da criança; Cantinho dos Pais só via barreira.

## 4. Identidade visual e interações

- **Paleta:** papel `#f6ecd9`, terracota `#b5543a` (destaque), sálvia `#7f9c96`, mostarda `#d9a441` (estrelas/adesivos), tinta `#4a3a2a` (contornos/texto).
- **Tipografia:** Gaegu (títulos, letra de mão); Nunito (textos do Cantinho dos Pais).
- **Personagens:** SVG com textura de aquarela, um por história, mesmo traço.
- **Livro:** virar página tocando na orelha ou arrastando, com som de papel.
- **Acessibilidade infantil:** alvos de toque ≥ 64px; nenhuma ação depende de leitura; respeita `prefers-reduced-motion`; botão de som liga/desliga no canto (para os pais).

## 5. Catálogo inicial (15 vídeos)

| ID YouTube | Título | Categoria | Duração |
|---|---|---|---|
| MCIFwfr5iyg | A Lebre e a Tartaruga | História | 7:19 |
| u-beIpngxCk | Ana e os Alecrins | História | 5:27 |
| EH-uvdTY2bs | A Baleia no Mar | História | 5:55 |
| FhwKmpQJ7OQ | Val e o Castelo | História | 6:25 |
| AWbMAYgKn9s | O Boneco de Borracha | História | 4:20 |
| XnkesburZt8 | A Chuva | História | 3:01 |
| LonFp66OCb0 | Você é minha Mãe? | História | 9:16 |
| rFX-Vw-cbz4 | O Cachorro e seu Osso | História | 5:39 |
| nH7hqLsBSyc | A Páscoa | História | 4:45 |
| 3jK7Ep7Fjmg | O Rato e o Leão | História | 6:00 |
| RaA6PlsffA4 | Desafio: Aviãozinho | Desafio Família | 0:27 |
| Kd9wF1n3Hcs | Desafio: Mobilidade de Ombro | Desafio Família | 0:17 |
| H_UmX0C8q48 | Desafio: Mobilidade do Quadril | Desafio Família | 0:28 |
| M1FZADDZFlI | Home Office Stretch | Adultos | 1:22 |
| M4HIEzNaLzQ | Sequência para "Soltar Quadril" | Adultos | 1:01 |

Durações extraídas da página do canal; conferir na implementação.

**Modelo de cada entrada:** `id`, `slug`, `titulo`, `categoria` (`historia` | `desafio` | `adultos`), `personagem`, `cenario`, `duracao`, `idade` (ex.: "3–6"), `adesivo`, `beneficios[]`, `revisadoPelaProfessora` (bool).

**Benefícios:** rascunhados pelo desenvolvimento; **a professora revisa e aprova** cada texto antes de ir ao ar. Nenhuma afirmação médica/terapêutica sem o aval dela. O site só exibe benefícios de entradas com `revisadoPelaProfessora: true` (no protótipo, rascunhos aparecem marcados como "rascunho").

## 6. Arquitetura do site final (Astro)

**Rotas:** `/` (Mundo Flex), `/historia/[slug]`, `/familia`, `/album`, `/pais`, `/pais/[slug]` (página por vídeo, indexável — ajuda o objetivo 2).

**Unidades (uma responsabilidade cada):**
- **Catálogo** — arquivo de dados (content collection) com validação de esquema; fonte única para todas as telas. Vídeo novo = nova entrada + ilustração.
- **Player** — YouTube IFrame API via `youtube-nocookie.com`; emite evento de "terminou" para disparar a Festa!.
- **Progresso** — lê/grava estrelas e adesivos em localStorage, sempre em try/catch; se o armazenamento falhar, o site funciona sem guardar.
- **Voz** — interface única `falar(chave)`; implementação atual = Web Speech pt-BR; futura = arquivos de áudio da professora, sem alterar as telas.
- **Barreira dos pais** — "segure 3 s"; libera `/pais` na sessão.

**Erros e casos-limite:** vídeo indisponível ou offline → mensagem com ilustração e botão "casinha"; voz sintetizada indisponível → o site segue só com sons/visual; armazenamento bloqueado → sem progresso, sem erro visível.

**Testes:** unitários para Progresso, Catálogo (esquema) e Barreira; um teste de navegador (Playwright) do fluxo entrar → assistir → Festa! → adesivo no Álbum.

## 7. Protótipo (próxima entrega)

Página HTML única, publicada como artefato privado, abrível em celular/tablet:
- Todas as 6 telas navegáveis, no estilo Livro de Histórias.
- Vídeos reais do canal tocando; ao terminar (ou botão "simular fim", para testar rápido) → Festa! → adesivo no Álbum.
- Voz sintetizada, sons, confete, progresso salvo no aparelho.
- Ilustrações de personagens em SVG simples (o traço final pode evoluir).
- Benefícios em rascunho, marcados como tal, para revisão da professora.

## 8. Fora do escopo agora

Contas/login, vendas e pagamentos, área de professores/escolas, versão em inglês, gravações de voz da professora (preparado, não feito).
