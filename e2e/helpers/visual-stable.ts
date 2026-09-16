import type { Page } from "@playwright/test";

export const COOKIE_KEY = "argos_cookie_preferences_v1";

export const VISUAL_VIEWPORT = { width: 1280, height: 720 };

const FREEZE_STYLE = `
  html, body {
    overflow: hidden !important;
  }
  *, *::before, *::after {
    animation: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition: none !important;
    transition-duration: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
  .argos-bg-diagonal,
  .argos-bg-glow,
  .argos-bg-orbit,
  .argos-bg-circuit,
  .argos-bg-diagonal--one,
  .argos-bg-diagonal--two,
  .argos-bg-glow--one,
  .argos-bg-glow--two,
  .argos-method-galaxy-nebula,
  .argos-method-galaxy-base {
    animation: none !important;
  }
  .argos-topbar-mascot-slot,
  .mascot,
  .argos-bg-meteors,
  .argos-bg-stars,
  .argos-bg-orbit,
  .argos-method-galaxy-shooting-stars,
  .argos-method-galaxy-comets,
  div[class*="go"][class*="2075"],
  .react-hot-toast,
  .react-hot-toast > * {
    visibility: hidden !important;
  }
`;

export async function installVisualTestInit(page: Page): Promise<void> {
  await page.addInitScript(
    ({ cookieKey, freezeStyle }) => {
      window.localStorage.setItem(cookieKey, "accepted");
      const inject = () => {
        if (document.getElementById("argos-pw-visual-freeze")) return;
        const style = document.createElement("style");
        style.id = "argos-pw-visual-freeze";
        style.textContent = freezeStyle;
        (document.head || document.documentElement).appendChild(style);
      };
      inject();
      document.addEventListener("DOMContentLoaded", inject, { once: true });
    },
    { cookieKey: COOKIE_KEY, freezeStyle: FREEZE_STYLE }
  );
}

export async function waitForVisualReadiness(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const waitWithTimeout = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, waitWithTimeout(5000)]);
    }
    const pendingImages = Array.from(document.images).filter((img) => !img.complete);
    await Promise.all(
      pendingImages.map((img) =>
        Promise.race([
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
          waitWithTimeout(5000),
        ])
      )
    );
  });
}

export async function stabilizePage(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: FREEZE_STYLE });
  await page.evaluate(() => {
    document.getAnimations().forEach((animation) => {
      try {
        animation.pause();
      } catch {
        /* ignore */
      }
    });
    document.querySelectorAll("div[style*='z-index: 9999'], div[style*='z-index:9999']").forEach((node) => {
      node.remove();
    });
  });
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);
  await waitForVisualReadiness(page);
}

export async function gotoStable(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await stabilizePage(page);
}
