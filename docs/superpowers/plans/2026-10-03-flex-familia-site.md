# Flex Família Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the two approved prototypes into a real Astro site: a parents' site at `/`, one indexable page per video at `/videos/[slug]`, and the kids' storybook experience at `/crianca`.

**Architecture:** Static Astro site. One typed, zod-validated catalog (`src/data/videos.ts`) feeds every page. Pure logic (progress, hold-to-confirm, filters, catalog helpers) lives in small TypeScript modules with Vitest tests; browser behaviour lives in client scripts bundled by Astro; end-to-end flows are covered by Playwright against the production build. Visuals are ported from the prototypes, which are the visual reference.

**Tech Stack:** Node 24, Astro (latest), TypeScript, zod, Vitest, Playwright (Chromium).

**Spec:** `docs/superpowers/specs/2026-10-02-flex-familia-site-design.md`
**Visual reference:** `prototype/site/index.html` (parents), `prototype/index.html` (kids)

## Global Constraints

- Language of all UI copy: Brazilian Portuguese (`<html lang="pt-BR">`).
- No login, no analytics, no data collection. Kids' progress only in `localStorage` key `flex-familia-progresso-v1`, every access in try/catch.
- All YouTube embeds use the privacy host `https://www.youtube-nocookie.com`; thumbnails from `https://i.ytimg.com/vi/<id>/<quality>.jpg`.
- `prefers-reduced-motion: reduce` → no background video, no confetti, no animations.
- Kids' screens: touch targets ≥ 64px, nothing requires reading.
- Benefit texts ship as drafts with no "rascunho" badge on the public site; `revisadoPelaProfessora` starts `false` for every entry.
- The "pular para o fim" test button only appears on `/crianca?teste=1`.
- Fonts from Google Fonts only: Nunito (parents), Gaegu + Nunito (kids).
- Commit after every task; commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Structure

```
package.json, astro.config.mjs, tsconfig.json, vitest.config.ts, playwright.config.ts
src/data/videos.ts            catalog + schema + helpers (single source of truth)
src/data/videos.test.ts
src/lib/progresso.ts          kids' progress (stickers, family stickers, sound pref)
src/lib/progresso.test.ts
src/lib/segurar.ts            hold-to-confirm timer logic
src/lib/segurar.test.ts
src/lib/filtros.ts            objective filter logic
src/lib/filtros.test.ts
src/lib/youtube.ts            loads the YouTube IFrame API once
src/lib/voz.ts                speech synthesis wrapper (future: teacher's recordings)
src/lib/sons.ts               Web Audio sound effects
src/styles/site.css           parents' site styles (ported)
src/layouts/Base.astro        <html>, <head>, fonts
src/components/Menu.astro
src/components/CardVideo.astro
src/components/PlayerSobreposto.astro
src/components/Rodape.astro
src/scripts/site.ts           parents' site client behaviour (filters, overlay, hero, menu)
src/pages/index.astro         parents' site
src/pages/videos/[slug].astro per-video page
src/kids/kids.css             kids' styles (ported)
src/kids/arte.ts              icons, character art, scenery (ported)
src/kids/app.ts               kids' app (ported, uses the libs above)
src/pages/crianca.astro       kids' page
tests/e2e/site.spec.ts
tests/e2e/crianca.spec.ts
```

`prototype/` stays untouched as the reference.

---

