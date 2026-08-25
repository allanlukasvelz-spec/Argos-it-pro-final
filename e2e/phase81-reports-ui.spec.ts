/**
 * Phase 8.1 UI validation — captures Client + NOC report screens.
 * Requires frontend :3000 and backend :4000 running.
 * Run: npx playwright test e2e/phase81-reports-ui.spec.ts
 */
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");
const FIXTURE_FILE = process.env.PHASE81_FIXTURES_JSON;
const password = process.env.PHASE81_PASSWORD || "Phase81TestPass1";

function loadFixtures() {
  const glob = fs.readdirSync(ARTIFACT_DIR).filter((f) => f.startsWith("phase81-results-"));
  const latest = glob.sort().pop();
  const file = FIXTURE_FILE || path.join(ARTIFACT_DIR, latest || "");
  if (!file || !fs.existsSync(file)) {
    throw new Error("Run backend/scripts/phase81-validation.js first");
  }
  return JSON.parse(fs.readFileSync(file, "utf8")).fixtures as {
    emails: { userA: string; noc: string };
  };
}

test.describe("Phase 8.1 reports UI", () => {
  test("Client informes READY + mobile", async ({ page }) => {
    const fx = loadFixtures();
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
    const fx = loadFixtures();
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
