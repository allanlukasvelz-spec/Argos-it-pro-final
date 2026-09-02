/**
 * ARGOS_VISUAL_ADOPTION_01 — geometric gates + captures.
 * Content/routes/method contract unchanged; visual language only.
 */
import { test, expect, type Locator, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { COOKIE_KEY } from "./helpers/visual-stable";

const ARTIFACT_DIR = path.join("artifacts", "visual-adoption-01");

type Box = { x: number; y: number; width: number; height: number };

function intersectionArea(a: Box, b: Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  return w * h;
}

async function boxOf(locator: Locator): Promise<Box | null> {
  const box = await locator.boundingBox();
  if (!box) return null;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      innerWidth: window.innerWidth
    };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow: scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`
  ).toBeLessThanOrEqual(overflow.innerWidth + 1);
}

async function assertNotClipped(locator: Locator, label: string) {
  await expect(locator).toBeVisible();
  await locator.evaluate((el) => el.scrollIntoView({ block: "nearest", inline: "nearest" }));
  const box = await locator.boundingBox();
  expect(box, `${label} missing box`).not.toBeNull();
  expect(box!.width, `${label} width`).toBeGreaterThan(48);
  expect(box!.height, `${label} height`).toBeGreaterThan(24);
  const metrics = await locator.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowX: style.overflowX,
      overflowY: style.overflowY
    };
  });
  if (metrics.overflowX === "hidden" || metrics.overflowY === "hidden") {
    expect(
      metrics.scrollWidth,
      `${label} horizontally clipped`
    ).toBeLessThanOrEqual(metrics.clientWidth + 2);
  }
}

async function screenshotSection(page: Page, locator: Locator, file: string) {
  await expect(locator).toBeVisible();
  await locator.evaluate((el) => el.scrollIntoView({ block: "start" }));
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport || box.width < 2 || box.height < 2) {
    await page.screenshot({ path: file, fullPage: false });
    return;
  }
  const x = Math.max(0, Math.min(box.x, viewport.width - 1));
  const y = Math.max(0, Math.min(box.y, viewport.height - 1));
  const width = Math.max(1, Math.min(box.width, viewport.width - x));
  const height = Math.max(1, Math.min(box.height, viewport.height - y));
  await page.screenshot({
    path: file,
    clip: { x, y, width, height }
  });
}

async function prepareHome(page: Page, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#home-hero-title", { state: "visible", timeout: 20000 });
  await page.waitForSelector(".argos-corp-phase-ink", { state: "attached", timeout: 20000 });
}

test.describe("ARGOS_VISUAL_ADOPTION_01", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((cookieKey) => {
      window.localStorage.setItem(cookieKey, "accepted");
      const inject = () => {
        if (document.getElementById("argos-va01-stable")) return;
        const style = document.createElement("style");
        style.id = "argos-va01-stable";
        style.textContent = `
          .argos-page-enter { animation: none !important; opacity: 1 !important; transform: none !important; }
          .argos-header-banner__inner { animation: none !important; transition: none !important; }
        `;
        (document.head || document.documentElement).appendChild(style);
      };
      inject();
      document.addEventListener("DOMContentLoaded", inject, { once: true });
    }, COOKIE_KEY);
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  });

  for (const width of [1440, 1024, 768, 390] as const) {
    test(`responsive home geometry @${width}`, async ({ page }) => {
      await prepareHome(page, width, width <= 390 ? 844 : 900);
      await assertNoHorizontalOverflow(page);

      const h1 = page.locator("#home-hero-title");
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/Sistemas que no fallen cuando no deben|Systems that must not fail when they must not/i);
      await assertNotClipped(h1, `H1@${width}`);

      const phases = page.locator(".argos-corp-phase-rail--ink > li");
      await expect(phases).toHaveCount(5);

      const phaseBoxes = await Promise.all(
        (await phases.all()).map(async (li) => boxOf(li))
      );
      for (const box of phaseBoxes) {
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThan(width <= 390 ? 200 : 80);
        expect(box!.height).toBeGreaterThan(48);
      }

      // At tablet/mobile the rail stacks; at desktop (≥1100) letters stay readable
      if (width >= 1100) {
        const letters = page.locator(".argos-corp-phase-ink .argos-corp-phase-rail__letter");
        await expect(letters).toHaveCount(5);
        for (const letter of await letters.all()) {
          const b = await boxOf(letter);
          expect(b!.width).toBeGreaterThanOrEqual(24);
          expect(b!.height).toBeGreaterThanOrEqual(24);
        }
      }

      const services = page.locator(".argos-corp-service-grid > li");
      await expect(services).toHaveCount(6);

      const diag = page.locator(".argos-diag-card");
      const diagCta = diag.getByRole("button");
      await expect(diag).toBeVisible();
      await expect(diagCta).toBeVisible();

      const h1Box = await boxOf(h1);
      const diagBox = await boxOf(diag);
      if (width >= 1024 && h1Box && diagBox) {
        expect(intersectionArea(h1Box, diagBox), "hero text ∩ diagnosis card").toBe(0);
      }

      // Floating mascots (if present) must not cover hero text / CTA / diag card
      const mascots = page.locator(".mascot-root .mascot, .mascot__sprite-button");
      const mascotCount = await mascots.count();
      if (width <= 1023) {
        expect(mascotCount === 0 || !(await mascots.first().isVisible())).toBeTruthy();
      } else if (mascotCount > 0) {
        const phaseInk = page.locator(".argos-corp-phase-ink");
        const targets = [h1, diagCta, diag, phaseInk];
        for (const m of await mascots.all()) {
          if (!(await m.isVisible())) continue;
          const mb = await boxOf(m);
          if (!mb || mb.width < 4) continue;
          for (const target of targets) {
            if ((await target.count()) === 0) continue;
            const tb = await boxOf(target.first());
            if (!tb) continue;
            expect(intersectionArea(mb, tb), "mascot ∩ content").toBe(0);
          }
        }
      }

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `home-${width}.png`),
        fullPage: true
      });
    });
  }

  test("hero / method / services / drawer / footer captures", async ({ page }) => {
    test.setTimeout(120_000);

    for (const width of [1440, 1024, 768, 390] as const) {
      await prepareHome(page, width, width <= 390 ? 844 : 900);
      await screenshotSection(
        page,
        page.locator(".argos-corp-section--hero").first(),
        path.join(ARTIFACT_DIR, `hero-${width}.png`)
      );
    }

    for (const width of [1440, 768, 390] as const) {
      await prepareHome(page, width, width <= 390 ? 844 : 900);
      await screenshotSection(
        page,
        page.locator(".argos-corp-section--phases").first(),
        path.join(ARTIFACT_DIR, `method-home-${width}.png`)
      );
    }

    for (const width of [1440, 390] as const) {
      await prepareHome(page, width, width <= 390 ? 844 : 900);
      await screenshotSection(
        page,
        page.locator("#home-services-title").locator("xpath=ancestor::section[1]"),
        path.join(ARTIFACT_DIR, `services-home-${width}.png`)
      );
    }

    for (const width of [1440, 768, 390] as const) {
      await prepareHome(page, width, width <= 390 ? 844 : 900);
      await page.locator(".argos-corporate-menu-toggle").click();
      const drawer = page.locator(".argos-corporate-drawer");
      await expect(drawer).toBeVisible();
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `drawer-${width}.png`)
      });
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
    }

    for (const width of [1440, 390] as const) {
      await prepareHome(page, width, width <= 390 ? 844 : 900);
      await screenshotSection(
        page,
        page.locator("footer.argos-corporate-footer").first(),
        path.join(ARTIFACT_DIR, `footer-${width}.png`)
      );
    }
  });

  test("cookie banner does not cover home CTA @1440 and @390", async ({ page }) => {
    test.setTimeout(90_000);
    // Override beforeEach: force cookie banner visible
    await page.addInitScript(() => {
      window.localStorage.removeItem("argos_cookie_preferences_v1");
    });

    for (const width of [1440, 390] as const) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#home-hero-title", { state: "visible", timeout: 20000 });

      const cookie = page.locator('aside[aria-live="polite"]');
      await expect(cookie).toBeVisible({ timeout: 8000 });

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `cookie-home-${width}.png`),
        fullPage: false
      });

      const cb = await boxOf(cookie);
      const cta = page.locator(".argos-corp-section--hero .argos-corporate-cta").first();
      const ctab = await boxOf(cta);
      if (cb && ctab) {
        expect(intersectionArea(cb, ctab), "cookie ∩ hero CTA").toBe(0);
      }
      const diagCta = page.locator(".argos-diag-card button").first();
      if ((await diagCta.count()) > 0 && width >= 1024) {
        const db = await boxOf(diagCta);
        if (cb && db) {
          expect(intersectionArea(cb, db), "cookie ∩ diag CTA").toBe(0);
        }
      }

      await assertNoHorizontalOverflow(page);
    }
  });

  test("A.R.G.O.S. phase count and letter identity preserved", async ({ page }) => {
    await prepareHome(page, 1440);
    const letters = await page
      .locator(".argos-corp-phase-ink .argos-corp-phase-rail__letter")
      .allTextContents();
    expect(letters.map((s) => s.trim())).toEqual(["A", "R", "G", "O", "S"]);
    const hrefs = await page.locator(".argos-corp-phase-rail--ink a").evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href"))
    );
    expect(hrefs).toEqual([
      "/metodo/analizar",
      "/metodo/reforzar",
      "/metodo/guiar",
      "/metodo/optimizar",
      "/metodo/supervisar"
    ]);
  });
});
