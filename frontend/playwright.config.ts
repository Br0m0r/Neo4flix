import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.NEO4FLIX_E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
