#!/usr/bin/env node
/** Genera los dos másteres editoriales desde el catálogo normalizado.
 *  Prototipo. Medida provisional. No publica y no imprime. */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  artisanPizza,
  burger,
  fries,
  laurelBl,
  laurelBr,
  laurelTl,
  laurelTr,
  saladBowl,
} from "../la-bobila/print/illustrations.mjs";
import { preparePrint, withSheet } from "../la-bobila/print/chrome-sheet.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const catalogPath = resolve(root, "01_SOURCE_OF_TRUTH/catalogo_normalizado.json");
const logoPath = resolve(root, "../la-bobila/processed/logo/la-bobila-logo-presentation.png");
const logoMaster = resolve(root, "../la-bobila/source/logo/la-bobila-logo-reference.png");
const LOGO_MASTER_SHA = "6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc";
const renderDir = resolve(root, "04_RENDERS");
const qaDir = resolve(root, "05_QA");

const STAMP = "PROTOTIPO / REVISIÓN / PENDIENTE";
const DUDAS = [
  "salsa la bòbila",
  "flor di latte",
  "all i oli",
  "pa de brioche",
  "pa de briox",
  "butifarra",
  "cogombree",
  "Santlucar",
  "Classica",
  "parmesa",
];

const FORBIDDEN = [
  "risotto",
  "free gluten",
  "massa mare",
  "48 h",
  "48h",
  "25 años",
  "25 anys",
  "print ready",
  "aprobado",
  "producció",
  "producción",
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatPrice(value) {
  const [whole, frac] = Number(value).toFixed(2).split(".");
  return `${whole},${frac}`;
}

function dudaTokens(text) {
  if (!text) return [];
  const hits = DUDAS.filter((token) => text.includes(token));
  return hits.filter((token) => !hits.some((other) => other !== token && other.includes(token)));
}

function pendMark(tokens) {
  const label = tokens?.length ? tokens.join("|") : "";
  const attr = label ? ` data-duda="${esc(label)}"` : "";
  return `<i class="pend"${attr}>PENDIENTE</i>`;
}

function loadCatalog() {
  return JSON.parse(readFileSync(catalogPath, "utf8"));
}

function sectionById(catalog, id) {
  return catalog.secciones.find((section) => section.id === id);
}

function groupById(catalog, id) {
  return catalog.grupos_crea.find((group) => group.id === id);
}

function rowsIn(catalog, categoria) {
  return catalog.filas
    .filter((row) => row.categoria === categoria)
    .slice()
    .sort((a, b) => a.orden - b.orden);
}

function productArticle(row) {
  const confirmed = row.estado === "CONFIRMADO" && row.nombre;
  const label = confirmed ? row.nombre : (row.lectura_no_confirmada || "");
  const ings = Array.isArray(row.ingredientes) ? row.ingredientes : [];
  const price = confirmed && row.precio && row.precio.value != null ? formatPrice(row.precio.value) : "";
  const nameMark = confirmed ? pendMark(dudaTokens(label)) : "";
  const nameMarks = confirmed && dudaTokens(label).length ? nameMark : "";
  const pending = confirmed ? "" : pendMark();
  const ingHtml = ings.map((ing) => {
    const mark = dudaTokens(ing).length ? pendMark(dudaTokens(ing)) : "";
    return `<span class="ing" data-ing="${esc(ing)}">${esc(ing)}</span>${mark}`;
  }).join('<span class="sep">, </span>');
  return `<article class="row" data-fact="product" data-id="${esc(row.id)}" data-estado="${esc(row.estado)}" data-nombre="${esc(confirmed ? row.nombre : "")}" data-lectura="${esc(row.lectura_no_confirmada || "")}" data-precio="${esc(price)}" data-grupo="${esc(row.subcategoria || "")}">
    <h3 class="name"><span class="name-text">${esc(label)}</span>${nameMarks}${pending}</h3>
    ${price ? `<p class="price">${esc(price)}</p>` : ""}
    ${ings.length ? `<p class="ings">${ingHtml}</p>` : ""}
  </article>`;
}

function zoneTitle(id, title, estado, extraClass) {
  const pending = estado !== "CONFIRMADO";
  return `<h2 class="zone-title" data-fact="section" data-id="${esc(id)}" data-estado="${esc(estado)}" data-titulo="${esc(title)}">${esc(title)}${pending ? pendMark() : ""}</h2>`;
}

function rowsHtml(rows) {
  return rows.map(productArticle).join("\n");
}

function splitColumns(rows) {
  const mid = Math.ceil(rows.length / 2);
  return [rows.slice(0, mid), rows.slice(mid)];
}

function mark(className, svg) {
  return `<div class="mark ${className}" aria-hidden="true">${svg}</div>`;
}

function creaBlock(catalog, rows) {
  const section = sectionById(catalog, "crea");
  const order = ["base", "carnes", "vegetales", "quesos"];
  const groups = order.map((id) => {
    const group = groupById(catalog, id);
    const price = formatPrice(group.extra.value);
    const items = rows.filter((row) => row.subcategoria === (id === "quesos" ? "quesos" : id === "carnes" ? "carnes" : id === "vegetales" ? "vegetales" : ""));
    const body = id === "base"
      ? ""
      : items.map(productArticle).join("\n");
    return `<section class="crea-group" data-fact="group" data-id="${esc(group.id)}" data-estado="${esc(group.estado)}" data-etiqueta="${esc(group.etiqueta)}" data-precio="${esc(price)}">
      <header class="g-head">
        <h3 class="g-name">${esc(group.etiqueta)}</h3>
        <p class="g-price">${esc(price)}</p>
      </header>
      <div class="slots">${body}</div>
    </section>`;
  }).join("\n");
  return `<section class="zone zone--crea" data-zone="crea">
    ${zoneTitle("crea", section.titulo, "CONFIRMADO")}
    <div class="crea-grid">${groups}</div>
  </section>`;
}

function emptyZone(id, title, estado, laurel) {
  return `<section class="zone zone--empty" data-zone="${esc(id)}" data-fact="empty" data-id="${esc(id)}" data-estado="${esc(estado)}" data-titulo="${esc(title)}">
    ${zoneTitle(id, title, estado)}
    ${laurel ? mark("mark--laurel", laurel) : ""}
  </section>`;
}

function stampBlock(medida) {
  return `<div class="stamp-block">
    <p class="stamp">${STAMP}</p>
    <p class="medida">${esc(medida)}</p>
  </div>`;
}

function doc(bodyClass, cssHref, title, body) {
  return `<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${cssHref}">
</head>
<body class="${bodyClass}">
${body}
</body>
</html>
`;
}

const LOGO = "../../la-bobila/processed/logo/la-bobila-logo-presentation.png";
const MEDIDA_H = "Mesura provisional. Retall 483 × 329 mm. Arxiu amb sang 489 × 335 mm. Sang 3 mm.";
const MEDIDA_V = "Mesura provisional. Retall 329 × 483 mm. Arxiu amb sang 335 × 489 mm. Sang 3 mm.";
const MEDIDA_S = "Mesura provisional. Doble pàgina: retall 658 × 483 mm, arxiu 664 × 489 mm, sang exterior 3 mm, plec al centre.";

function renderHorizontal(catalog) {
  const pizzes = rowsIn(catalog, "pizzes");
  const [pizA, pizB] = splitColumns(pizzes);
  const smash = rowsIn(catalog, "smash");
  const complements = rowsIn(catalog, "complements");
  const amanides = rowsIn(catalog, "amanides");
  const crea = rowsIn(catalog, "crea");
  const piz = sectionById(catalog, "pizzes");
  const sma = sectionById(catalog, "smash");
  const com = sectionById(catalog, "complements");
  const ama = sectionById(catalog, "amanides");
  const postres = sectionById(catalog, "postres");
  const begudes = sectionById(catalog, "begudes");
  const body = `<article class="sheet" data-master="horizontal">
    <header class="mast">
      <img src="${LOGO}" alt="La Bòbila" width="1600" height="863">
      <div></div>
      <div>
        <p class="stamp">${STAMP}</p>
        <p class="medida">${esc(MEDIDA_H)}</p>
      </div>
    </header>
    <div class="grid">
      <div class="col col--left">
        <section class="zone zone--salad" data-zone="amanides">
          ${mark("mark--salad", saladBowl)}
          ${zoneTitle(ama.id, ama.titulo, ama.estado)}
          <div class="rows">${rowsHtml(amanides)}</div>
        </section>
        ${emptyZone("plats-del-dia", "Plats del dia", "NO_EN_CATALOGO", laurelBl)}
      </div>
      <div class="col col--center">
        <section class="zone zone--lead zone--pizzes" data-zone="pizzes">
          ${mark("mark--pizza", artisanPizza)}
          ${zoneTitle(piz.id, piz.titulo, piz.estado, "lead")}
          <div class="cols-2">
            <div>${rowsHtml(pizA)}</div>
            <div>${rowsHtml(pizB)}</div>
          </div>
        </section>
        ${creaBlock(catalog, crea)}
      </div>
      <div class="col col--right">
        <section class="zone zone--share" data-zone="complements">
          ${mark("mark--fries", fries)}
          ${zoneTitle(com.id, com.titulo, com.estado)}
          <div class="rows">${rowsHtml(complements)}</div>
        </section>
        <section class="zone zone--second" data-zone="smash">
          ${mark("mark--burger", burger)}
          ${zoneTitle(sma.id, sma.titulo, sma.estado)}
          <div class="rows">${rowsHtml(smash)}</div>
        </section>
      </div>
    </div>
    <footer class="close">
      ${emptyZone("postres", postres.lectura_no_confirmada, postres.estado, laurelTl)}
      ${emptyZone("begudes", begudes.lectura_no_confirmada, begudes.estado, laurelBr)}
    </footer>
  </article>`;
  return doc("master-h", "carta-horizontal.css", "La Bòbila — prototipo horizontal", body);
}

function renderCover() {
  const body = `<article class="sheet sheet--page cover" data-master="portada">
    ${mark("mark mark--corner mark--tl", laurelTl)}
    ${mark("mark mark--corner mark--tr", laurelTr)}
    ${mark("mark mark--corner mark--bl", laurelBl)}
    ${mark("mark mark--corner mark--br", laurelBr)}
    <img class="logo-cover" src="${LOGO}" alt="La Bòbila" width="1600" height="863">
    ${stampBlock(MEDIDA_V)}
  </article>`;
  return doc("master-cover", "carta-vertical.css", "La Bòbila — prototipo portada", body);
}

function renderInterior(catalog) {
  const pizzes = rowsIn(catalog, "pizzes");
  const [pizA, pizB] = splitColumns(pizzes);
  const smash = rowsIn(catalog, "smash");
  const complements = rowsIn(catalog, "complements");
  const [comA, comB] = splitColumns(complements);
  const amanides = rowsIn(catalog, "amanides");
  const crea = rowsIn(catalog, "crea");
  const piz = sectionById(catalog, "pizzes");
  const sma = sectionById(catalog, "smash");
  const com = sectionById(catalog, "complements");
  const ama = sectionById(catalog, "amanides");
  const postres = sectionById(catalog, "postres");
  const begudes = sectionById(catalog, "begudes");
  const body = `<article class="sheet sheet--spread" data-master="interior" data-fold-mm="332">
    <section class="page page--left" data-page="left">
      <header class="mast">
        <img class="logo-small" src="${LOGO}" alt="La Bòbila" width="1600" height="863">
        <div>
          <p class="stamp">${STAMP}</p>
          <p class="medida">${esc(MEDIDA_S)}</p>
        </div>
      </header>
      <div class="split">
        <section class="zone zone--salad" data-zone="amanides">
          ${mark("mark--salad", saladBowl)}
          ${zoneTitle(ama.id, ama.titulo, ama.estado)}
          <div class="rows">${rowsHtml(amanides)}</div>
        </section>
        ${emptyZone("plats-del-dia", "Plats del dia", "NO_EN_CATALOGO", laurelBl)}
      </div>
      <section class="zone zone--share" data-zone="complements">
        ${mark("mark--fries", fries)}
        ${zoneTitle(com.id, com.titulo, com.estado)}
        <div class="cols-2">
          <div>${rowsHtml(comA)}</div>
          <div>${rowsHtml(comB)}</div>
        </div>
      </section>
      <section class="zone zone--second" data-zone="smash">
        ${mark("mark--burger", burger)}
        ${zoneTitle(sma.id, sma.titulo, sma.estado)}
        <div class="smash-grid">${rowsHtml(smash)}</div>
      </section>
      ${emptyZone("postres", postres.lectura_no_confirmada, postres.estado, laurelTl)}
    </section>
    <section class="page page--right" data-page="right">
      <header class="mast">
        <p class="stamp">${STAMP}</p>
        <p class="medida">${esc(MEDIDA_V)}</p>
      </header>
      <section class="zone zone--lead zone--pizzes" data-zone="pizzes">
        ${mark("mark--pizza", artisanPizza)}
        ${zoneTitle(piz.id, piz.titulo, piz.estado)}
        <div class="cols-2">
          <div>${rowsHtml(pizA)}</div>
          <div>${rowsHtml(pizB)}</div>
        </div>
      </section>
      ${creaBlock(catalog, crea)}
      ${emptyZone("begudes", begudes.lectura_no_confirmada, begudes.estado, laurelBr)}
    </section>
  </article>`;
  return doc("master-spread", "carta-vertical.css", "La Bòbila — prototipo interior", body);
}

function renderBack(catalog) {
  const items = catalog.historico.map((item) => {
    const price = item.precio_historico && item.precio_historico.value != null
      ? formatPrice(item.precio_historico.value)
      : "";
    return `<article class="hist" data-fact="historico" data-id="${esc(item.id)}" data-estado="HISTORICO" data-nombre="${esc(item.nombre)}" data-precio="${esc(price)}">
      <h2 class="hist-name"><span class="name-text">${esc(item.nombre)}</span><i class="pend">HISTORICO</i></h2>
      ${price ? `<p class="hist-price">${esc(price)}</p>` : ""}
      <p class="hist-diff">${esc(item.diferencia)}</p>
    </article>`;
  }).join("\n");
  const body = `<article class="sheet sheet--page sheet--back back" data-master="contraportada">
    <img class="back-logo" src="${LOGO}" alt="La Bòbila" width="1600" height="863">
    <div class="hist-list">${items}</div>
    <section class="quality-empty" data-fact="empty" data-id="qualitat" data-estado="PENDIENTE DE CONFIRMAR">
      <i class="pend">PENDIENTE</i>
    </section>
    ${stampBlock(MEDIDA_V)}
  </article>`;
  return doc("master-back", "carta-vertical.css", "La Bòbila — prototipo contraportada", body);
}

function writeMasters(catalog) {
  const files = {
    "02_HORIZONTAL/carta-horizontal.html": renderHorizontal(catalog),
    "03_VERTICAL/portada.html": renderCover(),
    "03_VERTICAL/interior.html": renderInterior(catalog),
    "03_VERTICAL/contraportada.html": renderBack(catalog),
  };
  for (const [rel, html] of Object.entries(files)) {
    const path = resolve(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, html);
  }
  return files;
}

const EXTRACT = `(() => {
  const pxToMm = (px) => px / (96 / 25.4);
  const sheet = document.querySelector(".sheet");
  const sheetRect = sheet.getBoundingClientRect();
  const fold = sheet.dataset.foldMm ? Number(sheet.dataset.foldMm) : null;
  const products = [...document.querySelectorAll('[data-fact="product"]')].map((node) => ({
    id: node.dataset.id,
    estado: node.dataset.estado,
    nombre: node.dataset.nombre || "",
    lectura: node.dataset.lectura || "",
    precio: node.dataset.precio || "",
    grupo: node.dataset.grupo || "",
    visibleNombre: node.querySelector(".name-text")?.textContent || "",
    visiblePrecio: node.querySelector(".price")?.textContent || "",
    ings: [...node.querySelectorAll(".ing")].map((ing) => ing.dataset.ing),
    visibleIngs: [...node.querySelectorAll(".ing")].map((ing) => ing.textContent),
  }));
  const groups = [...document.querySelectorAll('[data-fact="group"]')].map((node) => ({
    id: node.dataset.id,
    etiqueta: node.dataset.etiqueta || "",
    precio: node.dataset.precio || "",
    visibleEtiqueta: node.querySelector(".g-name")?.textContent || "",
    visiblePrecio: node.querySelector(".g-price")?.textContent || "",
  }));
  const sections = [...document.querySelectorAll('[data-fact="section"]')].map((node) => ({
    id: node.dataset.id,
    estado: node.dataset.estado,
    titulo: node.dataset.titulo || "",
    visible: node.childNodes[0]?.textContent || "",
  }));
  const historico = [...document.querySelectorAll('[data-fact="historico"]')].map((node) => ({
    id: node.dataset.id,
    nombre: node.dataset.nombre || "",
    precio: node.dataset.precio || "",
    visibleNombre: node.querySelector(".name-text")?.textContent || "",
    visiblePrecio: node.querySelector(".hist-price")?.textContent || "",
    diferencia: node.querySelector(".hist-diff")?.textContent || "",
  }));
  const boxes = [...document.querySelectorAll("[data-fact], .mark, .name-text, .price, .g-price, .ing, .hist-price, img")].map((node) => {
    const rect = node.getBoundingClientRect();
    return {
      id: node.dataset.id || node.dataset.fact || node.className,
      left: Number(pxToMm(rect.left - sheetRect.left).toFixed(2)),
      right: Number(pxToMm(rect.right - sheetRect.left).toFixed(2)),
      top: Number(pxToMm(rect.top - sheetRect.top).toFixed(2)),
      bottom: Number(pxToMm(rect.bottom - sheetRect.top).toFixed(2)),
    };
  });
  return {
    text: document.body.innerText,
    html: document.documentElement.outerHTML,
    sheet: {
      w: Number(pxToMm(sheetRect.width).toFixed(2)),
      h: Number(pxToMm(sheetRect.height).toFixed(2)),
    },
    fold,
    products,
    groups,
    sections,
    historico,
    boxes,
    euros: (document.body.innerText + document.body.innerHTML).includes("€"),
    leaders: /\\.{3,}|·\\s·\\s·/.test(document.body.innerText),
  };
})()`;

function compareMenu(catalog, extracted, { includeHistorico, expectProducts }) {
  const mismatches = [];
  const push = (msg) => mismatches.push(msg);
  if (extracted.euros) push("Aparece el símbolo de euro.");
  if (extracted.leaders) push("Aparecen puntos conductores.");
  const lowered = extracted.text.toLowerCase();
  for (const word of FORBIDDEN) {
    if (lowered.includes(word)) push(`Texto no permitido: ${word}`);
  }
  if (extracted.text.includes("Des de 2005") || extracted.text.includes("Pizzeria artesana")) {
    push("Copy editorial pendiente pintado como texto.");
  }
  if (!extracted.text.includes(STAMP)) push("Falta el sello PROTOTIPO / REVISIÓN / PENDIENTE.");
  if (!extracted.text.toLowerCase().includes("provisional")) push("Falta la marca de medida provisional.");

  if (expectProducts) {
    const byId = new Map(extracted.products.map((row) => [row.id, row]));
    for (const row of catalog.filas) {
      const found = byId.get(row.id);
      if (!found) {
        push(`Falta la fila ${row.id}.`);
        continue;
      }
      if (found.estado !== row.estado) push(`${row.id} estado ${found.estado} ≠ ${row.estado}.`);
      if ((found.grupo || "") !== (row.subcategoria || "")) {
        push(`${row.id} grupo ${found.grupo} ≠ ${row.subcategoria}.`);
      }
      const confirmed = row.estado === "CONFIRMADO" && row.nombre;
      if (confirmed) {
        if (found.visibleNombre !== row.nombre) push(`${row.id} nombre visible «${found.visibleNombre}» ≠ «${row.nombre}».`);
        if (found.nombre !== row.nombre) push(`${row.id} data-nombre «${found.nombre}» ≠ «${row.nombre}».`);
        const expectPrice = formatPrice(row.precio.value);
        if (found.visiblePrecio !== expectPrice || found.precio !== expectPrice) {
          push(`${row.id} precio «${found.visiblePrecio}» ≠ «${expectPrice}».`);
        }
        const expectIngs = row.ingredientes || [];
        if (found.ings.join("\n") !== expectIngs.join("\n") || found.visibleIngs.join("\n") !== expectIngs.join("\n")) {
          push(`${row.id} ingredientes no coinciden.`);
        }
      } else {
        if (found.nombre) push(`${row.id} pinta un nombre confirmado.`);
        if (found.visibleNombre !== (row.lectura_no_confirmada || "")) {
          push(`${row.id} lectura «${found.visibleNombre}» ≠ «${row.lectura_no_confirmada}».`);
        }
        if (found.visiblePrecio || found.precio) push(`${row.id} tiene precio sin confirmar.`);
        if (found.ings.length || found.visibleIngs.length) push(`${row.id} tiene ingredientes sin confirmar.`);
        if (!extracted.text.includes("PENDIENTE")) push("Falta la marca PENDIENTE.");
      }
    }
    const crea = rowsIn(catalog, "crea");
    const cansalada = extracted.products.find((row) => row.id === "LB-EXT-016");
    if (!cansalada || cansalada.grupo !== "vegetales" || cansalada.visibleNombre !== "Cansalada") {
      push("Cansalada no está en vegetals con la lectura del catálogo.");
    }
    if (crea.filter((row) => row.subcategoria === "carnes").some((row) => row.id === "LB-EXT-016")) {
      push("Cansalada se ha movido a carn.");
    }
    for (const id of ["base", "carnes", "vegetales", "quesos"]) {
      const group = groupById(catalog, id);
      const found = extracted.groups.find((item) => item.id === id);
      if (!found) {
        push(`Falta el grupo ${id}.`);
        continue;
      }
      const price = formatPrice(group.extra.value);
      if (found.visibleEtiqueta !== group.etiqueta) push(`Grupo ${id} etiqueta «${found.visibleEtiqueta}» ≠ «${group.etiqueta}».`);
      if (found.visiblePrecio !== price) push(`Grupo ${id} precio «${found.visiblePrecio}» ≠ «${price}».`);
    }
    if (extracted.groups.some((group) => group.id === "altres")) push("El grupo Altres está pintado.");
    const emptyIds = extracted.sections.filter((section) => ["plats-del-dia", "postres", "begudes"].includes(section.id));
    for (const id of ["plats-del-dia", "postres", "begudes"]) {
      const zone = [...emptyIds, ...extracted.sections].find((section) => section.id === id);
      const productsInside = extracted.products.filter((row) => row.grupo === id);
      if (productsInside.length) push(`${id} tiene productos.`);
    }
    const postresRows = extracted.products.filter((row) => row.id.startsWith("LB-POS") || row.id.startsWith("LB-BEG"));
    if (postresRows.length) push("Hay filas de postres o begudes.");
  }

  if (includeHistorico) {
    for (const item of catalog.historico) {
      const found = extracted.historico.find((row) => row.id === item.id);
      if (!found) {
        push(`Falta el histórico ${item.id}.`);
        continue;
      }
      if (found.visibleNombre !== item.nombre) push(`${item.id} nombre «${found.visibleNombre}» ≠ «${item.nombre}».`);
      const price = item.precio_historico ? formatPrice(item.precio_historico.value) : "";
      if ((found.visiblePrecio || "") !== price) push(`${item.id} precio histórico «${found.visiblePrecio}» ≠ «${price}».`);
      if (found.diferencia !== item.diferencia) push(`${item.id} el texto histórico no coincide.`);
    }
    const currentOnly = catalog.filas.filter((row) => row.nombre && !catalog.historico.some((item) => item.nombre === row.nombre));
    for (const row of currentOnly) {
      if (extracted.historico.some((item) => item.visibleNombre === row.nombre)) {
        push(`La contraportada repite el producto vigente ${row.nombre}.`);
      }
    }
  } else if (extracted.historico.length) {
    push("Hay bloque histórico fuera de la contraportada.");
  }

  const sheetW = extracted.sheet.w;
  const sheetH = extracted.sheet.h;
  const foldHits = [];
  const overflow = [];
  for (const box of extracted.boxes) {
    if (box.right > sheetW + 0.4 || box.bottom > sheetH + 0.4 || box.left < -0.4 || box.top < -0.4) {
      overflow.push(`${box.id} sale de la página (${box.left},${box.top})–(${box.right},${box.bottom}).`);
    }
    if (extracted.fold != null && box.left < extracted.fold - 0.2 && box.right > extracted.fold + 0.2) {
      foldHits.push(`${box.id} cruza el plec (${box.left}–${box.right}).`);
    }
  }
  return { mismatches, overflow: overflow.slice(0, 12), foldHits: foldHits.slice(0, 12), sheetW, sheetH };
}

function reportMarkdown({ title, result, laid, empty }) {
  const fail = result.mismatches.length || result.overflow.length || result.foldHits.length;
  const lines = [
    `# ${title}`,
    "",
    `RESULTADO: ${fail ? "FAIL" : "PASS"}`,
    "",
    "Sello: PROTOTIPO / REVISIÓN / PENDIENTE. Medida provisional, sin confirmar por la imprenta.",
    "",
    "## Comparación con el catálogo",
    "",
  ];
  if (!result.mismatches.length) lines.push("Ningún nombre, precio o ingrediente confirmado discrepa. Las lecturas no confirmadas siguen marcadas PENDIENTE y no se han corregido.");
  else lines.push(...result.mismatches.map((item) => `- ${item}`));
  lines.push("", "## Desborde", "");
  if (!result.overflow.length) lines.push("Ningún hecho medido sale de la página.");
  else lines.push(...result.overflow.map((item) => `- ${item}`));
  lines.push("", "## Plec", "");
  if (result.foldHits.length) lines.push(...result.foldHits.map((item) => `- ${item}`));
  else lines.push(title.includes("interior") || title.includes("vertical") ? "El plec no corta nombre, precio ni dibujo, o esta cara no tiene plec." : "Esta cara no tiene plec.");
  lines.push("", `Página medida: ${result.sheetW} × ${result.sheetH} mm.`, "", "## Qué se ha puesto", "", laid, "", "## Qué queda vacío", "", empty, "");
  return { fail, markdown: lines.join("\n") };
}

async function capture(cdp, pdfPath, pngPath, paperWidthMm, paperHeightMm) {
  await preparePrint(cdp);
  const box = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const sheet = document.querySelector(".sheet").getBoundingClientRect();
      return { width: sheet.width, height: sheet.height };
    })()`,
    returnByValue: true,
  });
  const metrics = box.result.value;
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: Math.ceil(metrics.width),
    height: Math.ceil(metrics.height),
    deviceScaleFactor: 1,
    mobile: false,
  });
  const pdf = await cdp.send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: paperWidthMm / 25.4,
    paperHeight: paperHeightMm / 25.4,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    displayHeaderFooter: false,
  });
  writeFileSync(pdfPath, Buffer.from(pdf.data, "base64"));
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { x: 0, y: 0, width: metrics.width, height: metrics.height, scale: 2 },
  });
  writeFileSync(pngPath, Buffer.from(shot.data, "base64"));
  const extracted = await cdp.send("Runtime.evaluate", { expression: EXTRACT, returnByValue: true });
  return extracted.result.value;
}

async function main() {
  const masterSha = createHash("sha256").update(readFileSync(logoMaster)).digest("hex");
  if (masterSha !== LOGO_MASTER_SHA) {
    throw new Error(`El máster del logo ha cambiado: ${masterSha}`);
  }
  const catalog = loadCatalog();
  writeMasters(catalog);
  if (!process.argv.includes("--export")) return;

  mkdirSync(renderDir, { recursive: true });
  mkdirSync(qaDir, { recursive: true });
  const jobs = [
    ["02_HORIZONTAL/carta-horizontal.html", "carta-horizontal.pdf", "carta-horizontal-preview.png", 489, 335, "horizontal"],
    ["03_VERTICAL/portada.html", "portada.pdf", "portada-preview.png", 335, 489, "portada"],
    ["03_VERTICAL/interior.html", "interior.pdf", "interior-preview.png", 664, 489, "interior"],
    ["03_VERTICAL/contraportada.html", "contraportada.pdf", "contraportada-preview.png", 335, 489, "contraportada"],
  ];
  const extracted = {};
  for (const [html, pdf, png, w, h, key] of jobs) {
    const url = pathToFileURL(resolve(root, html)).href;
    extracted[key] = await withSheet(url, (cdp) => capture(cdp, resolve(renderDir, pdf), resolve(renderDir, png), w, h));
    console.log("exported", key, extracted[key].sheet);
  }

  const horizontal = compareMenu(catalog, extracted.horizontal, { includeHistorico: false, expectProducts: true });
  const interior = compareMenu(catalog, extracted.interior, { includeHistorico: false, expectProducts: true });
  const cover = compareMenu(catalog, extracted.portada, { includeHistorico: false, expectProducts: false });
  const back = compareMenu(catalog, extracted.contraportada, { includeHistorico: true, expectProducts: false });

  const laidH = "Amanides, Pizzes artesanes, Crea la teva pizza (base, carn, vegetals, formatges), Per compartir / complements y Smash burgers, con los nombres, precios e ingredientes confirmados. Las lecturas no confirmadas de Crea van marcadas PENDIENTE, Cansalada incluida en vegetals.";
  const emptyH = "Plats del dia, Postres y Begudes no tienen productos. No hay fotos. No hay grupo Altres, ni salses, ni gelats vigentes.";
  const laidV = "La portada lleva el logo oficial. El interior reparte Amanides, Per compartir y Smash en la página izquierda, y Pizzes con Crea la teva en la derecha. La contraportada lleva solo las seis notas históricas confirmadas.";
  const emptyV = "Plats del dia, Postres y Begudes siguen sin productos. La zona de calidad de la contraportada queda en PENDIENTE: no hay frase de calidad confirmada. No hay fotos.";

  const hReport = reportMarkdown({ title: "QA horizontal contra el catálogo", result: horizontal, laid: laidH, empty: emptyH });
  const vPieces = [interior, cover, back];
  const vResult = {
    mismatches: [
      ...interior.mismatches.map((item) => `Interior: ${item}`),
      ...cover.mismatches.map((item) => `Portada: ${item}`),
      ...back.mismatches.map((item) => `Contraportada: ${item}`),
    ],
    overflow: [
      ...interior.overflow.map((item) => `Interior: ${item}`),
      ...cover.overflow.map((item) => `Portada: ${item}`),
      ...back.overflow.map((item) => `Contraportada: ${item}`),
    ],
    foldHits: interior.foldHits,
    sheetW: interior.sheetW,
    sheetH: interior.sheetH,
  };
  const vReport = reportMarkdown({ title: "QA vertical contra el catálogo", result: vResult, laid: laidV, empty: emptyV });
  writeFileSync(resolve(qaDir, "qa-horizontal.md"), hReport.markdown);
  writeFileSync(resolve(qaDir, "qa-vertical.md"), vReport.markdown);
  const summary = {
    horizontal: hReport.fail ? "FAIL" : "PASS",
    vertical: vReport.fail ? "FAIL" : "PASS",
    mismatches: vResult.mismatches.length + horizontal.mismatches.length,
    overflow: horizontal.overflow.length + vResult.overflow.length,
    fold: interior.foldHits.length,
    logo: masterSha,
  };
  writeFileSync(resolve(qaDir, "qa-summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (hReport.fail || vReport.fail) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
