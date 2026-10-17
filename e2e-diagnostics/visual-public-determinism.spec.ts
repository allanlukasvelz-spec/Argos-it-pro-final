import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  VISUAL_VIEWPORT,
  gotoStable,
  installVisualTestInit,
  prepareVisualCapture,
} from "../e2e/helpers/visual-stable";

const CAPTURES = 10;

type PublicPage = { slug: "home" | "metodo"; path: string; maskMascot?: boolean };

const PAGES: PublicPage[] = [
  { slug: "home", path: "/", maskMascot: true },
  { slug: "metodo", path: "/metodo" },
];

test.describe("public visual determinism probe", () => {
  test.skip(!process.env.VISUAL_DETERMINISM, "set VISUAL_DETERMINISM=1 to run");

  test.use({
    viewport: VISUAL_VIEWPORT,
    deviceScaleFactor: 1,
  });

  test.beforeEach(async ({ page }) => {
    await installVisualTestInit(page);
  });

  for (const entry of PAGES) {
    test(`${entry.slug} — ${CAPTURES}x byte-identical`, async ({ page }) => {
      test.setTimeout(120_000);
      const dir = path.join("artifacts", "visual-determinism", entry.slug);
      fs.mkdirSync(dir, { recursive: true });

      const shots: Buffer[] = [];
      for (let i = 0; i < CAPTURES; i += 1) {
        await page.goto(entry.path, { waitUntil: "domcontentloaded" });
        await prepareVisualCapture(page);
        const shot = await page.screenshot({
          fullPage: false,
          animations: "disabled",
          ...(entry.maskMascot
            ? { mask: [page.locator(".argos-topbar-mascot-slot")] }
            : {}),
        });
        shots.push(shot);
        fs.writeFileSync(path.join(dir, `capture-${String(i).padStart(2, "0")}.png`), shot);
      }

      const diffs: string[] = [];
      for (let i = 1; i < shots.length; i += 1) {
        if (!shots[i].equals(shots[0])) {
          diffs.push(`capture-00 vs capture-${String(i).padStart(2, "0")}`);
        }
      }
      fs.writeFileSync(
        path.join(dir, "pair-report.txt"),
        diffs.length ? diffs.join("\n") : `all ${CAPTURES} captures byte-identical`
      );
      expect(diffs, diffs.join("\n")).toEqual([]);
    });
  }
});
