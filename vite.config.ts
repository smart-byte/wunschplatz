/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import process from 'node:process';

const BASE = process.env.BASE_PATH || '/';

// Visit counting (see the privacy policy): built pages only, and Umami ignores every
// domain except wunschplatz.app, so dev servers, tests and forks are never counted.
const umami: Plugin = {
  name: 'umami',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'script',
      injectTo: 'head',
      attrs: {
        defer: true,
        src: 'https://analytics.smart-byte.com/script.js',
        'data-website-id': 'eedb2345-01b8-4e1f-8428-3ddb93348c4a',
        'data-domains': 'wunschplatz.app',
        'data-do-not-track': 'true',
        'data-exclude-search': 'true',
        'data-exclude-hash': 'true',
      },
    },
  ],
};

export default defineConfig(({ mode }) => ({
  // Keep browser tests isolated from an already running development server.
  cacheDir: `node_modules/.vite-${mode}`,
  base: BASE,
  plugins: [react(), umami],
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
