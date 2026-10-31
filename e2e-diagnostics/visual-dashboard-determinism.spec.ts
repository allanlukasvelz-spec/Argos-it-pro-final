import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import { VISUAL_VIEWPORT, installVisualTestInit } from "../e2e/helpers/visual-stable";
import {
  captureDashboardMain,
  ensureVisualDashboardUser,
  loginAndSettleDashboard,
  reloadAndSettleDashboard,
} from "../e2e/helpers/visualDashboard";

const ARTIFACT_DIR = path.join("artifacts", "visual-determinism", "dashboard");
const CAPTURES = 10;

test.describe("dashboard visual determinism probe", () => {
  test.skip(!process.env.VISUAL_DETERMINISM, "set VISUAL_DETERMINISM=1 to run");

  test.use({
    viewport: VISUAL_VIEWPORT,
    deviceScaleFactor: 1,
  });

  test.beforeEach(async ({ page }) => {
    await installVisualTestInit(page);
  });

  test("10 consecutive captures — byte-identical", async ({ page, request }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

    await ensureVisualDashboardUser(request);
    await loginAndSettleDashboard(page);

    const shots: Buffer[] = [];
    for (let i = 0; i < CAPTURES; i += 1) {
      if (i > 0) {
        await reloadAndSettleDashboard(page);
      }
      shots.push(await captureDashboardMain(page));
      fs.writeFileSync(path.join(ARTIFACT_DIR, `capture-${String(i).padStart(2, "0")}.png`), shots[i]);
    }

    const pairReport: string[] = [];
    for (let i = 1; i < shots.length; i += 1) {
      if (!shots[i].equals(shots[0])) {
        pairReport.push(`capture-00 vs capture-${String(i).padStart(2, "0")}: buffers differ`);
      }
    }

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "pair-report.txt"),
      pairReport.length ? pairReport.join("\n") : `all ${CAPTURES} captures byte-identical`
    );

    expect(pairReport, pairReport.join("\n")).toEqual([]);
  });
});
