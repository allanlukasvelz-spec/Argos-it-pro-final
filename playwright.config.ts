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
  globalSetup: require.resolve("./e2e/global-setup.ts"),

  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry",
  },

  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixels: 0,
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "npm --prefix backend run start",
      url: "http://127.0.0.1:4000/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        // Production default AUTH_RATE_LIMIT_MAX=8 stays for real deploys.
        // Local E2E: keep strict max but allow deterministic counter reset between suites.
        AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX || "8",
        ARGOS_ALLOW_RATE_LIMIT_RESET: "1",
        // Ensure test reset route is mountable (never set production here).
        NODE_ENV: process.env.NODE_ENV === "production" ? "test" : process.env.NODE_ENV || "test",
      },
    },
    {
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
  ],
});
