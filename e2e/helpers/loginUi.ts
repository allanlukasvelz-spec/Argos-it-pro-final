/**
 * Shared staging/UI login helpers — wait for React hydration before fill.
 */
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { gotoE2e } from "./e2eNav";
import { e2eAuthHeaders, isStagingE2e } from "./e2eEnv";

export async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole("button", { name: /^Accept$/i });
  try {
    await accept.click({ timeout: 2500 });
  } catch {
    // Banner absent or already dismissed
  }
}

export async function loginViaUi(page: Page, email: string, password: string) {
  if (isStagingE2e) {
    await page.context().setExtraHTTPHeaders(e2eAuthHeaders());
    await page.route("**/*.{woff,woff2,ttf,otf}", (route) => route.abort());
  }
  await gotoE2e(page, "/auth/login");
  await dismissCookieBanner(page);

  const emailInput = page.locator("#login-email");
  const passwordInput = page.locator("#login-password");
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  // Wait until React has hydrated the controlled inputs
  await emailInput.click();
  await emailInput.fill(email);
  await expect(emailInput).toHaveValue(email, { timeout: 5000 });
  await passwordInput.fill(password);
  await expect(passwordInput).toHaveValue(password, { timeout: 5000 });

  const [res] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"
    ),
    page.getByRole("button", { name: /Iniciar sesion/i }).click()
  ]);
  expect(res.status(), `login ${email} → ${res.status()}`).toBe(200);
  await page.waitForURL(/dashboard|noc/, { timeout: 30000 });
  return res;
}
