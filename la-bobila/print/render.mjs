#!/usr/bin/env node
/** Reads la-bobila/catalog/catalog.json and writes print/carta-a3.html.
 *  Product text is not authored in the HTML. */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  BrandHeader,
  CategoryHeader,
  CreateYourPizzaModule,
  FooterInfo,
  MenuItem,
  MenuItemFeatured,
  SectionDivider,
} from "./components.mjs";
import { oliveBranch, pizzaContour, tomato } from "./illustrations.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(root, "catalog/catalog.json");
const htmlPath = resolve(root, "print/carta-a3.html");

const ESTADOS = new Set(["CONFIRMADO", "POR_CONFIRMAR", "HISTORICO", "PROPUESTA_ARGOS", "DESCARTADO"]);
const PREFIX = {
  pizzes: "LB-PIZ",
  smash: "LB-BUR",
  complements: "LB-COM",
  amanides: "LB-AMA",
  postres: "LB-POS",
  begudes: "LB-BEG",
  crea: "LB-EXT",
};
const REQUIRED = [
  "id", "categoria", "nombre", "nombre_corto", "descripcion", "ingredientes",
  "precio", "precio_historico", "alergenos", "tipo", "subcategoria", "disponible",
  "destacado", "orden", "foto", "fuente", "estado", "observaciones", "ultima_revision",
];
const FACTUAL = ["nombre", "nombre_corto", "descripcion", "ingredientes", "precio", "alergenos", "foto"];

