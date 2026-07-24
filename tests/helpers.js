function uniqueEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

const KILL_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

// The site has several infinite CSS animations (logo spin, dial pulses) that
// make Playwright's actionability "stable element" check flaky. Killing
// animations makes clicks deterministic without changing app behavior.
async function gotoHome(page, path = '/') {
  await page.goto(path);
  await page.addStyleTag({ content: KILL_ANIMATIONS_CSS });
}

async function reloadHome(page) {
  await page.reload();
  await page.addStyleTag({ content: KILL_ANIMATIONS_CSS });
}

async function openAuthModal(page) {
  // Idempotent: close first in case a prior action in this test left it open
  // (e.g. the success panel after register/login doesn't auto-close).
  await page.evaluate(() => { if (typeof closeAuthModal === 'function') closeAuthModal(); });
  await page.locator('#authBtn').click();
  await page.locator('#authOverlay.open').waitFor({ state: 'visible' });
}

async function registerUser(page, { email, name = 'Test', surname = 'User', phone = '0888123456', password = 'secret123' }) {
  await openAuthModal(page);
  await page.locator('#tabRegister').click();
  await page.locator('#regName').fill(name);
  await page.locator('#regSurname').fill(surname);
  await page.locator('#regPhone').fill(phone);
  await page.locator('#regEmail').fill(email);
  await page.locator('#regPassword').fill(password);
  await page.locator('#regPassword2').fill(password);
  const capQ = await page.locator('#capQ').textContent();
  const [a, b] = capQ.split('+').map(s => parseInt(s.trim(), 10));
  await page.locator('#regCaptcha').fill(String(a + b));
  await page.locator('button:has-text("✓ Регистрирай се")').click();
}

async function loginUser(page, { email, password }) {
  await openAuthModal(page);
  await page.locator('#tabLogin').click();
  await page.locator('#liEmail').fill(email);
  await page.locator('#liPassword').fill(password);
  await page.locator('button:has-text("→ Влез")').click();
}

module.exports = { uniqueEmail, gotoHome, reloadHome, openAuthModal, registerUser, loginUser };