### Task 1: Scaffold Astro + Vitest and the catalog

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/data/videos.ts`, `src/data/videos.test.ts`, `src/pages/index.astro` (temporary)
- Modify: `.gitignore`

**Interfaces:**
- Produces (from `src/data/videos.ts`):
  - `type Categoria = 'historia' | 'desafio' | 'adultos'`
  - `type Video = { id: string; slug: string; titulo: string; categoria: Categoria; duracao: string; objetivos: string[]; beneficios: string[]; pagina?: number; destaque: boolean; revisadoPelaProfessora: boolean }`
  - `VIDEOS: Video[]`, `historias: Video[]`, `desafios: Video[]`, `adultos: Video[]`, `destaques: Video[]`
  - `porSlug(slug: string): Video | undefined`, `porId(id: string): Video | undefined`
  - `capa(id: string, qualidade?: 'hqdefault' | 'maxresdefault'): string`
  - `faixaMinutos(videos: Video[]): { min: number; max: number }`
  - `rotuloCategoria(v: Video): string`
  - `pendentesDeRevisao(): Video[]`
  - `PAGINAS: { nome: string; cenario: 'floresta' | 'mar' | 'castelo' }[]`
  - `CANAL: string`, `CANAL_INSCREVER: string`

- [ ] **Step 1: Create the project files**

`package.json`:
```json
{
  "name": "flex-familia",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Run: `npm install astro zod && npm install -D vitest @playwright/test typescript`
Expected: installs without errors.

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "prototype"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

Append to `.gitignore`:
```
.astro/
test-results/
playwright-report/
```

Temporary `src/pages/index.astro` (replaced in Task 3):
```astro
<h1>Flex Família</h1>
```

- [ ] **Step 2: Write the failing catalog test**

`src/data/videos.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  VIDEOS, historias, desafios, adultos, destaques, porSlug, porId, capa,
  faixaMinutos, rotuloCategoria, pendentesDeRevisao, PAGINAS,
} from './videos';

describe('catálogo', () => {
  it('tem os 15 vídeos do canal, separados por categoria', () => {
    expect(VIDEOS).toHaveLength(15);
    expect(historias).toHaveLength(10);
    expect(desafios).toHaveLength(3);
    expect(adultos).toHaveLength(2);
  });

  it('não repete slug nem id', () => {
    expect(new Set(VIDEOS.map(v => v.slug)).size).toBe(VIDEOS.length);
    expect(new Set(VIDEOS.map(v => v.id)).size).toBe(VIDEOS.length);
  });

  it('coloca toda história numa página existente do livro', () => {
    for (const h of historias) {
      expect(h.pagina).toBeGreaterThanOrEqual(0);
      expect(h.pagina).toBeLessThan(PAGINAS.length);
    }
  });

  it('tem 3 destaques para a abertura', () => {
    expect(destaques.map(v => v.slug)).toEqual(['leao', 'pascoa', 'cachorro']);
  });

  it('encontra por slug e por id', () => {
    expect(porSlug('baleia')?.titulo).toBe('A Baleia no Mar');
    expect(porId('EH-uvdTY2bs')?.slug).toBe('baleia');
    expect(porSlug('nao-existe')).toBeUndefined();
  });

  it('monta a URL da capa', () => {
    expect(capa('EH-uvdTY2bs')).toBe('https://i.ytimg.com/vi/EH-uvdTY2bs/hqdefault.jpg');
    expect(capa('EH-uvdTY2bs', 'maxresdefault')).toBe('https://i.ytimg.com/vi/EH-uvdTY2bs/maxresdefault.jpg');
  });

  it('calcula a faixa de minutos das histórias', () => {
    expect(faixaMinutos(historias)).toEqual({ min: 3, max: 9 });
  });

  it('dá um rótulo legível para cada categoria', () => {
    expect(rotuloCategoria(porSlug('baleia')!)).toBe('Para crianças de 3 a 6 anos');
    expect(rotuloCategoria(porSlug('aviao')!)).toBe('Desafio em família');
    expect(rotuloCategoria(porSlug('office')!)).toBe('Para adultos');
  });

  it('lista tudo como pendente de revisão no início', () => {
    expect(pendentesDeRevisao()).toHaveLength(15);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/data/videos.test.ts`
Expected: FAIL, cannot resolve `./videos`.

- [ ] **Step 4: Write the catalog**

`src/data/videos.ts`:
```ts
import { z } from 'zod';

export const CANAL = 'https://www.youtube.com/@flexfamiliaonline';
export const CANAL_INSCREVER = `${CANAL}?sub_confirmation=1`;

export const PAGINAS = [
  { nome: 'Floresta', cenario: 'floresta' },
  { nome: 'Mar e Céu', cenario: 'mar' },
  { nome: 'Castelo e Jardim', cenario: 'castelo' },
] as const satisfies readonly { nome: string; cenario: 'floresta' | 'mar' | 'castelo' }[];

const VideoSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    titulo: z.string().min(1),
    categoria: z.enum(['historia', 'desafio', 'adultos']),
    duracao: z.string().regex(/^\d{1,2}:\d{2}$/),
    objetivos: z.array(z.string().min(1)).min(1),
    beneficios: z.array(z.string().min(1)).min(1),
    pagina: z.number().int().min(0).max(PAGINAS.length - 1).optional(),
    destaque: z.boolean().default(false),
    revisadoPelaProfessora: z.boolean().default(false),
  })
  .refine(v => v.categoria !== 'historia' || v.pagina !== undefined, {
    message: 'toda história precisa de uma página do livro',
  });

export type Video = z.infer<typeof VideoSchema>;
export type Categoria = Video['categoria'];

// Benefícios e objetivos são rascunhos; a professora revisa e marca revisadoPelaProfessora.
const DADOS: z.input<typeof VideoSchema>[] = [
  { id: 'MCIFwfr5iyg', slug: 'lebre', titulo: 'A Lebre e a Tartaruga', categoria: 'historia', pagina: 0, duracao: '7:19',
    objetivos: ['Acalmar'],
    beneficios: ['Alonga pernas e a parte de trás das coxas', 'Ensina a fazer com calma, no próprio ritmo', 'Une atenção à história e ao corpo'] },
  { id: '3jK7Ep7Fjmg', slug: 'leao', titulo: 'O Rato e o Leão', categoria: 'historia', pagina: 0, duracao: '6:00', destaque: true,
    objetivos: ['Força'],
    beneficios: ['Alonga braços e costas', 'Estimula a imaginação com a fábula', 'Conversa sobre amizade e ajudar o outro'] },
  { id: 'rFX-Vw-cbz4', slug: 'cachorro', titulo: 'O Cachorro e seu Osso', categoria: 'historia', pagina: 0, duracao: '5:39', destaque: true,
    objetivos: ['Equilíbrio', 'Gastar energia'],
    beneficios: ['Movimenta a coluna em quatro apoios', 'Trabalha coordenação e equilíbrio', 'Imitar bichos deixa tudo mais divertido'] },
  { id: 'EH-uvdTY2bs', slug: 'baleia', titulo: 'A Baleia no Mar', categoria: 'historia', pagina: 1, duracao: '5:55',
    objetivos: ['Acalmar', 'Antes de dormir'],
    beneficios: ['Alonga a lateral do corpo e a coluna', 'Respiração tranquila que acalma', 'Boa escolha para antes de dormir'] },
  { id: 'XnkesburZt8', slug: 'chuva', titulo: 'A Chuva', categoria: 'historia', pagina: 1, duracao: '3:01',
    objetivos: ['Pausa rápida', 'Acalmar'],
    beneficios: ['Curtinha: cabe em qualquer pausa', 'Alonga braços e ombros', 'Movimentos lentos que ajudam a relaxar'] },
  { id: 'LonFp66OCb0', slug: 'mae', titulo: 'Você é minha Mãe?', categoria: 'historia', pagina: 1, duracao: '9:16',
    objetivos: ['Antes de dormir'],
    beneficios: ['Sessão completa para o corpo todo', 'Trabalha a flexibilidade geral', 'Fala de família e acolhimento'] },
  { id: 'FhwKmpQJ7OQ', slug: 'castelo', titulo: 'Val e o Castelo', categoria: 'historia', pagina: 2, duracao: '6:25',
    objetivos: ['Equilíbrio', 'Força'],
    beneficios: ['Posições de equilíbrio que fortalecem as pernas', 'Estimula a imaginação', 'Ajuda na postura'] },
  { id: 'u-beIpngxCk', slug: 'ana', titulo: 'Ana e os Alecrins', categoria: 'historia', pagina: 2, duracao: '5:27',
    objetivos: ['Acalmar'],
    beneficios: ['Alonga pernas e quadril', 'Aproxima a criança da natureza pela história', 'Movimentos suaves para todas as idades'] },
  { id: 'AWbMAYgKn9s', slug: 'boneco', titulo: 'O Boneco de Borracha', categoria: 'historia', pagina: 2, duracao: '4:20',
    objetivos: ['Gastar energia'],
    beneficios: ['Mostra como o corpo pode ser flexível', 'Desenvolve consciência corporal', 'Muito divertido de imitar'] },
  { id: 'nH7hqLsBSyc', slug: 'pascoa', titulo: 'A Páscoa', categoria: 'historia', pagina: 2, duracao: '4:45', destaque: true,
    objetivos: ['Gastar energia', 'Equilíbrio'],
    beneficios: ['Tema especial para a Páscoa', 'Saltinhos leves e alongamentos', 'Trabalha coordenação'] },
  { id: 'RaA6PlsffA4', slug: 'aviao', titulo: 'Aviãozinho', categoria: 'desafio', duracao: '0:27',
    objetivos: ['Equilíbrio'],
    beneficios: ['Equilíbrio em um pé só', 'Fortalece pernas e costas', 'Adulto e criança fazem juntos'] },
  { id: 'Kd9wF1n3Hcs', slug: 'ombro', titulo: 'Mobilidade de Ombro', categoria: 'desafio', duracao: '0:17',
    objetivos: ['Ombros'],
    beneficios: ['Solta os ombros', 'Bom para quem passa muito tempo sentado', 'Rapidinho: menos de meio minuto'] },
  { id: 'H_UmX0C8q48', slug: 'quadril', titulo: 'Mobilidade do Quadril', categoria: 'desafio', duracao: '0:28',
    objetivos: ['Quadril'],
    beneficios: ['Melhora a mobilidade do quadril', 'Ajuda a sentar no chão com conforto', 'Desafio leve para toda a família'] },
  { id: 'M1FZADDZFlI', slug: 'office', titulo: 'Home Office Stretch', categoria: 'adultos', duracao: '1:22',
    objetivos: ['Pescoço e ombros', 'Na cadeira'],
    beneficios: ['Alivia pescoço e ombros no trabalho', 'Pode ser feito na cadeira', 'Pausa de pouco mais de um minuto'] },
  { id: 'M4HIEzNaLzQ', slug: 'soltar', titulo: 'Sequência para "Soltar Quadril"', categoria: 'adultos', duracao: '1:01',
    objetivos: ['Quadril', 'Começo do dia'],
    beneficios: ['Solta o quadril depois de muito tempo sentado', 'Sequência curta e guiada', 'Boa para começar ou terminar o dia'] },
];

export const VIDEOS: Video[] = z.array(VideoSchema).parse(DADOS);

export const historias = VIDEOS.filter(v => v.categoria === 'historia');
export const desafios = VIDEOS.filter(v => v.categoria === 'desafio');
export const adultos = VIDEOS.filter(v => v.categoria === 'adultos');
// Ordem da abertura: leão, páscoa, cachorro (capas em alta resolução e sem título escrito por cima).
export const destaques = ['leao', 'pascoa', 'cachorro'].map(s => VIDEOS.find(v => v.slug === s)!).filter(v => v.destaque);

export const porSlug = (slug: string) => VIDEOS.find(v => v.slug === slug);
export const porId = (id: string) => VIDEOS.find(v => v.id === id);

export const capa = (id: string, qualidade: 'hqdefault' | 'maxresdefault' = 'hqdefault') =>
  `https://i.ytimg.com/vi/${id}/${qualidade}.jpg`;

export function faixaMinutos(videos: Video[]) {
  const minutos = videos.map(v => Number(v.duracao.split(':')[0]));
  return { min: Math.min(...minutos), max: Math.max(...minutos) };
}

export function rotuloCategoria(v: Video) {
  if (v.categoria === 'adultos') return 'Para adultos';
  if (v.categoria === 'desafio') return 'Desafio em família';
  return 'Para crianças de 3 a 6 anos';
}

export const pendentesDeRevisao = () => VIDEOS.filter(v => !v.revisadoPelaProfessora);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/data/videos.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Verify Astro builds**

Run: `npx astro build`
Expected: completes, `dist/index.html` exists.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore src
git commit -m "feat: projeto Astro e catálogo de vídeos validado"
```

---

### Task 2: Pure logic modules (progress, hold-to-confirm, filters)

**Files:**
- Create: `src/lib/progresso.ts`, `src/lib/progresso.test.ts`, `src/lib/segurar.ts`, `src/lib/segurar.test.ts`, `src/lib/filtros.ts`, `src/lib/filtros.test.ts`

**Interfaces:**
- Produces:
  - `interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }`
  - `CHAVE_PROGRESSO = 'flex-familia-progresso-v1'`
  - `criarProgresso(storage: StorageLike | null): Progresso` with `temAdesivo(slug): boolean`, `ganhar(slug): boolean` (true when new), `temFamilia(slug): boolean`, `ganharFamilia(slug): void`, `contar(slugs: string[]): number`, `som: boolean` (getter), `definirSom(ligado: boolean): void`, `zerar(): void`
  - `storageDoNavegador(): StorageLike | null`
  - `criarSegurar({ duracaoMs, aoConcluir }): { comecar(): void; cancelar(): void; readonly ativo: boolean }`
  - `TODAS = 'Todas'`, `listarObjetivos(videos: { objetivos: string[] }[]): string[]`, `combina(objetivos: string[], filtro: string): boolean`

- [ ] **Step 1: Write the failing tests**

`src/lib/progresso.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CHAVE_PROGRESSO, criarProgresso, type StorageLike } from './progresso';

function memoria(inicial: Record<string, string> = {}): StorageLike & { dados: Record<string, string> } {
  const dados = { ...inicial };
  return { dados, getItem: k => dados[k] ?? null, setItem: (k, v) => { dados[k] = v; } };
}

describe('progresso', () => {
  it('começa vazio e com som ligado', () => {
    const p = criarProgresso(memoria());
    expect(p.temAdesivo('baleia')).toBe(false);
    expect(p.som).toBe(true);
  });

  it('ganhar devolve true só na primeira vez e salva', () => {
    const s = memoria();
    const p = criarProgresso(s);
    expect(p.ganhar('baleia')).toBe(true);
    expect(p.ganhar('baleia')).toBe(false);
    expect(criarProgresso(s).temAdesivo('baleia')).toBe(true);
  });

  it('guarda adesivos da família separados', () => {
    const p = criarProgresso(memoria());
    p.ganharFamilia('aviao');
    expect(p.temFamilia('aviao')).toBe(true);
    expect(p.temAdesivo('aviao')).toBe(false);
  });

  it('conta adesivos de uma lista', () => {
    const p = criarProgresso(memoria());
    p.ganhar('baleia'); p.ganhar('chuva');
    expect(p.contar(['baleia', 'chuva', 'lebre'])).toBe(2);
  });

  it('zerar apaga adesivos mas mantém o som', () => {
    const p = criarProgresso(memoria());
    p.ganhar('baleia'); p.definirSom(false); p.zerar();
    expect(p.temAdesivo('baleia')).toBe(false);
    expect(p.som).toBe(false);
  });

  it('ignora dados corrompidos', () => {
    const p = criarProgresso(memoria({ [CHAVE_PROGRESSO]: '{não é json' }));
    expect(p.temAdesivo('baleia')).toBe(false);
  });

  it('ignora campos com formato errado', () => {
    const p = criarProgresso(memoria({ [CHAVE_PROGRESSO]: JSON.stringify({ adesivos: 'x', som: 'sim' }) }));
    expect(p.temAdesivo('x')).toBe(false);
    expect(p.som).toBe(true);
  });

  it('funciona sem armazenamento e quando o armazenamento lança erro', () => {
    const quebrado: StorageLike = {
      getItem: () => { throw new Error('bloqueado'); },
      setItem: () => { throw new Error('bloqueado'); },
    };
    for (const s of [null, quebrado]) {
      const p = criarProgresso(s);
      expect(p.ganhar('baleia')).toBe(true);
      expect(p.temAdesivo('baleia')).toBe(true);
    }
  });
});
```

`src/lib/segurar.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarSegurar } from './segurar';

