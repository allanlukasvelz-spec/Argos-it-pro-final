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

  test("dock mount/hover do not select walk assets", async ({ page }) => {
    await page.goto("/");
    const imgs = page.locator(".mascot-root .mascot__img");
    await expect(imgs).toHaveCount(2);
    await page.waitForTimeout(3500);
    for (const el of await imgs.all()) {
      const src = (await el.getAttribute("src")) || "";
      expect(src).not.toMatch(/caminando|corriendo|jugando/i);
    }
    await page
      .getByRole("button", { name: /Interactuar con Chico|Interact with Chico/i })
      .hover({ force: true });
    await page.waitForTimeout(400);
    for (const el of await imgs.all()) {
      const src = (await el.getAttribute("src")) || "";
      expect(src).not.toMatch(/caminando|corriendo|jugando/i);
    }
  });

  test("one-active: Chico open uses STAND asset and deactivates Dumbo", async ({ page }) => {
    await page.goto("/");
    const root = page.locator(".mascot-root");
    await expect(root).toHaveAttribute("data-active-mascot", "none");
    await page
      .getByRole("button", { name: /Interactuar con Chico|Interact with Chico/i })
      .click({ force: true });
    await expect(root).toHaveAttribute("data-active-mascot", "chico");
    await expect(page.locator('.mascot--chico [data-mascot-active="true"]')).toBeVisible();
    await expect(page.locator('.mascot--dumbo [data-mascot-active="false"]')).toBeVisible();
    const chicoSrc =
      (await page.locator(".mascot__img--chico").getAttribute("src")) || "";
    expect(chicoSrc).toMatch(/chico_esperando\.png/);
    expect(chicoSrc).not.toMatch(/caminando/i);
    await page.keyboard.press("Escape");
    await expect(root).toHaveAttribute("data-active-mascot", "none");
  });

  test("one-active: Dumbo open uses SIT; switch deactivates prior", async ({ page }) => {
    await page.goto("/");
    const root = page.locator(".mascot-root");
    await page
      .getByRole("button", { name: /Interactuar con Chico|Interact with Chico/i })
      .click({ force: true });
    await expect(root).toHaveAttribute("data-active-mascot", "chico");
    await page
      .getByRole("button", { name: /Interactuar con Dumbo|Interact with Dumbo/i })
      .click({ force: true });
    await expect(root).toHaveAttribute("data-active-mascot", "dumbo");
    await expect(page.locator('.mascot--dumbo [data-mascot-active="true"]')).toBeVisible();
    await expect(page.locator('.mascot--chico [data-mascot-active="false"]')).toBeVisible();
    const dumboSrc =
      (await page.locator(".mascot__img--dumbo").getAttribute("src")) || "";
    expect(dumboSrc).toMatch(/dumbo_sentado_atento\.png/);
    await page.keyboard.press("Escape");
    await expect(root).toHaveAttribute("data-active-mascot", "none");
  });

  test("keyboard Enter opens Chico assistant", async ({ page }) => {
    await page.goto("/");
    const chico = page.getByRole("button", {
      name: /Interactuar con Chico|Interact with Chico/i
    });
    await chico.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".mascot-root")).toHaveAttribute("data-active-mascot", "chico");
    await page.keyboard.press("Escape");
  });

  test("keyboard Space opens Dumbo assistant", async ({ page }) => {
    await page.goto("/");
    const dumbo = page.getByRole("button", {
      name: /Interactuar con Dumbo|Interact with Dumbo/i
    });
    await dumbo.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".mascot-root")).toHaveAttribute("data-active-mascot", "dumbo");
    await page.keyboard.press("Escape");
  });

  test("explainer page section and CTA links", async ({ page }) => {
    await page.goto("/explainer");
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
