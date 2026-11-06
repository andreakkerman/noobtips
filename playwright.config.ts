import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  globalTimeout: 10 * 60_000,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5173', actionTimeout: 10_000, navigationTimeout: 15_000, launchOptions: { timeout: 30_000 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-1366', use: { browserName: 'chromium', viewport: { width: 1366, height: 768 } } },
    { name: 'chromebook-1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'touch-1024', use: { browserName: 'chromium', viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true } },
    { name: 'webkit-touch-1024', use: { browserName: 'webkit', viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true } },
  ],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