describe('segurar para confirmar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conclui depois do tempo inteiro', () => {
    const aoConcluir = vi.fn();
    const s = criarSegurar({ duracaoMs: 3000, aoConcluir });
    s.comecar();
    expect(s.ativo).toBe(true);
    vi.advanceTimersByTime(2999);
    expect(aoConcluir).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(aoConcluir).toHaveBeenCalledOnce();
    expect(s.ativo).toBe(false);
  });

  it('soltar antes cancela', () => {
    const aoConcluir = vi.fn();
    const s = criarSegurar({ duracaoMs: 3000, aoConcluir });
    s.comecar();
    vi.advanceTimersByTime(2000);
    s.cancelar();
    vi.advanceTimersByTime(5000);
    expect(aoConcluir).not.toHaveBeenCalled();
  });

  it('começar duas vezes não reinicia a contagem', () => {
    const aoConcluir = vi.fn();
    const s = criarSegurar({ duracaoMs: 3000, aoConcluir });
    s.comecar();
    vi.advanceTimersByTime(2000);
    s.comecar();
    vi.advanceTimersByTime(1000);
    expect(aoConcluir).toHaveBeenCalledOnce();
  });
});
```

`src/lib/filtros.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { TODAS, combina, listarObjetivos } from './filtros';

describe('filtros por objetivo', () => {
  const videos = [{ objetivos: ['Acalmar'] }, { objetivos: ['Força', 'Acalmar'] }, { objetivos: ['Equilíbrio'] }];

  it('lista "Todas" seguido dos objetivos sem repetir, na ordem em que aparecem', () => {
    expect(listarObjetivos(videos)).toEqual([TODAS, 'Acalmar', 'Força', 'Equilíbrio']);
  });

  it('"Todas" combina com qualquer vídeo', () => {
    expect(combina(['Força'], TODAS)).toBe(true);
  });

  it('combina só quando o vídeo tem o objetivo', () => {
    expect(combina(['Força', 'Acalmar'], 'Acalmar')).toBe(true);
    expect(combina(['Força'], 'Acalmar')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`src/lib/progresso.ts`:
```ts
export interface StorageLike {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

export const CHAVE_PROGRESSO = 'flex-familia-progresso-v1';

interface Dados { adesivos: Record<string, true>; familia: Record<string, true>; som: boolean }

const vazio = (): Dados => ({ adesivos: {}, familia: {}, som: true });
const ehObjeto = (x: unknown): x is Record<string, true> => typeof x === 'object' && x !== null && !Array.isArray(x);

function ler(storage: StorageLike | null): Dados {
  try {
    const bruto = storage?.getItem(CHAVE_PROGRESSO);
    if (!bruto) return vazio();
    const d = JSON.parse(bruto);
    return {
      adesivos: ehObjeto(d?.adesivos) ? d.adesivos : {},
      familia: ehObjeto(d?.familia) ? d.familia : {},
      som: typeof d?.som === 'boolean' ? d.som : true,
    };
  } catch {
    return vazio();
  }
}

export function criarProgresso(storage: StorageLike | null) {
  let dados = ler(storage);
  const salvar = () => {
    try { storage?.setItem(CHAVE_PROGRESSO, JSON.stringify(dados)); } catch { /* sem armazenamento: segue sem guardar */ }
  };
  return {
    temAdesivo: (slug: string) => !!dados.adesivos[slug],
    ganhar(slug: string) {
      const novo = !dados.adesivos[slug];
      dados.adesivos[slug] = true;
      salvar();
      return novo;
    },
    temFamilia: (slug: string) => !!dados.familia[slug],
    ganharFamilia(slug: string) { dados.familia[slug] = true; salvar(); },
    contar: (slugs: string[]) => slugs.filter(s => dados.adesivos[s]).length,
    get som() { return dados.som; },
    definirSom(ligado: boolean) { dados.som = ligado; salvar(); },
    zerar() { dados = { ...vazio(), som: dados.som }; salvar(); },
  };
}

export type Progresso = ReturnType<typeof criarProgresso>;

export function storageDoNavegador(): StorageLike | null {
  try { return window.localStorage; } catch { return null; }
}
```

`src/lib/segurar.ts`:
```ts
export function criarSegurar(opcoes: { duracaoMs: number; aoConcluir: () => void }) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    comecar() {
      if (timer) return;
      timer = setTimeout(() => { timer = null; opcoes.aoConcluir(); }, opcoes.duracaoMs);
    },
    cancelar() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    },
    get ativo() { return timer !== null; },
  };
}
```

`src/lib/filtros.ts`:
```ts
export const TODAS = 'Todas';

export const listarObjetivos = (videos: { objetivos: string[] }[]) =>
  [TODAS, ...new Set(videos.flatMap(v => v.objetivos))];

export const combina = (objetivos: string[], filtro: string) =>
  filtro === TODAS || objetivos.includes(filtro);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run`
Expected: PASS, all tests (catalog + 14 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: progresso no aparelho, segurar para confirmar e filtros"
```

---

### Task 3: Parents' site, static markup from the catalog

**Files:**
- Create: `src/styles/site.css`, `src/layouts/Base.astro`, `src/components/Menu.astro`, `src/components/CardVideo.astro`, `src/components/PlayerSobreposto.astro`, `src/components/Rodape.astro`, `playwright.config.ts`, `tests/e2e/site.spec.ts`
- Modify: `src/pages/index.astro` (replace the temporary page)

**Interfaces:**
- Consumes: everything from `src/data/videos.ts`; `listarObjetivos`, `TODAS` from `src/lib/filtros.ts`.
- Produces (DOM contract used by Task 4's `src/scripts/site.ts`):
  - `#menu` header, `#hamb` button, `#nav` links
  - `#fundo` with one `<img>` per destaque (first has class `ativa`), `#bgvideo` containing `#bg-yt`, `#agora` button
  - `#filtros` with `button.filtro[data-obj]` (`aria-pressed`), `#grade-historias` with `a.card` items, `#vazio` message
  - every card: `<a class="card" href="/videos/{slug}" data-id="{id}" data-obj="{objetivos joined by |}">`
  - `#player` dialog with `#player-fechar`, `#player-tela`, `#player-titulo`, `#player-meta`, `#player-beneficios`, `#player-yt`
- `Base.astro` props: `{ titulo: string; descricao: string; fontes: string }` where `fontes` is the Google Fonts `family=` query part.

- [ ] **Step 1: Write the failing e2e test**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 120_000 },
});
```

`tests/e2e/site.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

// Testes não dependem da internet: YouTube e capas ficam bloqueados.
test.beforeEach(async ({ page }) => {
  await page.route(/youtube|ytimg|googlevideo/, r => r.abort());
});

test('página dos pais mostra a abertura e as 10 histórias', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Alongamento infantil');
  await expect(page.locator('#grade-historias .card')).toHaveCount(10);
  await expect(page.locator('#grade-desafios .card')).toHaveCount(3);
  await expect(page.locator('#grade-adultos .card')).toHaveCount(2);
  await expect(page.locator('a[href="/crianca"]').first()).toBeAttached();
  await expect(page.getByRole('link', { name: /Inscreva-se no canal/ })).toHaveAttribute('href', /sub_confirmation=1/);
});

test('cards apontam para a página de cada vídeo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#grade-historias a.card[href="/videos/baleia"]')).toHaveCount(1);
});
```

Run: `npx playwright install chromium` (once).

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/site.spec.ts --project=desktop`
Expected: FAIL, heading/cards not found.

- [ ] **Step 3: Port the styles**

Copy lines 12–202 of `prototype/site/index.html` (the contents of `<style>`, without the tags) into `src/styles/site.css`:

```bash
sed -n '12,202p' prototype/site/index.html > src/styles/site.css
```

Then change the `.card` rule (cards are now links) from
```css
.card{display:flex;flex-direction:column;gap:10px;text-align:left;min-width:0}
```
to
```css
.card{display:flex;flex-direction:column;gap:10px;text-align:left;min-width:0;text-decoration:none;color:inherit}
```
and delete the `.rascunho{...}` rule (drafts ship without badges).

- [ ] **Step 4: Layout and shared components**

`src/layouts/Base.astro`:
```astro
---
interface Props { titulo: string; descricao: string; fontes: string }
const { titulo, descricao, fontes } = Astro.props;
---
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>{titulo}</title>
    <meta name="description" content={descricao} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${fontes}&display=swap`} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

`src/components/Menu.astro` (anchors go to `/#...` so they also work from video pages):
```astro
---
---
<header class="menu" id="menu">
  <div class="envolve">
    <a class="marca" href="/"><span class="selo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.6" fill="#f6ecd9"/><path d="M4 9.5c3 1.2 5.4 1.6 8 1.6s5-.4 8-1.6M12 11v4.5M12 15.5l-4.5 5.5M12 15.5l4.5 5.5" stroke="#f6ecd9" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Flex Família</a>
    <nav id="nav">
      <a href="/#historias">Histórias</a>
      <a href="/#desafios">Desafios</a>
      <a href="/#adultos">Para você</a>
      <a href="/#professora">Professora</a>
    </nav>
    <a class="bt bt-crianca" href="/crianca">Modo Criança</a>
    <button class="hamb" id="hamb" aria-label="Abrir menu" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
  </div>
</header>
```

`src/components/CardVideo.astro`:
```astro
---
import { capa, type Video } from '../data/videos';
interface Props { video: Video }
const { video } = Astro.props;
---
<a class="card" href={`/videos/${video.slug}`} data-id={video.id} data-obj={video.objetivos.join('|')}>
  <div class="capa">
    <img src={capa(video.id)} alt="" loading="lazy" />
    <div class="play"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16l14-8z" fill="#f6ecd9"/></svg></span></div>
    <span class="dur">{video.duracao}</span>
  </div>
  <h3>{video.titulo}</h3>
  <div class="tags">{video.objetivos.map(o => <span>{o}</span>)}</div>
</a>
```

`src/components/PlayerSobreposto.astro`:
```astro
---
---
<div class="player oculto" id="player" role="dialog" aria-modal="true" aria-labelledby="player-titulo">
  <button class="fechar" id="player-fechar" aria-label="Fechar vídeo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>
  <div class="caixa">
    <div class="tela" id="player-tela"></div>
    <div class="lado">
      <h3 id="player-titulo"></h3>
      <span class="meta" id="player-meta"></span>
      <ul id="player-beneficios"></ul>
      <a class="yt" id="player-yt" target="_blank" rel="noopener">Assistir no YouTube ↗</a>
    </div>
  </div>
</div>
```

