import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { BACKEND, e2eAuthHeaders } from "./e2eEnv";
import {
  prepareVisualCapture,
  waitForDashboardClientData,
} from "./visual-stable";

export const VISUAL_DASHBOARD_EMAIL = "argos-visual-regression@example.test";
export const VISUAL_DASHBOARD_PASSWORD = "E2eSecure2026!";

/**
 * Reloj fijo solo para la captura visual del panel.
 * 2026-06-15T12:00:00.000Z. No altera el reloj del servidor ni de otras pruebas.
 */
export const VISUAL_DASHBOARD_CLOCK_ISO = "2026-06-15T12:00:00.000Z";

/**
 * Actividad sintética de la prueba visual. El login real sigue escribiendo
 * su auditoría; esta lista sustituye solo la respuesta que pinta el panel
 * para que el texto relativo no dependa del reloj ni de filas nuevas.
 * Etiquetas con el reloj fijo: 10 min, 1 h, 6 h, 24 h, 25 h, 2 d, 3 d, 7 d.
 */
export const VISUAL_ACTIVITY_FIXTURE = [
  { id: 680001, action_type: "login_success", details: null, created_at: "2026-06-15T11:50:00.000Z" },
  { id: 680002, action_type: "login_success", details: null, created_at: "2026-06-15T11:00:00.000Z" },
  { id: 680003, action_type: "login_success", details: null, created_at: "2026-06-15T06:00:00.000Z" },
  { id: 680004, action_type: "login_success", details: null, created_at: "2026-06-14T12:00:00.000Z" },
  { id: 680005, action_type: "login_success", details: null, created_at: "2026-06-14T11:00:00.000Z" },
  { id: 680006, action_type: "login_success", details: null, created_at: "2026-06-13T12:00:00.000Z" },
  { id: 680007, action_type: "login_success", details: null, created_at: "2026-06-12T12:00:00.000Z" },
  { id: 680008, action_type: "login_success", details: null, created_at: "2026-06-08T12:00:00.000Z" },
];

const visualClockInstalled = new WeakSet<Page>();
const visualActivityInstalled = new WeakSet<Page>();

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

/**
 * Fija Date.now del navegador antes de que la aplicación lea la hora.
 * setFixedTime mantiene los temporizadores reales para que la página cargue.
 */
export async function installVisualDashboardClock(page: Page): Promise<void> {
  if (visualClockInstalled.has(page)) return;
  await page.clock.setFixedTime(new Date(VISUAL_DASHBOARD_CLOCK_ISO));
  visualClockInstalled.add(page);
}

/**
 * Sustituye solo `activity` de GET /api/client/portal.
 * El resto del portal, las alertas y el estado UNKNOWN siguen siendo los reales.
 */
export async function installVisualActivityFixture(page: Page): Promise<void> {
  if (visualActivityInstalled.has(page)) return;
  await page.route("**/api/client/portal", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    let body: { activity?: unknown };
    try {
      body = (await response.json()) as { activity?: unknown };
    } catch {
      await route.fulfill({ response });
      return;
    }
    body.activity = VISUAL_ACTIVITY_FIXTURE.map((row) => ({ ...row }));
    await route.fulfill({ response, json: body });
  });
  visualActivityInstalled.add(page);
}

async function prepareDeterministicDashboard(page: Page): Promise<void> {
  await installVisualDashboardClock(page);
  await installVisualActivityFixture(page);
}

/** Login UI flow and wait until dashboard main content is visually settled. */
export async function loginAndSettleDashboard(page: Page): Promise<void> {
  await prepareDeterministicDashboard(page);
  await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
  const email = page.locator("#login-email");
  const password = page.locator("#login-password");
  await email.waitFor();
  // El input es controlado. Hidratar React borra un fill previo y el
  // required del email impide el POST. Se reintenta hasta que el valor queda.
  await expect
    .poll(async () => {
      await email.fill(VISUAL_DASHBOARD_EMAIL);
      await password.fill(VISUAL_DASHBOARD_PASSWORD);
      return email.inputValue();
    })
    .toBe(VISUAL_DASHBOARD_EMAIL);
  await expect(password).not.toHaveValue("");

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
  await prepareDeterministicDashboard(page);
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
