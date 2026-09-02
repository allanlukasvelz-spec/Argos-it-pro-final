import { test, expect } from "@playwright/test";
import { COOKIE_KEY } from "./helpers/visual-stable";

test.describe("corporate Quiet Authority chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cookieKey) => {
      window.localStorage.setItem(cookieKey, "accepted");
    }, COOKIE_KEY);
  });

  test("home desktop: surgical header, no horizontal nav, diagnosis card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("header.argos-corporate-header--surgical")).toHaveCount(1);
    await expect(page.locator(".argos-corporate-nav")).toHaveCount(0);
    await expect(page.locator(".argos-header-banner")).toBeVisible();
    await expect(page.locator(".argos-corporate-header__langs")).toBeVisible();
    await expect(page.locator(".argos-corporate-menu-toggle")).toBeVisible();
    await expect(page.locator(".argos-side-nav")).toHaveCount(0);
    await expect(page.locator(".argos-perimeter")).toHaveCount(0);
    await expect(page.locator(".argos-diag-card")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("desktop menu: blocks + Método ARGOS + Portal page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/contacto", { waitUntil: "domcontentloaded" });

    const toggle = page.locator(".argos-corporate-menu-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const dialog = page.locator(".argos-corporate-drawer");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".argos-drawer-block")).toHaveCount(6);

    await dialog.getByRole("button", { name: /Método ARGOS|ARGOS Method|Mètode ARGOS/i }).click();
    await expect(dialog.locator(".argos-drawer-method-card")).toBeVisible();
    await expect(
      dialog.getByRole("link", {
        name: /Descubrir el Método ARGOS|Discover the ARGOS Method|Descobrir el Mètode ARGOS/i
      })
    ).toBeVisible();

    await dialog.getByRole("button", { name: /Portal/i }).click();
    await expect(dialog.getByRole("link", { name: /Ver portal|View portal|Veure portal/i })).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: /Acceso clientes|Client access|Accés clients/i })
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("diagnosis CTA opens existing survey modal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".argos-diag-card");

    const cta = page
      .locator(".argos-diag-card")
      .getByRole("button", { name: /Iniciar diagnóstico ARGOS|Start ARGOS diagnostic/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("hero primary CTA opens existing survey modal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#home-hero-title");

    const heroCta = page
      .locator(".argos-corp-section--hero .argos-corp-cta-row")
      .getByRole("button", { name: /Iniciar diagnóstico ARGOS|Start ARGOS diagnostic/i });
    await expect(heroCta).toBeVisible();
    await heroCta.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Sí, está controlado|Yes, it is under control/i).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("hero secondary CTA navigates to method", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const secondary = page
      .locator(".argos-corp-section--hero .argos-corp-cta-row")
      .getByRole("link", { name: /Conocer cómo trabajamos|Discover how we work/i });
    await expect(secondary).toBeVisible();
    await secondary.click();
    await expect(page).toHaveURL(/\/metodo$/);
  });

  test("mobile menu open, close, and Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contacto", { waitUntil: "domcontentloaded" });

    const toggle = page.locator(".argos-corporate-menu-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    const dialog = page.locator(".argos-corporate-drawer");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Servicios|Services|Serveis/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Contacto|Contact|Contacte/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });

  test("portal page exists with corporate chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/portal", { waitUntil: "domcontentloaded" });
    await expect(page.locator("header.argos-corporate-header--surgical")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Acceso clientes|Client access|Accés clients/i })).toBeVisible();
  });

  test("Anterior/Siguiente follow real browser history", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Navegación SPA vía menú (historial real del usuario)
    await page.locator(".argos-corporate-menu-toggle").click();
    await page.locator(".argos-corporate-drawer").getByRole("link", { name: /Inicio|Home|Inici/i }).click();
    await expect(page).toHaveURL("/");

    await page.locator(".argos-corporate-menu-toggle").click();
    const drawer = page.locator(".argos-corporate-drawer");
    await drawer.getByRole("button", { name: /Servicios|Services|Serveis/i }).click();
    await drawer.getByRole("link", { name: /Ver servicios|View services|Veure serveis/i }).click();
    await expect(page).toHaveURL(/\/servicios/);

    await page.locator(".argos-corporate-menu-toggle").click();
    await page.locator(".argos-corporate-drawer").getByRole("button", { name: /Método ARGOS|ARGOS Method|Mètode ARGOS/i }).click();
    await page
      .locator(".argos-corporate-drawer")
      .getByRole("link", { name: /Descubrir el Método ARGOS|Discover the ARGOS Method|Descobrir el Mètode ARGOS/i })
      .click();
    await expect(page).toHaveURL(/\/metodo$/);

    await page.locator(".argos-corporate-menu-toggle").click();
    await page.locator(".argos-corporate-drawer").getByRole("button", { name: /Contacto|Contact|Contacte/i }).click();
    await page
      .locator(".argos-corporate-drawer")
      .getByRole("link", { name: /Solicitar consulta|Request technical|Sol·licitar consulta/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contacto/);

    const back = page.locator(".argos-history-nav__btn").filter({ hasText: /Anterior|Back/i });
    await expect(back).toBeEnabled();
    await back.click();
    await expect(page).toHaveURL(/\/metodo/);

    await back.click();
    await expect(page).toHaveURL(/\/servicios/);

    const forward = page.locator(".argos-history-nav__btn").filter({ hasText: /Siguiente|Forward|Següent/i });
    await expect(forward).toBeEnabled();
    await forward.click();
    await expect(page).toHaveURL(/\/metodo/);
    await forward.click();
    await expect(page).toHaveURL(/\/contacto/);
  });
});
