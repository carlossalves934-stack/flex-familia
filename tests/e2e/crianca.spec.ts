import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/([^/]*\.)?(youtube(-nocookie)?\.com|ytimg\.com|googlevideo\.com)\//, r => r.abort());
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

test('voltar antes da API do YouTube chegar não cria player escondido', async ({ page }) => {
  await page.route('https://www.youtube.com/iframe_api', async route => {
    await new Promise(r => setTimeout(r, 800));
    await route.fulfill({
      contentType: 'text/javascript',
      body: `window.YT = { Player: class { constructor() { window.__criados = (window.__criados || 0) + 1; } playVideo() {} pauseVideo() {} stopVideo() {} loadVideoById() {} }, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 } };
        window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();`,
    });
  });
  await page.goto('/crianca');
  await page.getByRole('button', { name: 'A Lebre e a Tartaruga', exact: true }).click();
  await page.getByRole('button', { name: 'Assistir A Lebre e a Tartaruga' }).click();
  await expect(page.locator('#tela-video')).toBeVisible();
  await page.locator('#bt-voltar-video').click();
  await expect(page.getByRole('heading', { name: 'Floresta' })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __criados?: number }).__criados ?? 0)).toBe(0);
});

const FALSO_YT = `(() => {
  window.__calls = []; window.__criados = 0;
  window.YT = { Player: class {
    constructor(_el, opts) {
      window.__criados++; window.__criadoCom = opts.videoId;
      setTimeout(() => {
        for (const m of ['playVideo', 'pauseVideo', 'stopVideo']) this[m] = () => window.__calls.push(m);
        this.loadVideoById = id => window.__calls.push('load:' + id);
        opts.events.onReady({ target: this });
      }, 700);
    }
  }, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 } };
  window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();
})();`;

type Janela = { __calls: string[]; __criados: number; __criadoCom: string };

test('voltar antes do player ficar pronto não toca o vídeo escondido', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.route('https://www.youtube.com/iframe_api', r => r.fulfill({ contentType: 'text/javascript', body: FALSO_YT }));
  await page.goto('/crianca');
  await page.getByRole('button', { name: 'A Lebre e a Tartaruga', exact: true }).click();
  await page.getByRole('button', { name: 'Assistir A Lebre e a Tartaruga' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as Janela).__criados)).toBe(1);
  await page.locator('#bt-voltar-video').click();
  await page.waitForTimeout(1200);
  const calls = await page.evaluate(() => (window as unknown as Janela).__calls);
  expect(calls).not.toContain('playVideo');
  expect(calls).toContain('stopVideo');
  expect(erros).toEqual([]);
});

test('trocar de história antes do player ficar pronto toca a história nova', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.route('https://www.youtube.com/iframe_api', r => r.fulfill({ contentType: 'text/javascript', body: FALSO_YT }));
  await page.goto('/crianca');
  await page.getByRole('button', { name: 'A Lebre e a Tartaruga', exact: true }).click();
  await page.getByRole('button', { name: 'Assistir A Lebre e a Tartaruga' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as Janela).__criados)).toBe(1);
  await page.locator('#bt-voltar-video').click();
  await page.getByRole('button', { name: 'O Rato e o Leão', exact: true }).click();
  await page.getByRole('button', { name: 'Assistir O Rato e o Leão' }).click();
  await expect(page.locator('#tela-video')).toBeVisible();
  await page.waitForTimeout(1200);
  const { calls, primeiro } = await page.evaluate(() => ({ calls: (window as unknown as Janela).__calls, primeiro: (window as unknown as Janela).__criadoCom }));
  expect(calls).not.toContain('playVideo');
  const carregou = calls.filter(c => c.startsWith('load:'));
  expect(carregou).toHaveLength(1);
  expect(carregou[0]).not.toBe('load:' + primeiro);
  expect(erros).toEqual([]);
});
