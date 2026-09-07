import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    locale: 'de-DE',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5174 --strictPort --mode e2e',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
