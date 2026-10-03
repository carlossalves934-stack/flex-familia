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
