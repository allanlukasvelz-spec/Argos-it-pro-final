import { test, expect } from "@playwright/test";
import {
  VISUAL_VIEWPORT,
  gotoStable,
  installVisualTestInit,
  stabilizePage,
} from "./helpers/visual-stable";

const BACKEND = "http://127.0.0.1:4000";
const PASSWORD = "E2eSecure2026!";
const VISUAL_DASHBOARD_EMAIL = "argos-visual-regression@example.test";
const VISUAL_DASHBOARD_USER = {
  email: VISUAL_DASHBOARD_EMAIL,
  password: PASSWORD,
  name: "Visual Baseline",
  company: "Baseline Corp",
};

async function ensureVisualDashboardUser(request: import("@playwright/test").APIRequestContext): Promise<void> {
  const register = await request.post(`${BACKEND}/api/auth/register`, {
    data: VISUAL_DASHBOARD_USER,
  });
  if (![201, 400, 409].includes(register.status())) {
    throw new Error(`visual dashboard register unexpected status ${register.status()}`);
  }
}

const screenshotOptions = {
  fullPage: false,
  animations: "disabled" as const,
  maxDiffPixels: 0,
  timeout: 20_000,
};

test.describe("visual regression baseline (21.1)", () => {
  test.use({
    viewport: VISUAL_VIEWPORT,
    deviceScaleFactor: 1,
  });

  test.beforeEach(async ({ page }) => {
    await installVisualTestInit(page);
  });

  test("home /", async ({ page }) => {
    await gotoStable(page, "/");
    await expect(page).toHaveScreenshot("home.png", {
      ...screenshotOptions,
      mask: [page.locator(".argos-topbar-mascot-slot")],
    });
  });

  test("metodo /metodo", async ({ page }) => {
    await gotoStable(page, "/metodo");
    await expect(page).toHaveScreenshot("metodo.png", screenshotOptions);
  });

  test("servicios /servicios", async ({ page }) => {
    await gotoStable(page, "/servicios");
    await expect(page).toHaveScreenshot("servicios.png", {
      ...screenshotOptions,
      mask: [page.locator(".argos-topbar-mascot-slot")],
    });
  });

  test("contacto /contacto", async ({ page }) => {
    await gotoStable(page, "/contacto");
    await expect(page).toHaveScreenshot("contacto.png", screenshotOptions);
  });

  test("auth login /auth/login", async ({ page }) => {
    await gotoStable(page, "/auth/login");
    await expect(page).toHaveScreenshot("auth-login.png", screenshotOptions);
  });

  test("dashboard /dashboard (authenticated)", async ({ page, request }) => {
    await ensureVisualDashboardUser(request);

    await page.goto("/auth/login", { waitUntil: "domcontentloaded" });
    await page.locator("#login-email").fill(VISUAL_DASHBOARD_EMAIL);
    await page.locator("#login-password").fill(PASSWORD);
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST",
        { timeout: 15_000 }
      ),
      page.getByRole("button", { name: /Iniciar sesion/i }).click(),
    ]);
    expect(loginResponse.status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await expect(page.getByText("Cargando portal")).toHaveCount(0, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /Portal de cliente|Client portal/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Baseline Corp")).toBeVisible({ timeout: 10_000 });

    await stabilizePage(page);
    await page.waitForTimeout(800);

    const content = page.locator(".argos-content-layer");
    await expect(content).toHaveScreenshot("dashboard.png", screenshotOptions);
  });
});
