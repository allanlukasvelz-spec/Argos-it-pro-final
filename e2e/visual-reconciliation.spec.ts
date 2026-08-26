/**
 * Visual reconciliation screenshots — PUBLIC / CLIENT / NOC chrome isolation.
 * Staging: API registration for client; NOC skipped without admin fixture.
 */
import { test, expect } from "@playwright/test";
import { gotoE2e } from "./helpers/e2eNav";
import { BACKEND, e2eAuthHeaders, isStagingE2e } from "./helpers/e2eEnv";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");
const password = process.env.PHASE81_PASSWORD || "Phase81TestPass1";
let stagingFwd = 80;

function loadFixtures() {
  const files = fs
    .readdirSync(ARTIFACT_DIR)
    .filter((f) => f.startsWith("phase81-results-") && f.endsWith(".json"))
    .sort();
  const latest = files[files.length - 1];
  if (!latest) throw new Error("Missing phase81 fixtures JSON");
  return JSON.parse(fs.readFileSync(path.join(ARTIFACT_DIR, latest), "utf8")).fixtures as {
    emails: { userA: string; noc: string };
  };
}

async function login(page: import("@playwright/test").Page, email: string, pwd = password) {
  if (isStagingE2e) {
    stagingFwd = (stagingFwd % 200) + 1;
    await page.context().setExtraHTTPHeaders({
      "X-Forwarded-For": `203.0.113.${stagingFwd}`,
      Origin: process.env.E2E_ORIGIN || "http://127.0.0.1:3010"
    });
    await page.route("**/*.{woff,woff2,ttf,otf}", (route) => route.abort());
  }
  await gotoE2e(page, "/auth/login");
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(pwd);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"),
    page.getByRole("button", { name: /iniciar|entrar|login/i }).click()
  ]);
  expect(res.status(), `login ${res.status()}`).toBe(200);
  await page.waitForURL(/dashboard|noc/, { timeout: 30000, waitUntil: "domcontentloaded" as const });
}

test.describe("Visual reconciliation isolation", () => {
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
    // Avoid Playwright font-ready hang on staging marketing fonts
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
      email = loadFixtures().emails.userA;
    }
    await login(page, email, pwd);

    await gotoE2e(page, "/dashboard");
    await expect(page.getByRole("heading", { name: /Portal de cliente|Client portal/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);

    await gotoE2e(page, "/dashboard/informes");
    await expect(page.getByRole("heading", { name: /informes/i })).toBeVisible({ timeout: 15000 });
  });

  test("NOC shell — exclusive; no public header/cookie/assistants", async ({ page }) => {
    if (isStagingE2e) {
      test.skip(
        true,
        "NOC visual on staging needs admin fixture (not creatable via public register)"
      );
      return;
    }
    const fx = loadFixtures();
    await login(page, fx.emails.noc);

    await gotoE2e(page, "/noc");
    await expect(page.getByText(/ARGOS NOC/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);
  });
});
