import { test, expect } from "@playwright/test";

test.describe("public and auth shell", () => {
  test("home loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("mascot Chico opens chat dialog", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /Interactuar con Chico|Interact with Chico/i })
      .click({ force: true });
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Chat con Chico|Chat with Chico/i })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("mascot Dumbo opens chat dialog and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /Interactuar con Dumbo|Interact with Dumbo/i })
      .click({ force: true });
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Chat con Dumbo|Chat with Dumbo/i })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("home explainer section and CTA links", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#dumbo-chico-explainer");
    await expect(section).toBeVisible();
    const next = section.getByRole("button", { name: /Siguiente|Next/i });
    for (let i = 0; i < 5; i += 1) {
      await next.click();
    }
    await expect(section.locator('a[href="/contacto"]')).toBeVisible();
    await expect(section.locator('a[href="/servicios"]')).toBeVisible();
  });

  test("explainer recording page loads explainer section", async ({ page }) => {
    await page.goto("/explainer?explainerRecord=1");
    const section = page.locator("#dumbo-chico-explainer");
    await expect(section).toBeVisible();
    await expect(section.getByRole("button", { name: /Siguiente|Next/i })).toBeVisible();
  });

  test("servicios slug page loads", async ({ page }) => {
    await page.goto("/servicios/consultoria-it");
    await expect(page).toHaveURL(/\/servicios\/consultoria-it/);
  });

  test("login page shows title", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /Iniciar sesión/i })).toBeVisible();
  });

  test("dashboard redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
