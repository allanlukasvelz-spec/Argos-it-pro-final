/**
 * Visual reconciliation screenshots — PUBLIC / CLIENT / NOC chrome isolation.
 * Requires backend :4000 + frontend :3000 with latest build.
 */
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = path.join("docs", "architecture", "phase8-validation-artifacts");
const password = process.env.PHASE81_PASSWORD || "Phase81TestPass1";

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

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/auth/login");
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /iniciar|entrar|login/i }).click();
  await page.waitForURL(/dashboard|noc/, { timeout: 30000 });
}

test.describe("Visual reconciliation isolation", () => {
  test("PUBLIC page keeps marketing chrome", async ({ page }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // Public chrome present (header nav or brand)
    const hasPublicChrome =
      (await page.getByRole("link", { name: /portal|contacto|servicios/i }).count()) > 0 ||
      (await page.locator("header").count()) > 0;
    expect(hasPublicChrome).toBeTruthy();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-public-home.png"),
      fullPage: true
    });
  });

  test("CLIENT shell — no public header; desktop + mobile", async ({ page }) => {
    const fx = loadFixtures();
    await login(page, fx.emails.userA);

    await page.goto("/dashboard");
    await expect(page.getByText(/client portal/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-client-dashboard-desktop.png"),
      fullPage: true
    });

    await page.goto("/dashboard/informes");
    await expect(page.getByRole("heading", { name: /informes/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-client-informes-desktop.png"),
      fullPage: true
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/informes");
    await expect(page.getByRole("heading", { name: /informes/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-client-informes-mobile.png"),
      fullPage: true
    });
  });

  test("NOC shell — exclusive; no public header/cookie/assistants", async ({ page }) => {
    const fx = loadFixtures();
    await login(page, fx.emails.noc);

    await page.goto("/noc");
    await expect(page.getByText(/ARGOS NOC/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Método ARGOS|Iniciar diagnóstico/i })).toHaveCount(0);
    await expect(page.getByText(/Accept|Aceptar cookies|cookie policy/i)).toHaveCount(0);
    await expect(page.getByText(/I am watching over your environment/i)).toHaveCount(0);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-noc-command-desktop.png"),
      fullPage: true
    });

    await page.goto("/noc/reports");
    await expect(page.getByRole("heading", { name: /Reports/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".noc-table")).toBeVisible();
    await expect(page.locator(".cp-table")).toHaveCount(0);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-noc-reports-desktop.png"),
      fullPage: true
    });

    await page.goto("/noc/agents");
    await expect(page.getByRole("heading", { name: "Agents", exact: true })).toBeVisible({
      timeout: 15000
    });
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-noc-agents-desktop.png"),
      fullPage: true
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/noc/reports");
    await expect(page.getByRole("heading", { name: /Reports/i })).toBeVisible();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "visual-noc-reports-narrow.png"),
      fullPage: true
    });
  });
});
