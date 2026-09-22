#!/usr/bin/env node
/** Writes mobile/carta.html from catalog.json. Not a copy of the A3. */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validate } from "../catalog/validate.mjs";
import {
  MobileCategoryNav,
  MobileCategorySection,
  MobileCreateYourPizza,
  MobileFooter,
  MobileMenuHeader,
  analyticsSeam,
} from "./components.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(root, "catalog/catalog.json");
const htmlPath = resolve(root, "mobile/carta.html");

export function loadCatalog() {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

function byCategory(catalog, categoria) {
  return catalog.productos
    .filter((product) => product.categoria === categoria)
    .sort((a, b) => a.orden - b.orden);
}

export function renderMobileHtml(catalog) {
  validate(catalog);
  const ui = {
    ...catalog.interfaz,
    moneda_confirmada: catalog.moneda?.estado === "CONFIRMADO" ? catalog.moneda.simbolo : null,
  };
  const sections = catalog.secciones.map((section) => {
    if (section.id === "crea") return MobileCreateYourPizza(section, catalog.grupos_crea, byCategory(catalog, "crea"), ui);
    return MobileCategorySection(section, byCategory(catalog, section.id), ui, catalog.alergenos);
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${catalog.marca.nombre} — Carta</title>
  <link rel="stylesheet" href="/assets/tokens.css">
  <link rel="stylesheet" href="/assets/mobile.css">
</head>
<body>
  <!-- Generado por mobile/render.mjs desde catalog/catalog.json. No editar el texto de producto aquí. -->
  ${MobileMenuHeader(catalog)}
  ${MobileCategoryNav(catalog.secciones)}
  <main class="m-main">
    ${sections}
  </main>
  ${MobileFooter(catalog, ui)}
  ${analyticsSeam(catalog)}
</body>
</html>
`;
}

export function writeMobileHtml(catalog = loadCatalog()) {
  const html = renderMobileHtml(catalog);
  writeFileSync(htmlPath, html);
  return htmlPath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const path = writeMobileHtml();
  console.log(`html ${path}`);
}