`src/components/Rodape.astro`:
```astro
---
import { CANAL, CANAL_INSCREVER } from '../data/videos';
---
<footer class="rodape">
  <div class="envolve">
    <div>
      <a class="marca" href="/"><span class="selo"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.6" fill="#f6ecd9"/><path d="M4 9.5c3 1.2 5.4 1.6 8 1.6s5-.4 8-1.6M12 11v4.5M12 15.5l-4.5 5.5M12 15.5l4.5 5.5" stroke="#f6ecd9" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Flex Família</a>
      <p>Este site não pede cadastro nem coleta dados. No Modo Criança, os adesivos ficam salvos só no aparelho da família.</p>
    </div>
    <div>
      <h4>Explore</h4>
      <ul><li><a href="/#historias">Histórias</a></li><li><a href="/#desafios">Desafios em família</a></li><li><a href="/#adultos">Para você</a></li><li><a href="/crianca">Modo Criança</a></li></ul>
    </div>
    <div>
      <h4>Canal</h4>
      <ul><li><a href={CANAL} target="_blank" rel="noopener">YouTube @flexfamiliaonline</a></li><li><a href={CANAL_INSCREVER} target="_blank" rel="noopener">Inscreva-se</a></li></ul>
    </div>
  </div>
</footer>
```

- [ ] **Step 5: The home page**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Menu from '../components/Menu.astro';
import CardVideo from '../components/CardVideo.astro';
import PlayerSobreposto from '../components/PlayerSobreposto.astro';
import Rodape from '../components/Rodape.astro';
import { historias, desafios, adultos, destaques, capa, faixaMinutos, CANAL_INSCREVER, pendentesDeRevisao } from '../data/videos';
import { listarObjetivos, TODAS } from '../lib/filtros';
import '../styles/site.css';

const faixa = faixaMinutos(historias);
const objetivos = listarObjetivos(historias);
const pendentes = pendentesDeRevisao();
if (import.meta.env.PROD && pendentes.length) {
  console.warn(`[revisão] ${pendentes.length} vídeos com textos ainda não revisados pela professora: ${pendentes.map(v => v.slug).join(', ')}`);
}
---
<Base titulo="Flex Família" descricao="Alongamento infantil com histórias: vídeos curtos guiados pela professora do canal Flex Família, para crianças de 3 a 6 anos." fontes="family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700">
  <Menu />
  <main id="topo">
    <section class="abertura" aria-label="Apresentação">
      <div class="fundo" id="fundo">
        {destaques.map((v, i) => <img src={capa(v.id, 'maxresdefault')} alt="" class={i === 0 ? 'ativa' : ''} data-id={v.id} data-titulo={v.titulo} />)}
      </div>
      <div class="bgvideo" id="bgvideo"><div id="bg-yt"></div></div>
      <div class="veu"></div>
      <div class="envolve">
        <div class="conteudo">
          <span class="olho">Canal Flex Família · alongamento infantil</span>
          <h1>Alongamento infantil <em>com histórias</em></h1>
          <p>Vídeos curtos em que a criança se alonga enquanto escuta uma história contada pela professora. Para fazer em casa, sem equipamento e sem cadastro.</p>
          <div class="acoes">
            <a class="bt bt-primario" href="#historias"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>Ver as histórias</a>
            <a class="bt bt-vazado" href="/crianca">Abrir o Modo Criança</a>
          </div>
          <div class="chips"><span>Equilíbrio</span><span>Calma</span><span>Postura</span><span>Imaginação</span><span>3 a 6 anos</span></div>
        </div>
      </div>
      <button class="agora" id="agora" aria-label="Assistir o vídeo em destaque">
        <img src={capa(destaques[0].id)} alt="" />
        <span><small>Agora na tela</small><span id="agora-titulo">{destaques[0].titulo}</span>
          <span class="barrinhas">{destaques.map((_, i) => <i class={i === 0 ? 'on' : ''}></i>)}</span></span>
      </button>
    </section>

    <section class="numeros" aria-label="Em números">
      <div class="envolve">
        <div><b>{historias.length}</b><span>histórias para alongar</span></div>
        <div><b>{faixa.min}–{faixa.max} min</b><span>cabem em qualquer rotina</span></div>
        <div><b>3 a 6</b><span>anos, com adulto por perto</span></div>
        <div><b>0</b><span>cadastros ou dados coletados</span></div>
      </div>
    </section>

    <section class="secao" id="historias">
      <div class="envolve">
        <div class="cabeca">
          <div>
            <span class="olho">Histórias para alongar</span>
            <h2>Escolha pelo que seu filho precisa agora</h2>
            <p class="lead">Cada história trabalha uma parte do corpo e um jeito de estar: mais calmo, mais firme, mais solto.</p>
          </div>
        </div>
        <div class="filtros" id="filtros" role="group" aria-label="Filtrar por objetivo">
          {objetivos.map(o => <button class="filtro" aria-pressed={o === TODAS ? 'true' : 'false'} data-obj={o}>{o}</button>)}
        </div>
        <div class="grade" id="grade-historias">
          {historias.map(v => <CardVideo video={v} />)}
          <p class="vazio-filtro oculto" id="vazio">Nenhuma história com essa etiqueta ainda.</p>
        </div>
      </div>
    </section>

    <section class="secao papel" id="porque">
      <div class="envolve">
        <span class="olho">Por que funciona</span>
        <h2>Criança pequena não faz série de exercícios. Ela entra numa história.</h2>
        <p class="lead">Em vez de contar repetições, a criança vira baleia, lebre ou castelo. O alongamento acontece porque ela quer saber o que vem depois.</p>
        <div class="porque">
          <article>
            <div class="ico" style="background:#f3dcd3"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="7" r="3.5" fill="#b5543a"/><path d="M5 13c4 1.6 7.4 2.2 11 2.2s7-.6 11-2.2M16 15v6M16 21l-6 7M16 21l6 7" stroke="#b5543a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <h3>Corpo que se mexe</h3>
            <p>Flexibilidade, equilíbrio e força de um jeito leve, adequado para a idade e sem competição.</p>
          </article>
          <article>
            <div class="ico" style="background:#f6e6c4"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7h9a3 3 0 0 1 3 3v16a3 3 0 0 0-3-3H6zM26 7h-5a3 3 0 0 0-3 3v16a3 3 0 0 1 3-3h5z" fill="none" stroke="#a97c25" stroke-width="2.6" stroke-linejoin="round"/></svg></div>
            <h3>Imaginação que conduz</h3>
            <p>A história mantém a atenção do começo ao fim e transforma cada posição numa cena que a criança lembra.</p>
          </article>
          <article>
            <div class="ico" style="background:#dde7e4"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27s-10-6-10-13a5.5 5.5 0 0 1 10-3.2A5.5 5.5 0 0 1 26 14c0 7-10 13-10 13z" fill="none" stroke="#5f7d77" stroke-width="2.6" stroke-linejoin="round"/></svg></div>
            <h3>Tempo junto</h3>
            <p>Cinco minutos que pais e filhos podem fazer lado a lado, longe das telas que só distraem.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="secao" id="desafios">
      <div class="envolve">
        <div class="faixa-familia">
          <div>
            <span class="olho">Desafios em família</span>
            <h2>Menos de 30 segundos. Façam juntos.</h2>
            <p>Desafios curtos para adulto e criança tentarem lado a lado. Quem consegue segurar o Aviãozinho?</p>
          </div>
          <div class="grade" id="grade-desafios">{desafios.map(v => <CardVideo video={v} />)}</div>
        </div>
      </div>
    </section>

    <section class="secao papel" id="adultos">
      <div class="envolve">
        <div class="cabeca">
          <div>
            <span class="olho">Para você, adulto</span>
            <h2>Uma pausa para quem cuida</h2>
            <p class="lead">Sequências rápidas para soltar o corpo depois de horas sentado. Cabem no intervalo do trabalho.</p>
          </div>
        </div>
        <div class="duas" id="grade-adultos">{adultos.map(v => <CardVideo video={v} />)}</div>
      </div>
    </section>

    <section class="secao" id="professora">
      <div class="envolve professora">
        <div class="foto"><img src={capa('rFX-Vw-cbz4', 'maxresdefault')} alt="A professora do Flex Família alongando num tapete azul, ao ar livre" /></div>
        <div>
          <span class="olho">Quem conduz as histórias</span>
          <h2>A professora do Flex Família</h2>
          <p class="lead">Ela junta alongamento e contação de histórias para que as crianças se movimentem brincando, com movimentos pensados para cada idade.</p>
          <blockquote>"Flexibilidade para a família toda."</blockquote>
          <div class="inscrever">
            <a class="bt bt-primario" href={CANAL_INSCREVER} target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 9l5 3-5 3z" fill="#b5543a"/></svg>Inscreva-se no canal</a>
            <small>Novas histórias chegam primeiro no YouTube.</small>
          </div>
        </div>
      </div>
    </section>
  </main>
  <Rodape />
  <PlayerSobreposto />
</Base>
```

- [ ] **Step 6: Run the e2e test to verify it passes**

Run: `npx playwright test tests/e2e/site.spec.ts`
Expected: PASS on `desktop` and `celular`.

- [ ] **Step 7: Commit**

```bash
git add src tests playwright.config.ts
git commit -m "feat: site dos pais gerado a partir do catálogo"
```

---

### Task 4: Parents' site behaviour (filters, overlay player, hero rotation, menu)

**Files:**
- Create: `src/lib/youtube.ts`, `src/scripts/site.ts`
- Modify: `src/pages/index.astro` (add the script tag), `tests/e2e/site.spec.ts` (add tests)

**Interfaces:**
- Consumes: DOM contract from Task 3; `VIDEOS`, `porId`, `destaques`, `capa`, `rotuloCategoria`; `combina`.
- Produces:
  - `carregarYouTube(timeoutMs?: number): Promise<YTNamespace>` and `HOST_PRIVADO = 'https://www.youtube-nocookie.com'` (also used by Task 6)
  - `iniciarSite(): void` — wires up everything present on the page; safe on pages without a hero or filters (video pages).

- [ ] **Step 1: Write the failing e2e tests**

Append to `tests/e2e/site.spec.ts`:
```ts
test('filtrar por objetivo mostra só as histórias certas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Antes de dormir' }).click();
  const visiveis = page.locator('#grade-historias .card:visible');
  await expect(visiveis).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Antes de dormir' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Todas' }).click();
  await expect(visiveis).toHaveCount(10);
});

