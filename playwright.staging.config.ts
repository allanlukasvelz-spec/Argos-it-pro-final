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

  // Deliberate exclusions for staging G13 (documented in ARGOS_STAGING_FINAL_VALIDATION.md):
  // - visual-regression: pixel baselines are local chromium project; networkidle hangs on staging marketing assets
  // - phase81-reports-ui: requires local phase81 fixture seed; NOC/client reports covered by noc-visual-staging + phase8 pipeline
  testIgnore: ["**/visual-regression.spec.ts", "**/phase81-reports-ui.spec.ts"],

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
