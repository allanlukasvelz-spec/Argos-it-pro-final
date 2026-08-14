import { test, expect } from "@playwright/test";
import { COOKIE_KEY } from "./helpers/visual-stable";

test.describe("corporate chrome /contacto", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cookieKey) => {
      window.localStorage.setItem(cookieKey, "accepted");
    }, COOKIE_KEY);
  });

  test("desktop landmarks and corporate IA", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/contacto", { waitUntil: "domcontentloaded" });

    const banner = page.getByRole("banner");
    await expect(banner).toHaveCount(1);
    await expect(page.locator("header.argos-corporate-header")).toHaveCount(1);

    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.locator("footer.argos-corporate-footer")).toBeVisible();

    const primaryNav = page.locator(".argos-corporate-nav");
    await expect(primaryNav.getByRole("link", { name: /Inicio|Home/i })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: /Servicios|Services/i })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: /Método|Method/i })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: /Sobre ARGOS-IT|About ARGOS-IT/i })).toBeVisible();
    await expect(primaryNav.getByRole("link", { name: /Contacto|Contact/i })).toBeVisible();

    await expect(banner.locator('a[href="/auth/login"]')).toBeVisible();
    await expect(banner.getByRole("link", { name: /Solicitar consulta|Request consultation/i })).toBeVisible();

    await expect(banner.locator(".argos-topbar-mascot-slot")).toHaveCount(0);
    await expect(banner.locator('a[href="/#planes"]')).toHaveCount(0);
    await expect(page.locator("header.argos-topbar, header:has(.argos-topbar-mascot-slot)")).toHaveCount(0);
  });

  test("mobile menu open, close, and Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contacto", { waitUntil: "domcontentloaded" });

    const toggle = page.locator(".argos-corporate-menu-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const dialog = page.getByRole("dialog", { name: /Menú|Menu/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Inicio|Home/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();

    await toggle.click();
    await expect(page.getByRole("dialog", { name: /Menú|Menu/i })).toBeVisible();
    await page.locator(".argos-corporate-menu-backdrop").click({ position: { x: 4, y: 200 } });
    await expect(page.getByRole("dialog", { name: /Menú|Menu/i })).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