export function loadCatalog() {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

export function validate(catalog) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(catalog.productos) || catalog.productos.length === 0) {
    errors.push("El catálogo no tiene productos.");
  }
  const sectionIds = new Set((catalog.secciones ?? []).map((section) => section.id));
  const groupIds = new Set((catalog.grupos_crea ?? []).map((group) => group.id));

  for (const product of catalog.productos ?? []) {
    for (const key of REQUIRED) {
      if (!Object.prototype.hasOwnProperty.call(product, key)) {
        errors.push(`${product.id ?? "?"} carece del campo ${key}.`);
      }
    }
    if (!ESTADOS.has(product.estado)) {
      errors.push(`${product.id}: estado inválido.`);
    }
    if (ids.has(product.id)) errors.push(`ID duplicado ${product.id}.`);
    ids.add(product.id);
    const prefix = PREFIX[product.categoria];
    if (!prefix) errors.push(`${product.id}: categoría sin prefijo ${product.categoria}.`);
    else if (!String(product.id).startsWith(`${prefix}-`)) {
      errors.push(`${product.id}: el prefijo no corresponde a ${product.categoria}.`);
    }
    if (!sectionIds.has(product.categoria)) {
      errors.push(`${product.id}: la categoría no está en secciones.`);
    }
    if (product.estado === "POR_CONFIRMAR") {
      for (const key of FACTUAL) {
        if (product[key] != null) {
          errors.push(`${product.id}: ${key} tiene valor y el estado es POR_CONFIRMAR.`);
        }
      }
      if (product.precio_historico != null) {
        errors.push(`${product.id}: precio_historico solo puede existir en HISTORICO.`);
      }
      if (product.destacado !== false) {
        errors.push(`${product.id}: destacado debe ser false mientras no haya producto confirmado.`);
      }
      if (product.disponible != null) {
        errors.push(`${product.id}: disponible debe ser null si el producto no está confirmado.`);
      }
      const expected = product.categoria === "postres" || product.categoria === "begudes" ? "esquema" : "slot";
      if (product.tipo !== expected) {
        errors.push(`${product.id}: tipo ${product.tipo} no corresponde a un hueco ${expected}.`);
      }
    }
    if (product.estado === "CONFIRMADO" && product.tipo !== "producto") {
      errors.push(`${product.id}: un producto confirmado usa tipo producto.`);
    }
    if (product.categoria === "crea" && !groupIds.has(product.subcategoria)) {
      errors.push(`${product.id}: subcategoría de crea desconocida.`);
    }
    if (!product.observaciones) errors.push(`${product.id}: observaciones vacías.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(product.ultima_revision ?? "")) {
      errors.push(`${product.id}: ultima_revision no es una fecha.`);
    }
  }

  if (catalog.qr?.estado !== "CONFIRMADO" && catalog.qr?.destino != null) {
    errors.push("QR: hay destino sin estado CONFIRMADO.");
  }
  if (catalog.contacto?.estado !== "CONFIRMADO") {
    for (const key of ["adreca", "horari", "telefon"]) {
      if (catalog.contacto?.[key] != null) errors.push(`Contacto: ${key} sin confirmación.`);
    }
  }
  if (catalog.alergenos?.estado !== "CONFIRMADO" && catalog.alergenos?.items != null) {
    errors.push("Alérgenos: hay lista sin estado CONFIRMADO.");
  }
  if (catalog.marca?.nombre !== "La Bòbila") {
    errors.push("La marca del catálogo debe ser La Bòbila.");
  }
  if (errors.length) {
    throw new Error(`Catálogo rechazado:\n- ${errors.join("\n- ")}`);
  }
}

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
  const pending = section.peso === "pendiente" || section.estado_etiqueta !== "CONFIRMADO";
  const items = byCategory(catalog, section.id).map((product) => MenuItem(product, ui)).join("");
  return `<section class="lb-col" data-zone="${section.id}">
    ${CategoryHeader(section, ui, { pending })}
    ${items}
  </section>`;
}

export function renderHtml(catalog) {
  validate(catalog);
  const ui = uiFrom(catalog);
  const pizzes = sectionById(catalog, "pizzes");
  const crea = sectionById(catalog, "crea");
  const smash = sectionById(catalog, "smash");
  const pizzaItems = byCategory(catalog, "pizzes");
  const featured = pizzaItems[0];
  const stack = pizzaItems.slice(1, 3);
  const rest = pizzaItems.slice(3);
  const smashItems = byCategory(catalog, "smash");

  const body = [
    BrandHeader(catalog.marca, oliveBranch),
    SectionDivider(),
    `<section class="zone-pizza" data-zone="pizzes">
      ${CategoryHeader(pizzes, ui, { icon: tomato })}
      <div class="pizza-hero">
        ${featured ? MenuItemFeatured(featured, ui, { contour: pizzaContour }) : ""}
        <div class="lb-stack">
          ${stack.map((product) => MenuItem(product, ui)).join("")}
        </div>
      </div>
      <div class="pizza-rest">
        ${rest.map((product) => MenuItem(product, ui)).join("")}
      </div>
    </section>`,
    CreateYourPizzaModule(crea, catalog.grupos_crea, byCategory(catalog, "crea"), ui),
    `<section class="zone-smash" data-zone="smash">
      ${CategoryHeader(smash, ui)}
      <div class="lb-grid-3">
        ${smashItems.map((product) => MenuItem(product, ui)).join("")}
      </div>
    </section>`,
    `<div class="zone-mid" data-zone="mid">${column(catalog, sectionById(catalog, "complements"), ui)}${column(catalog, sectionById(catalog, "amanides"), ui)}</div>`,
    `<div class="zone-late" data-zone="late">${column(catalog, sectionById(catalog, "postres"), ui)}${column(catalog, sectionById(catalog, "begudes"), ui)}</div>`,
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
  <article class="sheet" data-revision="${catalog.revision}" data-version="${catalog.version}">
    <div class="sheet__frame" aria-hidden="true"></div>
    <div class="sheet__inner">
      ${body}
    </div>
  </article>
</body>
</html>
`;
}

export function writeHtml(catalog = loadCatalog()) {
  const html = renderHtml(catalog);
  writeFileSync(htmlPath, html);
  return htmlPath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const catalog = loadCatalog();
  const path = writeHtml(catalog);
  const pending = catalog.productos.filter((product) => product.estado === "POR_CONFIRMAR").length;
  console.log(`html ${path}`);
  console.log(`slots ${catalog.productos.length} por_confirmar ${pending}`);
}
