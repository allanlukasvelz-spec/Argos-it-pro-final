/**
 * Phase 8.1 UI validation — captures Client + NOC report screens.
 * Requires frontend :3000 and backend :4000 running.
 * Run: npx playwright test e2e/phase81-reports-ui.spec.ts
 */
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { ensurePhase81FixtureUsers, loadPhase81Fixtures } from "./helpers/ensurePhase81FixtureUsers";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");
const password = process.env.PHASE81_PASSWORD || "Phase81TestPass1";

test.describe("Phase 8.1 reports UI", () => {
  test.beforeAll(async ({ request }) => {
    await ensurePhase81FixtureUsers(request, password);
  });

  test("Client informes READY + mobile", async ({ page }) => {
    const fx = loadPhase81Fixtures();
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

    await page.goto("/auth/login");
    await page.getByLabel(/correo|email/i).fill(fx.emails.userA);
    await page.getByLabel(/contraseña|password/i).fill(password);
    await page.getByRole("button", { name: /iniciar|entrar|login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 30000 });

    await page.goto("/dashboard/informes");
    await expect(page.getByRole("heading", { name: /informes/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "ui-client-reports-desktop.png"), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "ui-client-reports-mobile.png"), fullPage: true });

    const readyLink = page.getByText(/listo|ready|disponible/i).first();
    if (await readyLink.isVisible().catch(() => false)) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "ui-client-report-ready.png"), fullPage: true });
    }
  });

  test("NOC reports list", async ({ page }) => {
    const fx = loadPhase81Fixtures();
    await page.goto("/auth/login");
    await page.getByLabel(/correo|email/i).fill(fx.emails.noc);
    await page.getByLabel(/contraseña|password/i).fill(password);
    await page.getByRole("button", { name: /iniciar|entrar|login/i }).click();
    await page.waitForURL(/dashboard|noc/, { timeout: 30000 });

    await page.goto("/noc/reports");
    await expect(page.getByRole("heading", { name: /informes|reports/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "ui-noc-reports.png"), fullPage: true });
  });
});
