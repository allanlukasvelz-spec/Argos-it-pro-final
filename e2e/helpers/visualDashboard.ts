import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { BACKEND, e2eAuthHeaders } from "./e2eEnv";
import {
  prepareVisualCapture,
  waitForDashboardClientData,
} from "./visual-stable";

export const VISUAL_DASHBOARD_EMAIL = "argos-visual-regression@example.test";
export const VISUAL_DASHBOARD_PASSWORD = "E2eSecure2026!";
const VISUAL_DASHBOARD_USER = {
  email: VISUAL_DASHBOARD_EMAIL,
  password: VISUAL_DASHBOARD_PASSWORD,
  name: "Visual Baseline",
  company: "Baseline Corp",
};

export async function ensureVisualDashboardUser(request: APIRequestContext): Promise<void> {
  const register = await request.post(`${BACKEND}/api/auth/register`, {
    data: VISUAL_DASHBOARD_USER,
    headers: e2eAuthHeaders(),
  });
  if (![201, 400, 409].includes(register.status())) {
    throw new Error(`visual dashboard register unexpected status ${register.status()}`);
  }
}

/** Login UI flow and wait until dashboard main content is visually settled. */
export async function loginAndSettleDashboard(page: Page): Promise<void> {
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  await page.locator("#login-email").fill(VISUAL_DASHBOARD_EMAIL);
  await page.locator("#login-password").fill(VISUAL_DASHBOARD_PASSWORD);

  const loginResponse = page.waitForResponse(
    (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST",
    { timeout: 15_000 }
  );

  const portalAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/portal") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );
  const monitoringAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/monitoring") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );
  const guardianAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/guardian") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );
  const webProjectsAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/web-projects") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );

  await page.getByRole("button", { name: /Iniciar sesion/i }).click();
  const login = await loginResponse;
  expect(login.status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await Promise.all([
    portalAfterNav,
    monitoringAfterNav,
    guardianAfterNav,
    webProjectsAfterNav,
  ]);

  await waitForDashboardClientData(page);
  await prepareVisualCapture(page, { hideChicoGuardian: true });
}

/** Re-navigate to /dashboard when session cookies already exist. */
export async function reloadAndSettleDashboard(page: Page): Promise<void> {
  const portalAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/portal") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );
  const monitoringAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/monitoring") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );
  const guardianAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/guardian") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );
  const webProjectsAfterNav = page.waitForResponse(
    (r) =>
      r.url().includes("/api/client/web-projects") &&
      r.request().method() === "GET" &&
      r.status() === 200,
    { timeout: 20_000 }
  );

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await Promise.all([
    portalAfterNav,
    monitoringAfterNav,
    guardianAfterNav,
    webProjectsAfterNav,
  ]);
  await waitForDashboardClientData(page);
  await prepareVisualCapture(page, { hideChicoGuardian: true });
}

export async function captureDashboardMain(page: Page): Promise<Buffer> {
  const content = page.locator("main.cp-main");
  await expect(content).toBeVisible();
  return content.screenshot({ animations: "disabled" });
}
