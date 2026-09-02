import { test, expect } from "@playwright/test";
import { gotoE2e } from "./helpers/e2eNav";

test.describe("public and auth shell", () => {
  test("home loads", async ({ page }) => {
    await gotoE2e(page, "/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("mascot Chico opens chat dialog", async ({ page }) => {
    await gotoE2e(page, "/");
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
    await gotoE2e(page, "/");
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
    await gotoE2e(page, "/");
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
    await gotoE2e(page, "/");
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
    await gotoE2e(page, "/");
    const root = page.locator(".mascot-root");
    await page
      .getByRole("button", { name: /Interactuar con Chico|Interact with Chico/i })
      .click({ force: true });
    await expect(root).toHaveAttribute("data-active-mascot", "chico");
    await page.keyboard.press("Escape");
    await expect(root).toHaveAttribute("data-active-mascot", "none");
    await page
      .getByRole("button", { name: /Interactuar con Dumbo|Interact with Dumbo/i })
      .click({ force: true });
    await expect(root).toHaveAttribute("data-active-mascot", "dumbo");
    await expect(page.locator('.mascot--dumbo [data-mascot-active="true"]')).toBeVisible();
    await expect
      .poll(async () => (await page.locator(".mascot__img--dumbo").getAttribute("src")) || "")
      .toMatch(/dumbo_sentado_atento\.png/);
    await page.keyboard.press("Escape");
    await expect(root).toHaveAttribute("data-active-mascot", "none");
  });

  test("keyboard Enter opens Chico assistant", async ({ page }) => {
    await gotoE2e(page, "/");
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
    await gotoE2e(page, "/");
    const dumbo = page.getByRole("button", {
      name: /Interactuar con Dumbo|Interact with Dumbo/i
    });
    await dumbo.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".mascot-root")).toHaveAttribute("data-active-mascot", "dumbo");
    await page.keyboard.press("Escape");
  });

  test("390: corporate home hides dock mascots (safe-zone rule)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem("argos_cookie_preferences_v1", "accepted");
    });
    await gotoE2e(page, "/");
    // Quiet Authority: mascot dock hidden ≤1023px so it cannot cover content.
    await expect(page.locator("header.argos-corporate-header--surgical")).toHaveCount(1);
    await expect(page.locator(".mascot-root")).toBeHidden();
  });

  test("assistants hidden on auth and legal routes", async ({ page }) => {
    for (const path of ["/auth/login", "/explainer", "/cookies", "/legal/privacidad"]) {
      await gotoE2e(page, path);
      await expect(page.locator(".mascot-root")).toHaveCount(0);
    }
  });

  test("cookie banner stacks above dock when visible", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("argos_cookie_preferences_v1");
    });
    await gotoE2e(page, "/");
    const cookie = page.locator("aside[aria-live='polite']");
    await expect(cookie).toBeVisible();
    const z = await page.evaluate(() => {
      const cookieEl = document.querySelector("aside[aria-live='polite']");
      const dock = document.querySelector(".mascot-root");
      return {
        cookie: cookieEl ? getComputedStyle(cookieEl).zIndex : null,
        dock: dock ? getComputedStyle(dock).zIndex : null
      };
    });
    expect(Number(z.cookie)).toBeGreaterThan(Number(z.dock));
  });

  test("explainer page section and CTA links", async ({ page }) => {
    await gotoE2e(page, "/explainer");
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
    await gotoE2e(page, "/explainer?explainerRecord=1");
    const section = page.locator("#dumbo-chico-explainer");
    await expect(section).toBeVisible();
    await expect(section.getByRole("button", { name: /Siguiente|Next/i })).toBeVisible();
  });

  test("servicios slug page loads", async ({ page }) => {
    await gotoE2e(page, "/servicios/consultoria-it");
    await expect(page).toHaveURL(/\/servicios\/consultoria-it/);
  });

  test("login page shows title", async ({ page }) => {
    await gotoE2e(page, "/auth/login");
    await expect(page.getByRole("heading", { name: /Iniciar sesión/i })).toBeVisible();
  });

  test("dashboard redirects unauthenticated user to login", async ({ page }) => {
    await gotoE2e(page, "/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
