import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.E2E_PORT || "3000";
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;
const e2eBackendPort = process.env.E2E_BACKEND_PORT || "4000";
const e2eBackendUrl = process.env.E2E_BACKEND_URL || `http://127.0.0.1:${e2eBackendPort}`;
const e2eDedicated = process.env.E2E_DEDICATED === "1" || Boolean(process.env.CI);

// Phase 15–18 API helpers default to :3020 when unset; align with Playwright webServer ports (CI uses :3000/:4000).
if (!process.env.E2E_ORIGIN) process.env.E2E_ORIGIN = e2eOrigin;
if (!process.env.E2E_BACKEND_URL) process.env.E2E_BACKEND_URL = e2eBackendUrl;

export default defineConfig({
  testDir: "e2e",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{platform}{ext}",
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
      name: "visual-regression",
      testMatch: /visual-regression\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: /visual-regression\.spec\.ts/,
      dependencies: ["visual-regression"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "npm --prefix backend run start",
      url: `${e2eBackendUrl}/api/health`,
      reuseExistingServer: !e2eDedicated,
      timeout: 30_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        PORT: e2eBackendPort,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        CORS_ORIGINS: `${e2eOrigin},http://localhost:${e2ePort},http://127.0.0.1:3000,http://localhost:3000`,
        FRONTEND_URL: e2eOrigin,
        AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX || "128",
        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || "12000",
        ARGOS_ALLOW_RATE_LIMIT_RESET: "1",
        ARGOS_COOKIE_SECURE: process.env.ARGOS_COOKIE_SECURE || "0",
        NODE_ENV: "test",
      },
    },
    {
      command: e2eDedicated
        ? `sh -c 'cd frontend && npm run build && npx next start --hostname 127.0.0.1 --port ${e2ePort}'`
        : `sh -c 'cd frontend && npx next start --hostname 127.0.0.1 --port ${e2ePort}'`,
      url: e2eOrigin,
      reuseExistingServer: !e2eDedicated,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "production",
        ARGOS_E2E_API_REWRITE: e2eDedicated ? "1" : "",
        NEXT_PUBLIC_BACKEND_URL: e2eDedicated ? e2eOrigin : e2eBackendUrl,
        BACKEND_URL: e2eBackendUrl,
        ARGOS_COOKIE_SECURE: process.env.ARGOS_COOKIE_SECURE || "0",
      },
    },
  ],
});
