#!/usr/bin/env node
/** Writes editorial V3. Does not regenerate V1, V2, or the palette studies. */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, writeHtml } from "./render.mjs";
import { assertProductionBuild } from "./production-guard.mjs";
import { captureFiles, captureMetrics, withSheet } from "./chrome-sheet.mjs";

const printDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(printDir, "renders");
const caption = "PROTOTIP EDITORIAL V3 · PROVA / NO IMPRIMIR";

const HEADER_EXPRESSION = `(() => {
  const pxToMm = (px) => px / (96 / 25.4);
  const mm = (px) => Number(pxToMm(px).toFixed(2));
  const sheet = document.querySelector(".sheet");
  const sheetRect = sheet.getBoundingClientRect();
  const axis = sheetRect.left + sheetRect.width / 2;
  const copy = document.querySelector(".lb-editorial__copy");
  const study = document.querySelector(".lb-study");
  const hero = document.querySelector(".zone-hero");
  const pizzaMark = document.querySelector(".lb-watermark--pizza");
  const centerOf = (node) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return mm(rect.left + rect.width / 2 - axis);
  };
  const sample = document.querySelector(".zone-pizza .lb-row .lb-name");
  const price = document.querySelector(".lb-row .lb-price");
  const creaName = document.querySelector(".lb-crea__name");
  const sizeOf = (node) => node ? mm(parseFloat(getComputedStyle(node).fontSize)) : null;
  const wraps = [...document.querySelectorAll(".lb-row .lb-name")].filter((node) => node.getClientRects().length > 1).map((node) => node.textContent.trim());
  const marks = [...document.querySelectorAll(".lb-watermark")].map((node) => node.className);
  return {
    copyOffsetMm: centerOf(copy),
    studyOffsetMm: centerOf(study),
    heroHmm: hero ? mm(hero.getBoundingClientRect().height) : null,
    pizzaMarkHmm: pizzaMark ? mm(pizzaMark.getBoundingClientRect().height) : null,
    pizzaNameMm: sizeOf(sample),
    priceMm: sizeOf(price),
    creaNameMm: sizeOf(creaName),
    wrappedNames: wraps,
    marks,
    laurels: document.querySelectorAll(".lb-laurel").length,
    logoImages: document.querySelectorAll("img").length,
    qrHmm: (() => {
      const qr = document.querySelector(".lb-qrmod");
      return qr ? mm(qr.getBoundingClientRect().height) : null;
    })(),
  };
})()`;

async function main() {
  mkdirSync(outDir, { recursive: true });
  const catalog = loadCatalog();
  assertProductionBuild(catalog);
  const htmlPath = writeHtml(catalog, {
    architecture: "c",
    palette: "b",
    copy: "c",
    illustration: "clean",
    caption,
  });
  const report = await withSheet(pathToFileURL(htmlPath).href, async (cdp) => {
    const metrics = await captureMetrics(cdp);
    const header = await cdp.send("Runtime.evaluate", {
      expression: HEADER_EXPRESSION,
      returnByValue: true,
    });
    await captureFiles(cdp, {
      pdfPath: resolve(outDir, "carta-a3-editorial-v3.pdf"),
      pngPath: resolve(outDir, "carta-a3-editorial-v3.png"),
    });
    return { ...metrics, header: header.result.value };
  });
  const summary = {
    overflow: report.overflow,
    stackPastMm: report.stackPastMm,
    crea: report.crea,
    pizza: report.pizza,
    smash: report.smash,
    zones: report.zones,
    header: report.header,
  };
  writeFileSync("/tmp/lb-v3-metrics.json", JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
