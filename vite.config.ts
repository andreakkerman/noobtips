import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { offlineGame } from './scripts/pwa/build';

const base = process.env.PAGES_BASE_PATH || '/';
if (!/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(base)) throw new Error('PAGES_BASE_PATH must be / or /repository-name/');

export default defineConfig({
  base,
  plugins: [react(), offlineGame()],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
