import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.E2E_PORT || "3000";
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // preview = localhost only; start = 0.0.0.0 for Coolify/Docker (do not append hostname args)
    command:
      e2ePort === "3000"
        ? "npm --prefix frontend run preview"
        : `npm --prefix frontend exec -- next start --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
