#!/usr/bin/env node
/** Reads la-bobila/catalog/catalog.json and writes print/carta-a3.html.
 *  Product text is not authored in the HTML. */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validate } from "../catalog/validate.mjs";
import {
  BrandHeader,
  CategoryHeader,
  CreateYourPizzaModule,
  FooterInfo,
  LegalInfo,
  MenuRow,
  QRBlock,
  SectionDivider,
  esc,
  sectionBadge,
} from "./components.mjs";
import { tomato } from "./illustrations.mjs";
import { devQrSvg } from "./qr-svg.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(root, "catalog/catalog.json");
const htmlPath = resolve(root, "print/carta-a3.html");

export function loadCatalog() {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

export { validate };

function byCategory(catalog, categoria) {
  return catalog.productos
    .filter((product) => product.categoria === categoria)
    .sort((a, b) => a.orden - b.orden);
}

function sectionById(catalog, id) {
  return catalog.secciones.find((section) => section.id === id);
}

function uiFrom(catalog) {
  return {
    ...catalog.interfaz,
    moneda_confirmada: catalog.moneda?.estado === "CONFIRMADO" ? catalog.moneda.simbolo : null,
  };
}

function column(catalog, section, ui) {
  const items = byCategory(catalog, section.id).map((product) => MenuRow(product, ui)).join("");
  const note = section.nota ? `<p class="lb-note">${esc(section.nota)}</p>` : "";
  return `<section class="lb-col" data-zone="${section.id}">
    ${CategoryHeader(section, ui, { badge: sectionBadge(section, ui) })}
    ${note}
    <div class="lb-rows">${items}</div>
  </section>`;
}

export function renderHtml(catalog, options = {}) {
  validate(catalog);
  const architecture = options.architecture === "a" || options.architecture === "b" ? options.architecture : "c";
  const palette = options.palette === "a" ? "a" : "b";
  const copy = options.copy === "a" || options.copy === "b" ? options.copy : "c";
  const illustration = options.illustration === "tomato" ? "tomato" : "clean";
  const caption = options.caption
    ?? "PROTOTIP / NO IMPRIMIR · Candidata B, pendent";
  const ui = uiFrom(catalog);
  const pizzes = sectionById(catalog, "pizzes");
  const crea = sectionById(catalog, "crea");
  const smash = sectionById(catalog, "smash");
  const pizzaItems = byCategory(catalog, "pizzes");
  const smashItems = byCategory(catalog, "smash");
  const pizzaNote = pizzes.nota ? `<p class="lb-note">${esc(pizzes.nota)}</p>` : "";
  const smashNote = smash.nota ? `<p class="lb-note">${esc(smash.nota)}</p>` : "";

  const body = [
    `<p class="lb-stamp" data-component="DevStamp">${esc(caption)}</p>`,
    BrandHeader(catalog.marca, copy),
    LegalInfo(catalog.aviso_lamina),
    SectionDivider(),
    `<section class="zone-pizza" data-zone="pizzes">
      ${CategoryHeader(pizzes, ui, { icon: illustration === "tomato" ? tomato : "", badge: sectionBadge(pizzes, ui) })}
      ${pizzaNote}
      <div class="pizza-names">
        ${pizzaItems.map((product) => MenuRow(product, ui)).join("")}
      </div>
    </section>`,
    CreateYourPizzaModule(crea, catalog.grupos_crea, byCategory(catalog, "crea"), ui, architecture),
    `<section class="zone-smash" data-zone="smash">
      ${CategoryHeader(smash, ui, { badge: sectionBadge(smash, ui) })}
      ${smashNote}
      <div class="lb-rows lb-rows--2">
        ${smashItems.map((product) => MenuRow(product, ui)).join("")}
      </div>
    </section>`,
    `<div class="zone-mid" data-zone="mid">${column(catalog, sectionById(catalog, "complements"), ui)}${column(catalog, sectionById(catalog, "amanides"), ui)}</div>`,
    `<div class="zone-late" data-zone="late">${column(catalog, sectionById(catalog, "postres"), ui)}${column(catalog, sectionById(catalog, "begudes"), ui)}</div>`,
    QRBlock(catalog.qr, devQrSvg(catalog.qr.desarrollo.destino)),
    FooterInfo(catalog, ui),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="utf-8">
  <title>${catalog.marca.nombre} — Carta (prova d'estructura)</title>
  <link rel="stylesheet" href="../tokens/tokens.css">
  <link rel="stylesheet" href="./carta.css">
</head>
<body>
  <!-- Generado por print/render.mjs desde catalog/catalog.json. No editar el texto de producto aquí. -->
  <article class="sheet palette-${palette}" data-palette="${palette}" data-architecture="${architecture}" data-copy="${copy}" data-illustration="${illustration}" data-revision="${catalog.revision}" data-version="${catalog.version}">
    <div class="sheet__frame" aria-hidden="true"></div>
    <div class="sheet__inner">
      ${body}
    </div>
  </article>
</body>
</html>
`;
}

export function writeHtml(catalog = loadCatalog(), options = {}) {
  const html = renderHtml(catalog, options);
  const target = options.htmlPath ?? htmlPath;
  writeFileSync(target, html);
  return target;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const catalog = loadCatalog();
  const path = writeHtml(catalog);
  const missing = catalog.productos.filter((product) => product.estado === "SOURCE_MISSING").length;
  console.log(`html ${path}`);
  console.log(`slots ${catalog.productos.length} source_missing ${missing}`);
}
