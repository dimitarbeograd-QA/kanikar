const { test, expect } = require('@playwright/test');
const { uniqueEmail, gotoHome, registerUser, loginUser, openAuthModal } = require('./helpers');

const ADMIN_EMAIL = 'admin@kanikar.bg';
const ADMIN_PASSWORD = 'admin123';

test.describe('admin bypass — regression (this used to be a one-click, no-password backdoor)', () => {
  test('the header gear-icon owner-bypass button no longer exists', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('button[title="Собственик"]')).toHaveCount(0);
  });

  test('ownerLogin() no longer exists as a callable global', async ({ page }) => {
    await gotoHome(page);
    const result = await page.evaluate(() => {
      try { ownerLogin(); return 'called-without-error'; }
      catch (e) { return 'threw:' + e.constructor.name; }
    });
    expect(result).toBe('threw:ReferenceError');
  });

  test('forging the old localStorage session/users keys grants no access', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => {
      localStorage.setItem('kk_session_v1', JSON.stringify('admin@kanikar.bg'));
      localStorage.setItem('kk_users_v1', JSON.stringify({
        'admin@kanikar.bg': { email: 'admin@kanikar.bg', role: 'admin', name: 'X', surname: 'Y' },
      }));
    });
    await page.reload();
    await page.waitForTimeout(300); // let async loadSession() settle
    const adminState = await page.evaluate(() => isAdmin());
    expect(adminState).toBe(false);
    const cu = await page.evaluate(() => currentUser);
    expect(cu).toBeNull();
  });

  test('a forged session cookie is rejected by the server', async ({ request }) => {
    const res = await request.get('/api/admin/clients', { headers: { Cookie: 'kk_sid=totally-made-up-token' } });
    expect(res.status()).toBe(401);
  });

  test('a regular registered customer cannot reach the admin API', async ({ page }) => {
    const email = uniqueEmail('customer');
    await gotoHome(page);
    await registerUser(page, { email });
    await expect(page.locator('#authBtn.logged-in')).toBeVisible();
    const adminState = await page.evaluate(() => isAdmin());
    expect(adminState).toBe(false);

    const cookies = await page.context().cookies();
    const sid = cookies.find(c => c.name === 'kk_sid');
    expect(sid).toBeTruthy();
    expect(sid.httpOnly).toBe(true);

    // Use page.request, not the standalone `request` fixture, so the
    // real browser session cookie (httpOnly, set via the UI login above)
    // is actually sent with this call.
    const res = await page.request.get('/api/admin/clients');
    expect(res.status()).toBe(403);
  });

  test('the admin panel button never appears for a non-admin user', async ({ page }) => {
    const email = uniqueEmail('customer2');
    await gotoHome(page);
    await registerUser(page, { email });
    await openAuthModal(page);
    await expect(page.locator('#profileAdminBtn')).toBeHidden();
  });
});

test.describe('real admin login', () => {
  test('the seeded admin account logs in through the real form and reaches the admin panel', async ({ page }) => {
    await gotoHome(page);
    await loginUser(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    await expect(page.locator('#authBtn.logged-in')).toBeVisible();

    await openAuthModal(page);
    const adminBtn = page.locator('#profileAdminBtn button');
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();
    await expect(page.locator('#adminPanel.open')).toBeVisible();
  });

  test('wrong admin password is rejected', async ({ page }) => {
    await gotoHome(page);
    await loginUser(page, { email: ADMIN_EMAIL, password: 'wrong-password' });
    await expect(page.locator('#errLiPassword.show')).toBeVisible();
    const cu = await page.evaluate(() => currentUser);
    expect(cu).toBeNull();
  });
});
