import { defineConfig, devices } from "@playwright/test";

/** Config de cierre FASE 13: servidores manuales en 4001/3000 (sin reutilizar :4000 rate-limited). */
const e2ePort = process.env.E2E_PORT || "3000";
const e2eOrigin = process.env.E2E_ORIGIN || `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "e2e",
  testMatch: "phase13-web-projects.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  globalSetup: require.resolve("./e2e/global-setup.ts"),
  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
