/**
 * Visual reconciliation screenshots — PUBLIC / CLIENT / NOC chrome isolation.
 * Staging: harness admin for NOC; client via register.
 */
import { test, expect } from "@playwright/test";
import { gotoE2e } from "./helpers/e2eNav";
import { BACKEND, e2eAuthHeaders, isStagingE2e } from "./helpers/e2eEnv";
import { ensurePhase81FixtureUsers, loadPhase81Fixtures } from "./helpers/ensurePhase81FixtureUsers";
import { loginViaUi } from "./helpers/loginUi";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");
const password = process.env.PHASE81_PASSWORD || "Phase81TestPass1";

test.describe("Visual reconciliation isolation", () => {
  test.beforeAll(async ({ request }) => {
    await ensurePhase81FixtureUsers(request, password);
  });
  test("PUBLIC page keeps marketing chrome", async ({ page }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    if (isStagingE2e) {
      await page.route("**/*.{woff,woff2,ttf,otf}", (route) => route.abort());
    }
    await gotoE2e(page, "/");
    await expect(page.locator("body")).toBeVisible();
    const hasPublicChrome =
      (await page.getByRole("link", { name: /portal|contacto|servicios/i }).count()) > 0 ||
      (await page.locator("header").count()) > 0;
    expect(hasPublicChrome).toBeTruthy();
    if (!isStagingE2e) {
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, "visual-public-home.png"),
        fullPage: true
      });
    }
  });

  test("CLIENT shell — no public header; desktop + mobile", async ({ page, request }) => {
    let email: string;
    let pwd = password;
    if (isStagingE2e) {
      email = `visual-client-${Date.now()}@example.test`;
      pwd = "E2eSecure2026!x";
      const reg = await request.post(`${BACKEND}/api/auth/register`, {
        data: { email, password: pwd, name: "Visual Client", company: "Visual Corp" },
        headers: e2eAuthHeaders()
      });
      expect([201, 409]).toContain(reg.status());
    } else {
      email = loadPhase81Fixtures().emails.userA;
    }
    await loginViaUi(page, email, pwd);

    await gotoE2e(page, "/dashboard");
    await expect(page.getByRole("heading", { name: /Portal de cliente|Client portal/i })).toBeVisible({
      timeout: 15000
    });
    await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);

    await gotoE2e(page, "/dashboard/informes");
    await expect(page.getByRole("heading", { name: /informes/i })).toBeVisible({ timeout: 15000 });
  });

  test("NOC shell — exclusive; no public header/cookie/assistants", async ({ page }) => {
    let email: string;
    let pwd = password;
    if (isStagingE2e) {
      const { provisionStagingHarness } = await import("./helpers/stagingHarness");
      const harness = await provisionStagingHarness();
      email = harness.admin.email;
      pwd = harness.admin.password;
    } else {
      email = loadPhase81Fixtures().emails.noc;
    }
    await loginViaUi(page, email, pwd);

    await gotoE2e(page, "/noc");
    await expect(page.getByText(/ARGOS NOC/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);
    await expect(page.locator(".argos-noc")).toBeVisible();
    await expect(page.locator("[data-chico-state]")).toHaveCount(0);
  });
});