test('clicar num card abre o vídeo por cima da página e Esc fecha', async ({ page }) => {
  await page.goto('/');
  await page.locator('#grade-historias a.card[href="/videos/baleia"]').click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByRole('heading', { name: 'A Baleia no Mar' })).toBeVisible();
  await expect(dialogo.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/EH-uvdTY2bs/);
  await expect(dialogo.locator('li')).toHaveCount(3);
  await expect(page).toHaveURL('/');
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  await expect(dialogo.locator('iframe')).toHaveCount(0);
});

test('menu sanfona abre no celular', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só no celular');
  await page.goto('/');
  await expect(page.locator('#nav')).toBeHidden();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.locator('#nav')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'true');
});
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `npx playwright test tests/e2e/site.spec.ts`
Expected: the 3 new tests FAIL (no behaviour yet; clicking a card navigates to `/videos/baleia`, which 404s).

- [ ] **Step 3: YouTube loader**

`src/lib/youtube.ts`:
```ts
// Tipagem mínima da IFrame API que usamos.
export interface YTPlayer {
  playVideo(): void; pauseVideo(): void; stopVideo(): void; mute(): void;
  loadVideoById(arg: string | { videoId: string; startSeconds?: number }): void;
  getPlayerState?(): number;
}
export interface YTNamespace {
  Player: new (el: string | HTMLElement, opcoes: Record<string, unknown>) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
}
declare global {
  interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
}

export const HOST_PRIVADO = 'https://www.youtube-nocookie.com';

let carregando: Promise<YTNamespace> | null = null;

export function carregarYouTube(timeoutMs = 8000): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (carregando) return carregando;
  carregando = new Promise<YTNamespace>((resolve, reject) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { anterior?.(); resolve(window.YT!); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => reject(new Error('YouTube indisponível'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('YouTube demorou demais')), timeoutMs);
  }).catch(erro => { carregando = null; throw erro; });
  return carregando;
}
```

- [ ] **Step 4: Site behaviour**

`src/scripts/site.ts`:
```ts
import { capa, destaques, porId, rotuloCategoria } from '../data/videos';
import { combina } from '../lib/filtros';
import { carregarYouTube, HOST_PRIVADO, type YTPlayer } from '../lib/youtube';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let fundo: YTPlayer | null = null;

function iniciarPlayer() {
  const player = $('player');
  if (!player) return;
  let ultimoFoco: HTMLElement | null = null;

  const abrir = (id: string) => {
    const v = porId(id);
    if (!v) return false;
    ultimoFoco = document.activeElement as HTMLElement | null;
    $('player-tela')!.innerHTML = `<iframe src="${HOST_PRIVADO}/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${v.titulo}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    $('player-titulo')!.textContent = v.titulo;
    $('player-meta')!.textContent = `${rotuloCategoria(v)} · ${v.duracao} min`;
    $('player-beneficios')!.innerHTML = v.beneficios.map(b => `<li>${b}</li>`).join('');
    $<HTMLAnchorElement>('player-yt')!.href = `https://www.youtube.com/watch?v=${v.id}`;
    player.classList.remove('oculto');
    document.body.style.overflow = 'hidden';
    $('player-fechar')!.focus();
    try { fundo?.pauseVideo(); } catch { /* fundo indisponível */ }
    return true;
  };
  const fechar = () => {
    player.classList.add('oculto');
    $('player-tela')!.innerHTML = '';
    document.body.style.overflow = '';
    ultimoFoco?.focus();
    try { fundo?.playVideo(); } catch { /* fundo indisponível */ }
  };

  document.addEventListener('click', e => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.card[data-id]');
    if (!card) return;
    const me = e as MouseEvent;
    if (me.ctrlKey || me.metaKey || me.shiftKey || me.button !== 0) return; // nova aba continua indo para a página do vídeo
    if (abrir(card.dataset.id!)) e.preventDefault();
  });
  $('player-fechar')!.addEventListener('click', fechar);
  player.addEventListener('click', e => { if (e.target === player) fechar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !player.classList.contains('oculto')) fechar(); });
  $('agora')?.addEventListener('click', () => {
    const ativa = document.querySelector<HTMLElement>('#fundo img.ativa');
    if (ativa?.dataset.id) abrir(ativa.dataset.id);
  });
}

function iniciarFiltros() {
  const filtros = $('filtros');
  if (!filtros) return;
  filtros.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.filtro');
    if (!b) return;
    filtros.querySelectorAll('.filtro').forEach(f => f.setAttribute('aria-pressed', String(f === b)));
    let n = 0;
    document.querySelectorAll<HTMLElement>('#grade-historias .card').forEach(c => {
      const mostra = combina(c.dataset.obj!.split('|'), b.dataset.obj!);
      c.classList.toggle('some', !mostra);
      if (mostra) n++;
    });
    $('vazio')!.classList.toggle('oculto', n > 0);
  });
}

function iniciarAbertura() {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('#fundo img')];
  if (!imgs.length || reduzido()) return;
  let atual = 0;
  let videoPronto = false;

  setInterval(() => {
    if (document.hidden || !$('player')!.classList.contains('oculto')) return;
    atual = (atual + 1) % destaques.length;
    imgs.forEach((im, i) => im.classList.toggle('ativa', i === atual));
    const v = destaques[atual];
    $('agora-titulo')!.textContent = v.titulo;
    $('agora')!.querySelector('img')!.src = capa(v.id);
    document.querySelectorAll('#agora .barrinhas i').forEach((b, i) => b.classList.toggle('on', i === atual));
    if (videoPronto) try { fundo?.loadVideoById({ videoId: v.id, startSeconds: 45 }); } catch { /* segue com a capa */ }
  }, 14000);

  // Vídeo mudo de fundo; se a API não carregar, a capa continua no lugar.
  carregarYouTube().then(YT => {
    fundo = new YT.Player('bg-yt', {
      host: HOST_PRIVADO,
      videoId: destaques[0].id,
      playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, start: 45 },
      events: {
        onReady: (e: { target: YTPlayer }) => { e.target.mute(); e.target.playVideo(); },
        onStateChange: (e: { data: number }) => {
          if (e.data === YT.PlayerState.PLAYING) { videoPronto = true; $('bgvideo')!.classList.add('pronto'); }
        },
      },
    });
  }).catch(() => { /* sem vídeo de fundo */ });
}

function iniciarMenu() {
  const menu = $('menu');
  const hamb = $('hamb');
  if (!menu || !hamb) return;
  // Sem abertura escura (páginas de vídeo), o menu já começa sólido.
  const temAbertura = !!document.querySelector('.abertura');
  const solido = () => menu.classList.toggle('solido', !temAbertura || scrollY > 40 || menu.classList.contains('aberto'));
  addEventListener('scroll', solido, { passive: true });
  solido();
  hamb.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    hamb.setAttribute('aria-expanded', String(aberto));
    solido();
  });
  $('nav')!.addEventListener('click', e => {
    if ((e.target as HTMLElement).tagName !== 'A') return;
    menu.classList.remove('aberto');
    hamb.setAttribute('aria-expanded', 'false');
    solido();
  });
}

export function iniciarSite() {
  iniciarPlayer();
  iniciarFiltros();
  iniciarAbertura();
  iniciarMenu();
}
```

Add at the end of `src/pages/index.astro`, right before `</Base>`:
```astro
  <script>
    import { iniciarSite } from '../scripts/site';
    iniciarSite();
  </script>
```

- [ ] **Step 5: Run the e2e tests to verify they pass**

Run: `npx playwright test tests/e2e/site.spec.ts`
Expected: PASS (the mobile-menu test is skipped on `desktop`).

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat: filtros, player sobreposto, abertura com vídeo e menu do site"
```

---

### Task 5: One page per video (`/videos/[slug]`)

