/**
 * Staging NOC visual E2E — real admin via staging harness + real /api/auth/login.
 * Screenshots under docs/architecture/phase8-validation-artifacts/
 */
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { gotoE2e } from "./helpers/e2eNav";
import { isStagingE2e } from "./helpers/e2eEnv";
import { provisionStagingHarness } from "./helpers/stagingHarness";
import { loginViaUi } from "./helpers/loginUi";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");

test.describe("NOC visual staging", () => {
  test.skip(!isStagingE2e, "Only against staging Compose (E2E_STAGING=1)");

  test("NOC routes — NocShell only, operational pages, responsive", async ({ page }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    const fx = await provisionStagingHarness();
    await loginViaUi(page, fx.admin.email, fx.admin.password);

    const routes: { path: string; assert: RegExp; shot: string }[] = [
      { path: "/noc", assert: /Command Center|ARGOS NOC/i, shot: "noc-command-center.png" },
      { path: "/noc/reports", assert: /Reports|Informes|Jobs/i, shot: "noc-reports.png" },
      { path: "/noc/agents", assert: /Agents|Enrollment/i, shot: "noc-agents.png" },
      { path: "/noc/incidents", assert: /Incidents|Incidentes/i, shot: "noc-incidents.png" },
      {
        path: "/noc/remediations",
        assert: /Remediation/i,
        shot: "noc-remediations.png"
      },
      {
        path: "/noc/platform-health",
        assert: /Platform Health|platform/i,
        shot: "noc-platform-health.png"
      }
    ];

    for (const r of routes) {
      await gotoE2e(page, r.path);
      await expect(page.getByText(/ARGOS NOC/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(r.assert).first()).toBeVisible({ timeout: 15000 });

      await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);
      await expect(page.locator("[data-chico-state]")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Accept$/i })).toHaveCount(0);
      await expect(page.getByText(/We use technical and analytics cookies/i)).toHaveCount(0);
      await expect(page.locator(".argos-noc")).toBeVisible();
      await expect(page.locator(".noc-shell")).toBeVisible();

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, r.shot),
        fullPage: true
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoE2e(page, "/noc");
    await expect(page.getByText(/ARGOS NOC/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "noc-command-center-narrow.png"),
      fullPage: true
    });
  });
});
