import { test, expect } from "@playwright/test";
import { VISUAL_VIEWPORT, gotoStable, installVisualTestInit } from "./helpers/visual-stable";
import {
  ensureVisualDashboardUser,
  loginAndSettleDashboard,
} from "./helpers/visualDashboard";

const screenshotOptions = {
  fullPage: false,
  animations: "disabled" as const,
  maxDiffPixels: 0,
  timeout: 20_000,
};

test.describe("visual regression baseline (21.1)", () => {
  test.use({
    viewport: VISUAL_VIEWPORT,
    deviceScaleFactor: 1,
  });

  test.beforeEach(async ({ page }) => {
    await installVisualTestInit(page);
  });

  test("home /", async ({ page }) => {
    await gotoStable(page, "/");
    await expect(page).toHaveScreenshot("home.png", {
      ...screenshotOptions,
      mask: [page.locator(".argos-topbar-mascot-slot")],
    });
  });

  test("metodo /metodo", async ({ page }) => {
    await gotoStable(page, "/metodo");
    await expect(page).toHaveScreenshot("metodo.png", screenshotOptions);
  });

  test("servicios /servicios", async ({ page }) => {
    await gotoStable(page, "/servicios");
    await expect(page).toHaveScreenshot("servicios.png", {
      ...screenshotOptions,
      mask: [page.locator(".argos-topbar-mascot-slot")],
    });
  });

  test("contacto /contacto", async ({ page }) => {
    await gotoStable(page, "/contacto");
    await expect(page).toHaveScreenshot("contacto.png", screenshotOptions);
  });

  test("auth login /auth/login", async ({ page }) => {
    await gotoStable(page, "/auth/login");
    await expect(page).toHaveScreenshot("auth-login.png", screenshotOptions);
  });

  test("dashboard /dashboard (authenticated)", async ({ page, request }) => {
    await ensureVisualDashboardUser(request);
    await loginAndSettleDashboard(page);

    const content = page.locator("main.cp-main");
    await expect(content).toHaveScreenshot("dashboard.png", screenshotOptions);
  });
});
