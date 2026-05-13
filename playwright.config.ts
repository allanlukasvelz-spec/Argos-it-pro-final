import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // El build corre en `npm run test:e2e` (antes de Playwright), no aquí: así no hay dos `next build`
    // concurrentes si verify/e2e se lanzan en paralelo o si queda lock en `.next` entre procesos.
    // `next dev` puede provocar EMFILE en macOS; `next start` evita watchers.
    command: "npm --prefix frontend run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
