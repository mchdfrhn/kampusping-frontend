import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests drive the real UI against the real API.
 *
 * Prerequisites (see e2e/README.md): the backend running on E2E_API_URL with an administrator
 * account, and CORS allowing this app's origin. The web app itself is started for you.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const { port } = new URL(baseURL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  // `next dev` compiles each route on first visit, which can take several seconds.
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI ? `npm run start -- -p ${port}` : `npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
