const { test, expect } = require('@playwright/test');
const { gotoHome } = require('./helpers');

test('homepage loads with no console errors and renders the tire catalog', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Chromium logs the anonymous /api/me 401 (not-logged-in check) as a
    // console "error" even though the app handles it correctly — expected,
    // and it's the only automatic request a fresh unauthenticated load makes.
    if (text.includes('Failed to load resource') && text.includes('401')) return;
    errors.push(text);
  });

  await gotoHome(page);
  await expect(page).toHaveTitle(/КаниКар/);
  await expect(page.locator('#catalog .card').first()).toBeVisible();
  const cardCount = await page.locator('#catalog .card').count();
  expect(cardCount).toBeGreaterThan(0);

  expect(errors, `console/page errors: ${errors.join('\n')}`).toEqual([]);
});

test('adding a tire to cart updates the cart badge and opens the cart', async ({ page }) => {
  await gotoHome(page);
  await page.locator('#catalog .card').first().click();
  await page.locator('.btn-quote').click();
  await expect(page.locator('#cartOverlay.open')).toBeVisible();
  const count = await page.evaluate(() => cartItemCount());
  expect(count).toBeGreaterThan(0);
});
