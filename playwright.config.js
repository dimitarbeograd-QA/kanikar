const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const TEST_DB_PATH = path.join(__dirname, 'server', 'kanicar.test.db');

module.exports = defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/global-setup.js'),
  fullyParallel: false, // shared SQLite file — avoid cross-test write races
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60000, // bcrypt hashing under load can push auth flows past the 30s default
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3050',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },
  webServer: {
    command: 'node server.js',
    cwd: './server',
    url: 'http://localhost:3050',
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PORT: '3050',
      KANICAR_DB_PATH: TEST_DB_PATH,
      KANICAR_ADMIN_PASSWORD: 'admin123',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
