import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright against existing staging stack (FE :3010, API :4010).
 * Does NOT start a local backend with test-reset flags.
 * Does NOT weaken staging security flags.
 */
const e2ePort = process.env.E2E_PORT || "3010";
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "var/staging-e2e/playwright-results.json" }]],
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  timeout: 90_000,

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
      name: "chromium-staging",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // No webServer — staging Compose already serves FE/API.
});
