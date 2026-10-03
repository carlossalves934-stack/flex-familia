# Flex Família

Site do canal [Flex Família](https://www.youtube.com/@flexfamiliaonline): alongamento infantil com histórias.

- `/` — site para os pais
- `/videos/<slug>` — página de cada vídeo
- `/crianca` — Modo Criança (livro de histórias, adesivos, desafios em família)

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | instala as dependências |
| `npm run dev` | servidor de desenvolvimento em http://localhost:4321 |
| `npm test` | testes de unidade (Vitest) |
| `npm run test:e2e` | testes de navegador (Playwright) |
| `npm run build` | gera o site estático em `dist/` |
| `npm run check` | verificação de tipos (Astro + TypeScript) |

## Conteúdo

Todos os vídeos, benefícios e objetivos estão em `src/data/videos.ts`.
Para incluir um vídeo novo, adicione uma entrada ali; se for uma história, desenhe também o personagem em `src/kids/arte.ts` (mesmo `slug`).
Quando a professora aprovar os textos de um vídeo, marque `revisadoPelaProfessora: true`. O build avisa quantos ainda faltam.

Para testar o Modo Criança sem assistir os vídeos inteiros, use `/crianca?teste=1` (aparece o botão "pular para o fim").

`prototype/` guarda os protótipos aprovados, usados como referência visual.
