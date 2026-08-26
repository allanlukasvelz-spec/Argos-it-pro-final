import type { Page } from "@playwright/test";
import { isStagingE2e } from "./e2eEnv";

/** Staging Next home may never emit window `load` (hanging client fetch). */
export async function gotoE2e(
  page: Page,
  path: string,
  options: Parameters<Page["goto"]>[1] = {}
) {
  const waitUntil =
    (options && options.waitUntil) || (isStagingE2e ? "domcontentloaded" : "load");
  return page.goto(path, { ...options, waitUntil });
}
