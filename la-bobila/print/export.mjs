#!/usr/bin/env node
/** Writes the editorial prototype and the two palette studies. Does not publish. */

import { mkdirSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCatalog, writeHtml } from "./render.mjs";
import { assertProductionBuild } from "./production-guard.mjs";
import { captureFiles, captureMetrics, withSheet } from "./chrome-sheet.mjs";

const printDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(printDir, "renders");
const studyCaption = "Estudi de paleta · PROVA / NO IMPRIMIR · sense guanyadora";

async function shoot(htmlPath, files) {
  const fileUrl = pathToFileURL(htmlPath).href;
  return withSheet(fileUrl, async (cdp) => {
    const metrics = await captureMetrics(cdp);
    await captureFiles(cdp, files);
    return metrics;
  });
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const catalog = loadCatalog();
  assertProductionBuild(catalog);

  const editorialHtml = writeHtml(catalog, {
    architecture: "c",
    palette: "b",
    caption: "EDITORIAL PROTOTYPE V1 · PROVA / NO IMPRIMIR · Candidata B · sense decisió de paleta",
  });
  const editorial = await shoot(editorialHtml, {
    pdfPath: resolve(outDir, "carta-a3-editorial-v1.pdf"),
    pngPath: resolve(outDir, "carta-a3-editorial-v1.png"),
  });
  console.log("editorial", JSON.stringify({ overflow: editorial.overflow, stackPastMm: editorial.stackPastMm, crea: editorial.crea }));

  const paletteA = writeHtml(catalog, {
    architecture: "c",
    palette: "a",
    caption: studyCaption,
    htmlPath: resolve(printDir, "_palette-a.html"),
  });
  await shoot(paletteA, { pngPath: resolve(outDir, "palette-comparison-a.png") });
  const paletteB = writeHtml(catalog, {
    architecture: "c",
    palette: "b",
    caption: studyCaption,
    htmlPath: resolve(printDir, "_palette-b.html"),
  });
  await shoot(paletteB, { pngPath: resolve(outDir, "palette-comparison-b.png") });
  writeHtml(catalog, {
    architecture: "c",
    palette: "b",
    caption: "EDITORIAL PROTOTYPE V1 · PROVA / NO IMPRIMIR · Candidata B · sense decisió de paleta",
  });
  unlinkSync(resolve(printDir, "_palette-a.html"));
  unlinkSync(resolve(printDir, "_palette-b.html"));
  console.log("png", resolve(outDir, "carta-a3-editorial-v1.png"));
  console.log("pdf", resolve(outDir, "carta-a3-editorial-v1.pdf"));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
