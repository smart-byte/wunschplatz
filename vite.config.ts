/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import process from 'node:process';

const BASE = process.env.BASE_PATH || '/';

export default defineConfig(({ mode }) => ({
  // Keep browser tests isolated from an already running development server.
  cacheDir: `node_modules/.vite-${mode}`,
  base: BASE,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts', './tests/setup-idb.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
}));
