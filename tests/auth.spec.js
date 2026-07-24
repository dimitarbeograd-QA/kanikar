const { test, expect } = require('@playwright/test');
const { uniqueEmail, gotoHome, reloadHome, openAuthModal, registerUser, loginUser } = require('./helpers');

test('register creates an account and logs the user in', async ({ page }) => {
  const email = uniqueEmail('reguser');
  await gotoHome(page);
  await registerUser(page, { email, name: 'Мария', surname: 'Георгиева' });
  await expect(page.locator('#authSuccess.show')).toBeVisible();
  await expect(page.locator('#authBtn.logged-in')).toBeVisible();
  const cu = await page.evaluate(() => currentUser);
  expect(cu.email).toBe(email);
  expect(cu.role).toBe('customer');
});

test('registering the same email twice is rejected', async ({ page }) => {
  const email = uniqueEmail('dupuser');
  await gotoHome(page);
  await registerUser(page, { email });
  await page.evaluate(async () => { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); });
  await reloadHome(page);
  await registerUser(page, { email });
  await expect(page.locator('#errRegEmail.show')).toBeVisible();
  await expect(page.locator('#errRegEmail')).toHaveText('Имейлът вече е регистриран');
});

test('login rejects a wrong password and accepts the right one', async ({ page }) => {
  const email = uniqueEmail('loginuser');
  const password = 'correct-horse-1';
  await gotoHome(page);
  await registerUser(page, { email, password });
  await page.evaluate(async () => { await fetch('/api/logout', { method: 'POST', credentials: 'include' }); });
  await reloadHome(page);

  await loginUser(page, { email, password: 'wrong-one' });
  await expect(page.locator('#errLiPassword.show')).toBeVisible();

  await loginUser(page, { email, password });
  await expect(page.locator('#authBtn.logged-in')).toBeVisible();
});

test('logout clears the session, including after reload', async ({ page }) => {
  const email = uniqueEmail('logoutuser');
  await gotoHome(page);
  await registerUser(page, { email });
  await expect(page.locator('#authBtn.logged-in')).toBeVisible();

  await openAuthModal(page);
  await page.locator('button.btn-profile-logout').click();
  await expect(page.locator('#authBtn.logged-in')).toHaveCount(0);

  await reloadHome(page);
  await page.waitForTimeout(300);
  const cu = await page.evaluate(() => currentUser);
  expect(cu).toBeNull();
});

test('profile edits persist to the server and survive reload', async ({ page }) => {
  // The edit panel is a tall fixed-position overlay; use a tall viewport so
  // its save button is actually on-screen instead of fighting Playwright's
  // scroll-into-view heuristics for a fixed-position element.
  await page.setViewportSize({ width: 1280, height: 2000 });
  const email = uniqueEmail('profileuser');
  await gotoHome(page);
  await registerUser(page, { email });
  await expect(page.locator('#authBtn.logged-in')).toBeVisible();

  await openAuthModal(page);
  await page.locator('button:has-text("✏ Редактирай")').click();
  await page.locator('#editPhone').fill('+359 88 999 8877');
  await page.locator('#editAddress').fill('ул. Тестова 5, София');
  await page.locator('button:has-text("💾 Запази")').click();
  await expect(page.locator('#editPanel.show')).toHaveCount(0);

  await reloadHome(page);
  await page.waitForTimeout(300);
  const cu = await page.evaluate(() => currentUser);
  expect(cu.phone).toBe('+359 88 999 8877');
  expect(cu.address).toBe('ул. Тестова 5, София');
});
