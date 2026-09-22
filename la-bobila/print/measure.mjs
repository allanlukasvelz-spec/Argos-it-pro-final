#!/usr/bin/env node
/** Measures architectures A, B and C on the same type, grid and palette. */

import { unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, writeHtml } from "./render.mjs";
import { captureMetrics, withSheet } from "./chrome-sheet.mjs";

const printDir = dirname(fileURLToPath(import.meta.url));

async function main() {
  const catalog = loadCatalog();
  const caption = "Estudi d'arquitectura · PROVA / NO IMPRIMIR";
  const results = [];
  const written = [];
  try {
    for (const architecture of ["a", "b", "c"]) {
      const htmlPath = resolve(printDir, `_study-${architecture}.html`);
      written.push(htmlPath);
      writeHtml(catalog, { architecture, palette: "b", caption, htmlPath });
      const metrics = await withSheet(pathToFileURL(htmlPath).href, (cdp) => captureMetrics(cdp));
      results.push(metrics);
      console.log(architecture, JSON.stringify({
        overflow: metrics.overflow,
        stackPastMm: metrics.stackPastMm,
        sheet: metrics.sheet,
        crea: metrics.crea,
        pizza: metrics.pizza,
        smash: metrics.smash,
      }));
    }
    writeFileSync("/tmp/lb-architecture-metrics.json", JSON.stringify(results, null, 2));
  } finally {
    for (const path of written) unlinkSync(path);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
