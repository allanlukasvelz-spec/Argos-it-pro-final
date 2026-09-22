#!/usr/bin/env node
/** Writes editorial V2 clean and V2 illustrated. Does not regenerate V1 or the palette studies. */

import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, writeHtml } from "./render.mjs";
import { assertProductionBuild } from "./production-guard.mjs";
import { captureFiles, captureMetrics, withSheet } from "./chrome-sheet.mjs";

const printDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(printDir, "renders");
const caption = "PROTOTIP / NO IMPRIMIR · Candidata B, pendent";

const HEADER_EXPRESSION = `(() => {
  const pxToMm = (px) => px / (96 / 25.4);
  const mm = (px) => Number(pxToMm(px).toFixed(2));
  const sheet = document.querySelector(".sheet");
  const sheetRect = sheet.getBoundingClientRect();
  const logo = document.querySelector(".lb-brand__logo img");
  const brand = document.querySelector(".lb-brand");
  const editorial = document.querySelector(".lb-editorial");
  const pizza = document.querySelector('[data-zone="pizzes"]');
  const logoRect = logo.getBoundingClientRect();
  const pizzaRect = pizza.getBoundingClientRect();
  const edRect = editorial ? editorial.getBoundingClientRect() : null;
  const names = [...document.querySelectorAll(".lb-row .lb-name")].map((node) => ({
    text: node.textContent.trim(),
    wraps: node.getClientRects().length > 1,
    w: mm(node.getBoundingClientRect().width),
  }));
  const prices = [...document.querySelectorAll(".lb-row .lb-price")].slice(0, 4).map((node) => {
    const cs = getComputedStyle(node);
    return { fontMm: mm(parseFloat(cs.fontSize)), weight: cs.fontWeight, color: cs.color };
  });
  return {
    copy: sheet.dataset.copy,
    illustration: sheet.dataset.illustration,
    logoHmm: mm(logoRect.height),
    logoWmm: mm(logoRect.width),
    logoTopMm: mm(logoRect.top - sheetRect.top),
    gapLogoToCategoryMm: mm(pizzaRect.top - logoRect.bottom),
    editorialInsideHeader: Boolean(editorial && brand.contains(editorial)),
    editorialGapMm: edRect ? mm(edRect.top - logoRect.bottom) : null,
    tomatoCount: document.querySelectorAll(".lb-illus--tomato").length,
    wrappedNames: names.filter((name) => name.wraps).map((name) => name.text),
    priceSample: prices[0] || null,
  };
})()`;

async function open(htmlPath, fn) {
  return withSheet(pathToFileURL(htmlPath).href, fn);
}

async function metricsOf(htmlPath) {
  return open(htmlPath, async (cdp) => {
    const metrics = await captureMetrics(cdp);
    const header = await cdp.send("Runtime.evaluate", {
      expression: HEADER_EXPRESSION,
      returnByValue: true,
    });
    return { ...metrics, header: header.result.value };
  });
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const catalog = loadCatalog();
  assertProductionBuild(catalog);
  const study = {};

  for (const copy of ["a", "b", "c"]) {
    const htmlPath = resolve(printDir, `_copy-${copy}.html`);
    writeHtml(catalog, {
      architecture: "c",
      palette: "b",
      copy,
      illustration: "clean",
      caption,
      htmlPath,
    });
    study[copy] = await metricsOf(htmlPath);
    unlinkSync(htmlPath);
  }

  const cleanHtml = writeHtml(catalog, {
    architecture: "c",
    palette: "b",
    copy: "c",
    illustration: "clean",
    caption,
  });
  const clean = await open(cleanHtml, async (cdp) => {
    const metrics = await captureMetrics(cdp);
    await captureFiles(cdp, {
      pdfPath: resolve(outDir, "carta-a3-editorial-v2-clean.pdf"),
      pngPath: resolve(outDir, "carta-a3-editorial-v2-clean.png"),
    });
    return metrics;
  });

  const illustratedPath = resolve(printDir, "_illustrated.html");
  writeHtml(catalog, {
    architecture: "c",
    palette: "b",
    copy: "c",
    illustration: "tomato",
    caption,
    htmlPath: illustratedPath,
  });
  const illustrated = await open(illustratedPath, async (cdp) => {
    const metrics = await captureMetrics(cdp);
    await captureFiles(cdp, {
      pdfPath: resolve(outDir, "carta-a3-editorial-v2-illustrated.pdf"),
      pngPath: resolve(outDir, "carta-a3-editorial-v2-illustrated.png"),
    });
    return metrics;
  });
  unlinkSync(illustratedPath);

  const report = {
    copy: Object.fromEntries(["a", "b", "c"].map((key) => [key, {
      overflow: study[key].overflow,
      stackPastMm: study[key].stackPastMm,
      header: study[key].header,
      creaH: study[key].crea.h,
      creaFont: study[key].crea.fontMm,
      pizza: study[key].pizza,
      smash: study[key].smash,
    }])),
    clean: { overflow: clean.overflow, stackPastMm: clean.stackPastMm, crea: clean.crea, pizza: clean.pizza, smash: clean.smash, zones: clean.zones },
    illustrated: { overflow: illustrated.overflow, stackPastMm: illustrated.stackPastMm, pizza: illustrated.pizza },
  };
  writeFileSync("/tmp/lb-v2-metrics.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
