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
