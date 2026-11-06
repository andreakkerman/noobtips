import { defineConfig } from '@playwright/test';
import regression from './playwright.config';

// Exercise the actual dist artifact that Pages will publish, including its base path.
const base = process.env.PAGES_BASE_PATH || '/';
export default defineConfig({
  ...regression,
  grep: /@smoke/,
  workers: 2,
  globalTimeout: 3 * 60_000,
  projects: regression.projects!.filter(project => ['desktop-1366', 'webkit-touch-1024'].includes(project.name!)),
  use: { ...regression.use, baseURL: `http://127.0.0.1:4173${base}` },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: `http://127.0.0.1:4173${base}`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