**Files:**
- Create: `src/pages/videos/[slug].astro`
- Modify: `src/styles/site.css` (append page styles), `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: `VIDEOS`, `porSlug`, `capa`, `rotuloCategoria`, `HOST_PRIVADO`; components `Menu`, `CardVideo`, `PlayerSobreposto`, `Rodape`; `iniciarSite()`.

- [ ] **Step 1: Write the failing e2e test**

Append to `tests/e2e/site.spec.ts`:
```ts
test('cada vídeo tem uma página própria com player e benefícios', async ({ page }) => {
  await page.goto('/videos/baleia');
  await expect(page).toHaveTitle('A Baleia no Mar · Flex Família');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A Baleia no Mar');
  await expect(page.locator('.video-pagina iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/EH-uvdTY2bs/);
  await expect(page.locator('.video-pagina .beneficios li')).toHaveCount(3);
  await expect(page.locator('.video-pagina .outros .card')).toHaveCount(3);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/site.spec.ts -g "página própria" --project=desktop`
Expected: FAIL, 404.

- [ ] **Step 3: Implement**

`src/pages/videos/[slug].astro`:
```astro
---
import Base from '../../layouts/Base.astro';
import Menu from '../../components/Menu.astro';
import CardVideo from '../../components/CardVideo.astro';
import PlayerSobreposto from '../../components/PlayerSobreposto.astro';
import Rodape from '../../components/Rodape.astro';
import { VIDEOS, CANAL_INSCREVER, rotuloCategoria, type Video } from '../../data/videos';
import { HOST_PRIVADO } from '../../lib/youtube';
import '../../styles/site.css';

export function getStaticPaths() {
  return VIDEOS.map(video => ({ params: { slug: video.slug }, props: { video } }));
}
interface Props { video: Video }
const { video } = Astro.props;
// Outros: primeiro da mesma categoria, depois o resto; sempre 3.
const outros = [
  ...VIDEOS.filter(v => v.categoria === video.categoria && v.slug !== video.slug),
  ...VIDEOS.filter(v => v.categoria !== video.categoria),
].slice(0, 3);
---
<Base titulo={`${video.titulo} · Flex Família`} descricao={`${video.titulo}: ${video.beneficios.join('. ')}.`} fontes="family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700">
  <Menu />
  <main class="video-pagina">
    <div class="envolve">
      <a class="voltar" href="/#historias">← Todas as histórias</a>
      <div class="video-grade">
        <div class="tela"><iframe src={`${HOST_PRIVADO}/embed/${video.id}?rel=0&modestbranding=1&playsinline=1`} title={video.titulo} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
        <div class="info">
          <span class="olho">{rotuloCategoria(video)} · {video.duracao} min</span>
          <h1>{video.titulo}</h1>
          <div class="tags">{video.objetivos.map(o => <span>{o}</span>)}</div>
          <ul class="beneficios">{video.beneficios.map(b => <li>{b}</li>)}</ul>
          <div class="acoes">
            {video.categoria !== 'adultos' && <a class="bt bt-crianca" href="/crianca">Fazer no Modo Criança</a>}
            <a class="bt bt-primario" href={CANAL_INSCREVER} target="_blank" rel="noopener">Inscreva-se no canal</a>
          </div>
        </div>
      </div>
      <section class="outros">
        <h2>Veja também</h2>
        <div class="grade">{outros.map(v => <CardVideo video={v} />)}</div>
      </section>
    </div>
  </main>
  <Rodape />
  <PlayerSobreposto />
  <script>
    import { iniciarSite } from '../../scripts/site';
    iniciarSite();
  </script>
</Base>
```

Append to `src/styles/site.css`:
```css
/* Página de cada vídeo */
.video-pagina{padding-block:calc(96px + env(safe-area-inset-top,0px)) 80px}
.video-pagina .voltar{display:inline-block;font-weight:800;text-decoration:none;color:var(--tinta-suave);margin-bottom:18px}
.video-pagina .voltar:hover{color:var(--tinta)}
.video-grade{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:clamp(20px,4vw,40px);align-items:start}
.video-grade .tela{aspect-ratio:16/9;background:#000;border-radius:16px;overflow:hidden}
.video-grade .tela iframe{width:100%;height:100%;border:0;display:block}
.video-grade h1{font-size:clamp(30px,4vw,44px);font-weight:900;letter-spacing:-.02em;margin:8px 0 14px}
.video-grade .tags{display:flex;gap:6px;flex-wrap:wrap}
.video-grade .tags span{font-size:13px;font-weight:800;color:var(--tinta-suave);background:#fff;border:1px solid var(--linha);padding:3px 10px;border-radius:999px}
.video-grade .beneficios{margin:18px 0 24px;padding-left:20px;display:grid;gap:6px}
.video-grade .acoes{display:flex;gap:12px;flex-wrap:wrap}
.video-pagina .outros{margin-top:clamp(48px,7vw,80px)}
.video-pagina .outros h2{font-size:clamp(24px,3vw,32px);margin-bottom:20px}
@media (max-width:900px){.video-grade{grid-template-columns:1fr}}
```

- [ ] **Step 4: Run all e2e tests**

Run: `npx playwright test tests/e2e/site.spec.ts`
Expected: PASS. Also confirm `dist/videos/` has 15 folders: `ls dist/videos | wc -l` → `15`.

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat: página própria para cada vídeo"
```

---

### Task 6: Kids' mode (`/crianca`)

**Files:**
- Create: `src/lib/voz.ts`, `src/lib/sons.ts`, `src/kids/kids.css`, `src/kids/arte.ts`, `src/kids/app.ts`, `src/pages/crianca.astro`, `tests/e2e/crianca.spec.ts`

**Interfaces:**
- Consumes: `historias`, `desafios`, `porSlug`, `PAGINAS`, `type Video`; `criarProgresso`, `storageDoNavegador`; `criarSegurar`; `carregarYouTube`, `HOST_PRIVADO`, `type YTPlayer`.
- Produces:
  - `criarVoz(somLigado: () => boolean): { falar(texto: string): void; calar(): void }`
  - `criarSons(somLigado: () => boolean): { pop(): void; papel(): void; carimbo(): void; festa(): void }`
  - `I: Record<string, string>`, `ARTE: Record<string, string>`, `arte(slug: string): string`, `CENARIOS: Record<'floresta' | 'mar' | 'castelo', string>`
  - `iniciarModoCrianca(opcoes: { teste: boolean }): void`

- [ ] **Step 1: Write the failing e2e test**

`tests/e2e/crianca.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/youtube|ytimg|googlevideo/, r => r.abort());
});

test('assistir uma história dá um adesivo que fica no álbum', async ({ page }) => {
  await page.goto('/crianca?teste=1');
  await expect(page.getByRole('heading', { name: 'Floresta' })).toBeVisible();

  const lebre = page.getByRole('button', { name: 'A Lebre e a Tartaruga', exact: true });
  await lebre.click();
  await page.getByRole('button', { name: 'Assistir A Lebre e a Tartaruga' }).click();
  await expect(page.locator('#tela-video')).toBeVisible();

  await page.getByRole('button', { name: 'teste: pular para o fim' }).click();
  await expect(page.getByRole('heading', { name: 'Muito bem!' })).toBeVisible();

  await page.getByRole('button', { name: 'Ver meu álbum' }).click();
  await expect(page.getByText('1 de 10 histórias')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Meu álbum de adesivos' }).click();
  await expect(page.getByText('1 de 10 histórias')).toBeVisible();
});

test('virar a página do livro', async ({ page }) => {
  await page.goto('/crianca');
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page.getByRole('heading', { name: 'Mar e Céu' })).toBeVisible();
});

test('desafio em família dá adesivo quando os dois marcam', async ({ page }) => {
  await page.goto('/crianca?teste=1');
  await page.getByRole('button', { name: 'Modo Família' }).click();
  await page.getByRole('button', { name: 'Desafio Aviãozinho' }).click();
  await page.getByRole('button', { name: 'teste: pular para o fim' }).click();
  await page.getByRole('button', { name: /Criança/ }).click();
  await page.getByRole('button', { name: /Adulto/ }).click();
  await expect(page.locator('#premio .adesivo')).toBeVisible();
});

test('sem ?teste=1 o botão de pular não aparece', async ({ page }) => {
  await page.goto('/crianca');
  await expect(page.getByRole('button', { name: 'teste: pular para o fim' })).toBeHidden();
});

test('segurar o cadeado por 3 segundos leva ao site dos pais', async ({ page }) => {
  await page.goto('/crianca');
  await page.getByRole('button', { name: 'Área dos adultos' }).click();
  const alvo = page.getByRole('button', { name: 'Segure para entrar' });
  await alvo.hover();
  await page.mouse.down();
  await page.waitForURL('/', { timeout: 6000 });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/crianca.spec.ts --project=desktop`
Expected: FAIL, 404 on `/crianca`.

- [ ] **Step 3: Voice and sounds**

`src/lib/voz.ts`:
```ts
// Hoje: voz sintetizada pt-BR. Futuro: trocar por gravações da professora sem mudar quem chama falar().
export function criarVoz(somLigado: () => boolean) {
  let voz: SpeechSynthesisVoice | null = null;
  const disponivel = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (disponivel) {
    const escolher = () => {
      const vozes = speechSynthesis.getVoices();
      voz = vozes.find(v => /pt-BR/i.test(v.lang) && /female|feminina|francisca|luciana|maria/i.test(v.name))
        ?? vozes.find(v => /pt-BR/i.test(v.lang)) ?? vozes.find(v => /^pt/i.test(v.lang)) ?? null;
    };
    escolher();
    speechSynthesis.onvoiceschanged = escolher;
  }
  return {
    falar(texto: string) {
      if (!disponivel || !somLigado()) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'pt-BR'; u.rate = 0.95; u.pitch = 1.15;
        if (voz) u.voice = voz;
        speechSynthesis.speak(u);
      } catch { /* sem voz: segue só com visual */ }
    },
    calar() { try { if (disponivel) speechSynthesis.cancel(); } catch { /* nada a calar */ } },
  };
}
```

`src/lib/sons.ts`:
```ts
// Efeitos gerados na hora com Web Audio: nenhum arquivo de som para baixar.
export function criarSons(somLigado: () => boolean) {
  let ctx: AudioContext | null = null;
  const pronto = () => {
    if (!somLigado()) return null;
    try { ctx ??= new AudioContext(); } catch { return null; }
    return ctx;
  };
  const tom = (c: AudioContext, freq: number, ini: number, dur: number, tipo: OscillatorType = 'sine', vol = 0.18) => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t + ini);
    g.gain.linearRampToValueAtTime(vol, t + ini + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + ini + dur);
    o.connect(g).connect(c.destination);
    o.start(t + ini); o.stop(t + ini + dur + 0.05);
  };
  const ruido = (c: AudioContext, dur: number, freq: number, vol: number) => {
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start();
  };
  return {
    pop() { const c = pronto(); if (c) { tom(c, 660, 0, 0.12); tom(c, 990, 0.05, 0.12); } },
    papel() { const c = pronto(); if (c) ruido(c, 0.35, 2400, 0.5); },
    carimbo() { const c = pronto(); if (c) { tom(c, 110, 0, 0.25, 'triangle', 0.4); ruido(c, 0.12, 400, 0.7); } },
    festa() { const c = pronto(); if (c) [523, 659, 784, 1047].forEach((f, i) => tom(c, f, i * 0.11, 0.3, 'triangle', 0.15)); },
  };
}
```

- [ ] **Step 4: Port styles and art**

Kids CSS (prototype lines 11–170 and 196–219, skipping the old "Cantinho dos Pais" rules):
```bash
sed -n '11,170p;196,219p' prototype/index.html > src/kids/kids.css
```
Then delete the `.selo-prototipo{...}` rule (two lines starting `.selo-prototipo{`) from `src/kids/kids.css`.

Art: copy lines 415–482 of `prototype/index.html` (`const I = {` through the closing `};` of `CENARIOS`) into `src/kids/arte.ts`:
```bash
sed -n '415,482p' prototype/index.html > src/kids/arte.ts
```
Then make these exact edits in `src/kids/arte.ts`:
- `const I = {` → `export const I: Record<string, string> = {`
- `const olho = (x,y,r=3) =>` → `const olho = (x: number, y: number, r = 3) =>`
- `const ARTE = {` → `export const ARTE: Record<string, string> = {`
- `const arte = slug =>` → `export const arte = (slug: string) =>`
- `const CENARIOS = {` → `export const CENARIOS: Record<'floresta' | 'mar' | 'castelo', string> = {`
- in `CENARIOS`, each `.map(([x,y,r])=>` → `.map(([x, y, r]: number[])=>` and `.map(([x,y,c])=>` → `.map(([x, y, c]: (string | number)[])=>`

Nothing else changes in the copied code.

Run: `npx tsc --noEmit -p .`
Expected: no errors in `src/kids/arte.ts`.

- [ ] **Step 5: The kids' page**

`src/pages/crianca.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import '../kids/kids.css';
---
<Base titulo="Modo Criança · Flex Família" descricao="Histórias para alongar: escolha um personagem, assista e ganhe adesivos." fontes="family=Gaegu:wght@400;700&family=Nunito:wght@400;600;800">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <filter id="aq" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="r"/>
        <feDisplacementMap in="SourceGraphic" in2="r" scale="5" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="2" result="g"/>
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 1" result="ga"/>
        <feComposite in="d" in2="ga" operator="in"/>
      </filter>
    </defs>
  </svg>

  <div id="app">
    <header class="barra">
      <button class="bt-icone oculto" id="bt-casa" aria-label="Voltar para o livro"></button>
      <button class="bt-icone" id="bt-album" aria-label="Meu álbum de adesivos"></button>
      <button class="bt-icone destaque" id="bt-familia" aria-label="Modo Família"></button>
      <div class="espaco"></div>
      <button class="bt-icone" id="bt-som" aria-label="Som ligado ou desligado"></button>
      <button class="bt-icone bt-pais" id="bt-pais" aria-label="Área dos adultos"></button>
    </header>

    <section class="tela" id="tela-mundo">
      <div class="livro"><div class="pagina" id="pagina"></div></div>
      <div class="pontos" id="pontos"></div>
    </section>

    <section class="tela oculto" id="tela-video">
      <div class="moldura">
        <div id="yt"></div>
        <div class="cobre" id="cobre" aria-hidden="true"></div>
        <div class="aviso-video oculto" id="aviso-video"></div>
      </div>
      <div class="controles">
        <button class="bt-icone bt-grande" id="bt-voltar-video" aria-label="Voltar"></button>
        <button class="bt-icone bt-grande destaque" id="bt-playpause" aria-label="Tocar ou pausar"></button>
        <button class="bt-teste oculto" id="bt-fim">teste: pular para o fim</button>
      </div>
    </section>

    <section class="tela oculto" id="tela-festa"><div class="festa" id="festa"></div></section>
    <section class="tela oculto" id="tela-album"><div class="folha" id="album"></div></section>
    <section class="tela oculto" id="tela-familia"><div class="folha" id="familia"></div></section>
  </div>

  <div class="modal oculto" id="barreira" role="dialog" aria-modal="true" aria-labelledby="barreira-titulo">
    <div class="caixa">
      <h3 id="barreira-titulo">Só para adultos</h3>
      <p>Segure o botão por 3 segundos para ir ao site dos pais.</p>
      <div class="segurar" id="segurar" role="button" tabindex="0" aria-label="Segure para entrar">
        <svg class="anel" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70"/></svg>
        <span>Segure</span>
      </div>
      <button class="fechar" id="barreira-fechar">Cancelar</button>
    </div>
  </div>

  <canvas id="confete"></canvas>

  <script>
    import { iniciarModoCrianca } from '../kids/app';
    iniciarModoCrianca({ teste: new URLSearchParams(location.search).has('teste') });
  </script>
</Base>
```

- [ ] **Step 6: The kids' app**

`src/kids/app.ts`:
```ts
import { desafios, historias, PAGINAS, porSlug, type Video } from '../data/videos';
import { criarProgresso, storageDoNavegador } from '../lib/progresso';
import { criarSegurar } from '../lib/segurar';
import { criarSons } from '../lib/sons';
import { criarVoz } from '../lib/voz';
import { carregarYouTube, HOST_PRIVADO, type YTPlayer } from '../lib/youtube';
import { ARTE, CENARIOS, I, arte } from './arte';

type Tela = 'mundo' | 'video' | 'festa' | 'album' | 'familia';
const TELAS: Tela[] = ['mundo', 'video', 'festa', 'album', 'familia'];

export function iniciarModoCrianca(opcoes: { teste: boolean }) {
  const $ = (id: string) => document.getElementById(id)!;
  const progresso = criarProgresso(storageDoNavegador());
  const voz = criarVoz(() => progresso.som);
  const som = criarSons(() => progresso.som);
  const reduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  let paginaAtual = 0;
  let videoAtual: Video | null = null;
  let player: YTPlayer | null = null;
  let tocando = false;

  $('bt-fim').classList.toggle('oculto', !opcoes.teste);

  /* ---------- Navegação ---------- */
  function ir(tela: Tela) {
    TELAS.forEach(t => $('tela-' + t).classList.toggle('oculto', t !== tela));
    const naCasa = tela === 'mundo';
    $('bt-casa').classList.toggle('oculto', naCasa || tela === 'video');
    $('bt-album').classList.toggle('oculto', !naCasa);
    $('bt-familia').classList.toggle('oculto', !naCasa);
    $('bt-pais').classList.toggle('oculto', tela === 'video');
    if (tela !== 'video') pararVideo();
    if (naCasa) desenharPagina();
  }

  /* ---------- Mundo Flex ---------- */
  function desenharPagina(direcao?: 'vira-prox' | 'vira-ant') {
    const p = PAGINAS[paginaAtual];
    const itens = historias.filter(v => v.pagina === paginaAtual);
    const el = $('pagina');
    el.innerHTML = CENARIOS[p.cenario] + `<h1>${p.nome}</h1>
      <div class="personagens">${itens.map(v => `
        <div class="personagem" data-slug="${v.slug}">
          <button class="figura" aria-label="${v.titulo}">${arte(v.slug)}</button>
          <span class="nome" aria-hidden="true">${v.titulo}</span>
          ${progresso.temAdesivo(v.slug) ? `<span class="estrela">${I.estrela}</span>` : ''}
          <button class="play" aria-label="Assistir ${v.titulo}">${I.play}</button>
        </div>`).join('')}
      </div>
      ${paginaAtual > 0 ? `<button class="orelha ant" aria-label="Página anterior">${I.setaE}</button>` : ''}
      ${paginaAtual < PAGINAS.length - 1 ? `<button class="orelha prox" aria-label="Próxima página">${I.seta}</button>` : ''}`;
    if (direcao) { el.classList.remove('vira-prox', 'vira-ant'); void el.offsetWidth; el.classList.add(direcao); }
    $('pontos').innerHTML = PAGINAS.map((_, i) => `<span class="${i === paginaAtual ? 'atual' : ''}"></span>`).join('');

    el.querySelectorAll<HTMLElement>('.personagem').forEach(card => {
      const v = porSlug(card.dataset.slug!)!;
      card.querySelector<HTMLButtonElement>('.figura')!.onclick = () => {
        if (card.classList.contains('escolhido')) { abrirVideo(v); return; }
        el.querySelectorAll('.personagem').forEach(c => c.classList.remove('escolhido'));
        card.classList.add('escolhido');
        const f = card.querySelector('.figura svg')!;
        f.classList.remove('balanca'); void (f as HTMLElement).getBoundingClientRect(); f.classList.add('balanca');
        som.pop(); voz.falar(`${v.titulo}! Vamos alongar?`);
      };
      card.querySelector<HTMLButtonElement>('.play')!.onclick = () => abrirVideo(v);
    });
    el.querySelector<HTMLButtonElement>('.orelha.prox')?.addEventListener('click', () => virar(1));
    el.querySelector<HTMLButtonElement>('.orelha.ant')?.addEventListener('click', () => virar(-1));
  }

  function virar(d: 1 | -1) {
    const n = paginaAtual + d;
    if (n < 0 || n >= PAGINAS.length) return;
    paginaAtual = n;
    som.papel();
    desenharPagina(d > 0 ? 'vira-prox' : 'vira-ant');
    setTimeout(() => voz.falar(PAGINAS[n].nome), 300);
  }

  let x0: number | null = null;
  $('pagina').addEventListener('pointerdown', e => { x0 = e.clientX; });
  $('pagina').addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 70) virar(dx < 0 ? 1 : -1);
  });

  /* ---------- Player ---------- */
  function avisoVideo(msg: string) {
    const a = $('aviso-video');
    a.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true">${ARTE.chuva}</svg><div>${msg}</div>`;
    a.classList.remove('oculto');
  }

  function abrirVideo(v: Video) {
    videoAtual = v;
    ir('video');
    $('aviso-video').classList.add('oculto');
    $('bt-voltar-video').innerHTML = I.casa;
    $('bt-playpause').innerHTML = I.play;
    voz.calar();
    if (player) { player.loadVideoById(v.id); return; }
    carregarYouTube().then(YT => {
      if (videoAtual !== v || player) { player?.loadVideoById(videoAtual!.id); return; }
      player = new YT.Player('yt', {
        host: HOST_PRIVADO,
        videoId: v.id,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, autoplay: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => e.target.playVideo(),
          onStateChange: (e: { data: number }) => {
            tocando = e.data === YT.PlayerState.PLAYING;
            $('bt-playpause').innerHTML = tocando ? I.pause : I.play;
            if (e.data === YT.PlayerState.ENDED) fimDoVideo();
          },
          onError: () => avisoVideo('Esse vídeo não quis abrir agora. Vamos escolher outro?'),
        },
      });
    }).catch(() => avisoVideo('Sem internet? O vídeo precisa de conexão para tocar.'));
  }

  function alternarPlay() {
    if (!player) return;
    if (tocando) player.pauseVideo(); else player.playVideo();
  }
  function pararVideo() {
    try { player?.stopVideo(); } catch { /* player ainda não existe */ }
    tocando = false;
  }
  function fimDoVideo() {
    pararVideo();
    if (!videoAtual) return;
    if (videoAtual.categoria === 'desafio') festaDesafio(videoAtual);
    else festaHistoria(videoAtual);
  }
  $('cobre').onclick = alternarPlay;
  $('bt-playpause').onclick = alternarPlay;
  $('bt-voltar-video').onclick = () => (videoAtual?.categoria === 'desafio' ? abrirFamilia() : ir('mundo'));
  $('bt-fim').onclick = fimDoVideo;

  /* ---------- Festa! ---------- */
  function festaHistoria(v: Video) {
    ir('festa');
    const novo = progresso.ganhar(v.slug);
    const prox = historias.find(h => !progresso.temAdesivo(h.slug)) ?? historias[(historias.indexOf(v) + 1) % historias.length];
    $('festa').innerHTML = `<h2>Muito bem!</h2>
      <div class="adesivo carimba">${arte(v.slug)}</div>
      <div class="botoes">
        <button class="bt-icone bt-grande" id="f-casa" aria-label="Voltar para o livro">${I.casa}</button>
        <button class="bt-icone bt-grande" id="f-album" aria-label="Ver meu álbum">${I.album}</button>
        <button class="bt-icone bt-grande destaque" id="f-mais" aria-label="Mais uma história: ${prox.titulo}">${I.mais}</button>
      </div>`;
    som.festa(); setTimeout(() => som.carimbo(), 350); confete();
    voz.falar(novo ? `Muito bem! Você ganhou o adesivo ${v.titulo}!` : 'Muito bem! Que alongamento lindo!');
    $('f-casa').onclick = () => ir('mundo');
    $('f-album').onclick = () => abrirAlbum();
    $('f-mais').onclick = () => abrirVideo(prox);
  }

  function festaDesafio(v: Video) {
    ir('festa');
    const feito = { crianca: false, adulto: false };
    const estrela = I.estrela.replace('<svg', '<svg class="est"');
    $('festa').innerHTML = `<h2>Conseguiram?</h2>
      <div class="dupla">
        <button class="cartao-pessoa" data-q="crianca" aria-pressed="false">${I.crianca}<span>Criança</span>${estrela}</button>
        <button class="cartao-pessoa" data-q="adulto" aria-pressed="false">${I.adulto}<span>Adulto</span>${estrela}</button>
      </div>
      <div id="premio"></div>
      <div class="botoes"><button class="bt-icone bt-grande" id="f-volta" aria-label="Voltar aos desafios">${I.familia}</button></div>`;
    voz.falar('Desafio feito? Toquem na estrela de quem conseguiu!');
    $('festa').querySelectorAll<HTMLButtonElement>('.cartao-pessoa').forEach(b => {
      b.onclick = () => {
        const q = b.dataset.q as 'crianca' | 'adulto';
        if (feito[q]) return;
        feito[q] = true;
        b.classList.add('feito'); b.setAttribute('aria-pressed', 'true'); som.pop();
        if (feito.crianca && feito.adulto) {
          progresso.ganharFamilia(v.slug);
          $('premio').innerHTML = `<div class="adesivo carimba" style="margin-top:14px">${arte('familia')}</div>`;
          som.festa(); setTimeout(() => som.carimbo(), 350); confete();
          voz.falar('Adesivo da família! Vocês são um time!');
        } else voz.falar(q === 'crianca' ? 'Agora o adulto!' : 'Agora a criança!');
      };
    });
    $('f-volta').onclick = () => abrirFamilia();
  }

  /* ---------- Confete de papel picado ---------- */
  function confete() {
    if (reduzido()) return;
    const cv = $('confete') as HTMLCanvasElement, c = cv.getContext('2d');
    if (!c) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const cores = ['#b5543a', '#7f9c96', '#d9a441', '#d98f7e', '#8fb3bf', '#f6ecd9'];
    const ps = Array.from({ length: 140 }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, w: 6 + Math.random() * 10, h: 4 + Math.random() * 8,
      vy: 2 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3, r: Math.random() * 6, vr: -0.15 + Math.random() * 0.3,
      cor: cores[(Math.random() * cores.length) | 0],
    }));
    const t0 = performance.now();
    const quadro = (t: number) => {
      c.clearRect(0, 0, cv.width, cv.height);
      for (const p of ps) {
        p.x += p.vx + Math.sin((t + p.r * 100) / 300); p.y += p.vy; p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      }
      if (t - t0 < 3200) requestAnimationFrame(quadro); else c.clearRect(0, 0, cv.width, cv.height);
    };
    requestAnimationFrame(quadro);
  }

  /* ---------- Álbum ---------- */
  function abrirAlbum() {
    ir('album');
    const n = progresso.contar(historias.map(h => h.slug));
    const nf = desafios.filter(d => progresso.temFamilia(d.slug)).length;
    $('album').innerHTML = `<h1>Meu Álbum</h1>
      <p class="sub">${n} de ${historias.length} histórias</p>
      <div class="grade-adesivos">${historias.map(h => `
        <button class="adesivo ${progresso.temAdesivo(h.slug) ? '' : 'vazio'}" data-slug="${h.slug}" aria-label="${h.titulo}">${arte(h.slug)}</button>`).join('')}
      </div>
      <div class="secao-titulo">Adesivos da Família · ${nf} de ${desafios.length}</div>
      <div class="grade-adesivos">${desafios.map(d => `
        <button class="adesivo ${progresso.temFamilia(d.slug) ? '' : 'vazio'}" data-slug="${d.slug}" aria-label="${d.titulo}">${arte(progresso.temFamilia(d.slug) ? 'familia' : d.slug)}</button>`).join('')}
      </div>`;
    voz.falar(n === 0 ? 'Seu álbum está esperando os primeiros adesivos!' : `Você já tem ${n} adesivos!`);
    $('album').querySelectorAll<HTMLButtonElement>('.adesivo').forEach(b => {
      b.onclick = () => {
        const v = porSlug(b.dataset.slug!)!;
        if (b.classList.contains('vazio')) voz.falar(`Esse ainda falta! É ${v.titulo}.`);
        else { som.pop(); voz.falar(v.titulo); }
      };
    });
  }

  /* ---------- Modo Família ---------- */
  function abrirFamilia() {
    ir('familia');
    $('familia').innerHTML = `<h1>Modo Família</h1>
      <p class="sub">Criança e adulto fazem juntos!</p>
      <div class="desafios">${desafios.map(d => `
        <button class="desafio" data-slug="${d.slug}" aria-label="Desafio ${d.titulo}">
          <div class="figura">${arte(d.slug)}</div>
          <span class="nome">${d.titulo}</span>
          <span class="duo">${progresso.temFamilia(d.slug) ? I.estrela + I.estrela + ' feito!' : d.duracao}</span>
        </button>`).join('')}
      </div>`;
    voz.falar('Modo Família! Escolha um desafio para fazer junto com um adulto.');
    $('familia').querySelectorAll<HTMLButtonElement>('.desafio').forEach(b => {
      b.onclick = () => abrirVideo(porSlug(b.dataset.slug!)!);
    });
  }

  /* ---------- Saída para adultos: segurar 3 s ---------- */
  const alvo = $('segurar');
  const anel = alvo.querySelector('circle')!;
  const segurar = criarSegurar({ duracaoMs: 3000, aoConcluir: () => { location.href = '/'; } });
  const comecar = (e: Event) => {
    e.preventDefault();
    anel.style.transition = 'stroke-dashoffset 3s linear';
    anel.style.strokeDashoffset = '0';
    segurar.comecar();
  };
  const cancelar = () => {
    segurar.cancelar();
    anel.style.transition = 'stroke-dashoffset .3s';
    anel.style.strokeDashoffset = '440';
  };
  alvo.addEventListener('pointerdown', comecar);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => alvo.addEventListener(t, cancelar));
  alvo.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) comecar(e); });
  alvo.addEventListener('keyup', cancelar);
  $('barreira-fechar').onclick = () => { cancelar(); $('barreira').classList.add('oculto'); };
  $('bt-pais').onclick = () => {
    voz.calar();
    anel.style.transition = 'none';
    anel.style.strokeDashoffset = '440';
    $('barreira').classList.remove('oculto');
  };

  /* ---------- Barra ---------- */
  const desenharSom = () => { $('bt-som').innerHTML = progresso.som ? I.somOn : I.somOff; };
  $('bt-casa').innerHTML = I.casa;
  $('bt-album').innerHTML = I.album;
  $('bt-familia').innerHTML = I.familia;
  $('bt-pais').innerHTML = I.cadeado;
  desenharSom();
  $('bt-casa').onclick = () => { som.pop(); ir('mundo'); };
  $('bt-album').onclick = () => { som.pop(); abrirAlbum(); };
  $('bt-familia').onclick = () => { som.pop(); abrirFamilia(); };
  $('bt-som').onclick = () => {
    progresso.definirSom(!progresso.som);
    desenharSom();
    if (progresso.som) som.pop(); else voz.calar();
  };

  ir('mundo');
}
```

- [ ] **Step 7: Run the kids' e2e tests**

Run: `npx playwright test tests/e2e/crianca.spec.ts`
Expected: PASS on `desktop` and `celular`.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat: Modo Criança com livro, festa, álbum e desafios em família"
```

