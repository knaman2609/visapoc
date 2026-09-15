import { defineConfig } from '@playwright/test'

/**
 * The console is a desktop tool. 1680 × 1000 is the size the studio is laid
 * out for; 1280 × 800 is the floor a laptop actually gives it, and both are
 * run so a change that only works at one width fails here.
 *
 * No device preset is spread in: a preset carries its own viewport and would
 * silently override the one below.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1680, height: 1000 } } },
    { name: 'laptop', use: { viewport: { width: 1280, height: 800 } } },
  ],
})
