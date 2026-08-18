import { test, expect } from "@playwright/test";
import { COOKIE_KEY } from "./helpers/visual-stable";

test.describe("static diagnostic promo banner (21.6B.8B)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cookieKey) => {
      window.localStorage.setItem(cookieKey, "accepted");
    }, COOKIE_KEY);
  });

  test("legacy home md+: static banner, no walk, CTA opens diagnostic", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const slot = page.locator(".argos-topbar-mascot-slot");
    await expect(slot).toBeVisible();
    const staticRoot = slot.locator('[data-banner-static="true"]');
    await expect(staticRoot).toBeVisible();
    await expect(staticRoot).toHaveAttribute("data-banner-mascot", "dumbo");

    const imgs = slot.locator("img");
    for (const el of await imgs.all()) {
      const src = (await el.getAttribute("src")) || "";
      expect(src).not.toMatch(/caminando|corriendo/i);
    }
    await expect(slot.locator(`img[src*="dumbo_sentado_atento"]`)).toHaveCount(1);

    const cta = slot.getByRole("button", { name: /Iniciar diagnóstico ARGOS/i });
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await cta.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("banner absent on corporate /contacto", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/contacto", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".argos-topbar-mascot-slot")).toHaveCount(0);
    await expect(page.locator('[data-banner-static="true"]')).toHaveCount(0);
  });

  test("banner slot hidden at 390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const slot = page.locator(".argos-topbar-mascot-slot");
    await expect(slot).toBeHidden();
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
    }
  });

  test("legacy header and navigation remain on legal routes", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/privacidad", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByLabel("ARGOS-IT home")).toBeVisible();
    await expect(page.getByRole("button", { name: /menú|menu/i })).toBeVisible();
  });

  test("marketing legacy routes retain the static diagnostic promo", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    for (const path of ["/", "/servicios", "/metodo", "/sobre-argos-it"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      const slot = page.locator(".argos-topbar-mascot-slot");
      await expect(slot).toBeVisible();
      await expect(slot.locator('[data-banner-static="true"]')).toBeVisible();
    }
  });

  test("ClientAssistants dock still mounts on home", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".mascot-root")).toHaveCount(1);
  });
});