---

### Task 7: Full verification and README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Type check, unit tests, e2e tests, build**

Run: `npx astro check && npx vitest run && npx playwright test && npm run build`
Expected: 0 type errors; all unit tests pass; all e2e tests pass; build prints the `[revisão] 15 vídeos com textos ainda não revisados...` warning and finishes. `npx astro check` may ask to install `@astrojs/check`; answer yes (`npm i -D @astrojs/check`).

- [ ] **Step 2: Visual check against the prototypes**

Run `npm run preview`, open `http://localhost:4321/`, `/videos/baleia` and `/crianca` at desktop and phone widths, and compare with `prototype/site/index.html` and `prototype/index.html`. Fix any visual difference introduced by the port.

- [ ] **Step 3: README**

`README.md`:
```markdown
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

## Conteúdo

Todos os vídeos, benefícios e objetivos estão em `src/data/videos.ts`.
Para incluir um vídeo novo, adicione uma entrada ali; se for uma história, desenhe também o personagem em `src/kids/arte.ts` (mesmo `slug`).
Quando a professora aprovar os textos de um vídeo, marque `revisadoPelaProfessora: true`. O build avisa quantos ainda faltam.

Para testar o Modo Criança sem assistir os vídeos inteiros, use `/crianca?teste=1` (aparece o botão "pular para o fim").

`prototype/` guarda os protótipos aprovados, usados como referência visual.
```

- [ ] **Step 4: Commit**

```bash
git add README.md package.json package-lock.json
git commit -m "docs: README com comandos e como editar o conteúdo"
```
