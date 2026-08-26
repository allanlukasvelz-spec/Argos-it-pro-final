import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND, e2eAuthHeaders, isStagingE2e } from "./helpers/e2eEnv";
import { gotoE2e } from "./helpers/e2eNav";

const PASSWORD = "E2eSecure2026!x";
let stagingFwd = 40;

test.beforeEach(async ({ page }) => {
  await resetAuthRateLimits();
  if (isStagingE2e) {
    stagingFwd = (stagingFwd % 200) + 1;
    await page.context().setExtraHTTPHeaders({
      "X-Forwarded-For": `203.0.113.${stagingFwd}`,
      Origin: process.env.E2E_ORIGIN || "http://127.0.0.1:3010"
    });
  }
});

function uniqueEmail(): string {
  return `argos-e2e-p4-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

async function registerViaAPI(request: APIRequestContext, email: string) {
  const res = await request.post(`${BACKEND}/api/auth/register`, {
    data: { email, password: PASSWORD, name: "E2E P4", company: "E2E Corp" },
    headers: e2eAuthHeaders()
  });
  expect(res.status()).toBe(201);
}

async function loginViaUI(page: Page, email: string) {
  await gotoE2e(page, "/auth/login");
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"),
    page.getByRole("button", { name: /Iniciar sesion/i }).click()
  ]);
  expect(response.status(), `login HTTP ${response.status()}`).toBe(200);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Phase 4 client portal", () => {
  test("shell navigation reaches real sections", async ({ page, request }) => {
    const email = uniqueEmail();
    await registerViaAPI(request, email);
    await loginViaUI(page, email);

    await expect(page.getByRole("heading", { name: /Portal de cliente/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /Portal de cliente/i })).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "Mis activos" }).click();
    await expect(page).toHaveURL(/\/dashboard\/activos/);
    await expect(page.getByRole("heading", { name: /Mis activos/i })).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "Monitorización" }).click();
    await expect(page).toHaveURL(/\/dashboard\/monitorizacion/);

    await page.getByRole("navigation").getByRole("link", { name: "Alertas" }).click();
    await expect(page).toHaveURL(/\/dashboard\/alertas/);

    await page.getByRole("navigation").getByRole("link", { name: "Incidentes" }).click();
    await expect(page).toHaveURL(/\/dashboard\/incidentes/);

    await page.getByRole("navigation").getByRole("link", { name: "Informes" }).click();
    await expect(page).toHaveURL(/\/dashboard\/informes/);
    await expect(page.getByRole("heading", { name: "Informes" })).toBeVisible();
    await expect(page.getByText(/datos verificados de ARGOS|Aún no hay informes/i).first()).toBeVisible();

    await page.getByRole("navigation").getByRole("link", { name: "Prevención" }).click();
    await expect(page).toHaveURL(/\/dashboard\/prevencion/);
    await expect(page.getByText(/NOT_AVAILABLE_YET|aún no disponible/i).first()).toBeVisible();

    // No NOC route in client nav
    await expect(page.getByRole("link", { name: /^NOC$/i })).toHaveCount(0);
  });
});
