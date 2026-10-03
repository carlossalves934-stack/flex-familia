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
