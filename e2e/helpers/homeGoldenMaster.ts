import { expect, type Page } from "@playwright/test";

/**
 * Home D+ V3 approved section indexes, in DOM order.
 * Hero has no index. "01 / Proyecto web" is not a Home section index.
 * "08 / Continuidad" is not rendered as a section index.
 */
export const HOME_DPLUS_V3_SECTION_INDEXES = [
  "03 / Confianza",
  "04 / Realidad del cliente",
  "05 / Cuatro pilares",
  "06 / Servicios",
  "07 / Método",
  "07a / Cuatro movimientos",
  "10 / Filosofía",
  "11 / Preguntas frecuentes",
] as const;

export async function expectHomeGoldenMasterIndexes(page: Page) {
  const indexes = page.locator(".argos-corp-section-index");
  await expect(indexes).toHaveCount(HOME_DPLUS_V3_SECTION_INDEXES.length);
  const texts = (await indexes.allTextContents()).map((text) => text.replace(/\s+/g, " ").trim());
  expect(texts).toEqual([...HOME_DPLUS_V3_SECTION_INDEXES]);
}
