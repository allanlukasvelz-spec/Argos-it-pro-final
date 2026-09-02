import { test, expect } from "@playwright/test";
import { COOKIE_KEY } from "./helpers/visual-stable";

test.describe("static diagnostic promo banner (21.6B.8B)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cookieKey) => {
      window.localStorage.setItem(cookieKey, "accepted");
    }, COOKIE_KEY);
  });

  test("Quiet Authority home: surgical header banner, no legacy topbar promo", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".argos-topbar-mascot-slot")).toHaveCount(0);
    await expect(page.locator('[data-banner-static="true"]')).toHaveCount(0);
    await expect(page.locator(".argos-corporate-header--surgical")).toBeVisible();
    await expect(page.locator(".argos-header-banner")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("banner slot legacy absent on corporate /contacto", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/contacto", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".argos-topbar-mascot-slot")).toHaveCount(0);
    await expect(page.locator('[data-banner-static="true"]')).toHaveCount(0);
    await expect(page.locator(".argos-header-banner")).toBeVisible();
  });

  test("corporate marketing routes use surgical header banner", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    for (const path of ["/", "/servicios", "/metodo", "/sobre-argos-it", "/contacto"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      await expect(page.locator(".argos-corporate-header--surgical")).toBeVisible();
      await expect(page.locator(".argos-header-banner")).toBeVisible();
      await expect(page.locator(".argos-topbar-mascot-slot")).toHaveCount(0);
    }
  });

  test("banner absent on legal routes at md+", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    for (const path of [
      "/privacidad",
      "/cookies",
      "/aviso-legal",
      "/legal/privacidad",
      "/legal/cookies",
      "/legal/aviso-legal"
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      await expect(page.locator(".argos-topbar-mascot-slot")).toHaveCount(0);
      await expect(page.locator('[data-banner-static="true"]')).toHaveCount(0);
      await expect(page.locator(".argos-corporate-header--surgical")).toHaveCount(0);
    }
  });

  test("legacy header and navigation remain on legal routes", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/privacidad", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("banner").getByLabel("ARGOS-IT home")).toBeVisible();
    await expect(page.getByRole("button", { name: /menú|menu/i })).toBeVisible();
  });

  test("ClientAssistants dock still mounts on home", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".mascot-root")).toHaveCount(1);
  });
});
