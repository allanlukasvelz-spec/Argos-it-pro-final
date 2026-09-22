/** Mobile /carta components. Strings come from the catalog. */

import { esc, sectionBadge } from "../print/components.mjs";

function blockedName(product, ui) {
  if (product.estado === "CONFIRMADO" && product.nombre) return esc(product.nombre);
  if ((product.estado === "SOURCE_MISSING" || product.estado === "CANDIDATE_MATCH") && product.nombre) {
    return `<span class="is-uncontrasted">${esc(product.nombre)}</span>`;
  }
  return `<span class="is-pending">${esc(ui.pendiente)}</span>`;
}

export function MobileMenuHeader(catalog) {
  const marca = catalog.marca;
  return `<header class="m-header" data-component="MobileMenuHeader">
    <p class="m-banner" role="status">${esc(catalog.interfaz.banner_mobil)}</p>
    <div class="m-logo" data-wordmark="${esc(marca.wordmark)}">
      <span class="m-logo__slot">${esc(marca.wordmark)}</span>
      <h1 class="m-logo__name">${esc(marca.nombre)}</h1>
    </div>
    <p class="m-logo__tipo">${esc(marca.tipo)}</p>
    <p class="m-logo__desde">${esc(marca.desde)}</p>
  </header>`;
}

export function MobileCategoryNav(secciones) {
  const links = secciones.map((section) => `<a href="#${esc(section.id)}">${esc(section.nav)}</a>`).join("");
  return `<nav class="m-nav" data-component="MobileCategoryNav" aria-label="Categories">${links}</nav>`;
}

export function MobilePrice(product, ui) {
  const show = product.estado === "CONFIRMADO" && product.precio != null;
  const value = show
    ? esc(typeof product.precio === "number" ? String(product.precio).replace(".", ",") : product.precio)
    : esc(ui.precio_vacio);
  return `<p class="m-price" data-component="MobilePrice"><span class="m-price__label">${esc(ui.preu)}</span> <span class="${show ? "" : "is-empty"}">${value}</span></p>`;
}

export function MobileDescription(product) {
  if (product.estado !== "CONFIRMADO" || product.descripcion == null || product.descripcion === "") return "";
  return `<p class="m-desc" data-component="MobileDescription">${esc(product.descripcion)}</p>`;
}

export function MobileIngredientList(product, ui) {
  if (product.estado === "CONFIRMADO" && product.ingredientes != null) {
    const text = Array.isArray(product.ingredientes) ? product.ingredientes.join(" · ") : String(product.ingredientes);
    return `<p class="m-ingredients" data-component="MobileIngredientList"><span>${esc(ui.ingredients)}</span> ${esc(text)}</p>`;
  }
  return `<p class="m-ingredients is-pending" data-component="MobileIngredientList"><span>${esc(ui.ingredients)}</span> ${esc(ui.pendiente)}</p>`;
}

export function MobileAllergenInfo(product, ui, alergenos) {
  if (product?.estado === "CONFIRMADO" && Array.isArray(product.alergenos) && product.alergenos.length) {
    return `<p class="m-allergens" data-component="MobileAllergenInfo">${product.alergenos.map((item) => esc(item)).join(" · ")}</p>`;
  }
  if (alergenos?.estado === "CONFIRMADO" && Array.isArray(alergenos.items) && product == null) {
    return `<p class="m-allergens" data-component="MobileAllergenInfo">${alergenos.items.map((item) => esc(item)).join(" · ")}</p>`;
  }
  return `<p class="m-allergens is-pending" data-component="MobileAllergenInfo">${esc(alergenos?.titulo ?? "Al·lèrgens")}: ${esc(ui.pendiente)}</p>`;
}

export function MobileMenuItem(product, ui, alergenos) {
  const photo = product.estado === "CONFIRMADO" && product.foto
    ? `<img src="${esc(product.foto)}" alt="" loading="lazy">`
    : "";
  return `<article class="m-item" id="${esc(product.id)}" data-component="MobileMenuItem" data-estado="${esc(product.estado)}">
    ${photo}
    <div class="m-item__top">
      <h3>${blockedName(product, ui)}</h3>
      ${MobilePrice(product, ui)}
    </div>
    ${MobileDescription(product)}
    ${MobileIngredientList(product, ui)}
    ${MobileAllergenInfo(product, ui, alergenos)}
  </article>`;
}

export function MobileFeaturedItem(product, ui, alergenos) {
  if (!(product.destacado === true && product.estado === "CONFIRMADO")) return "";
  return `<article class="m-item m-item--featured" id="${esc(product.id)}" data-component="MobileFeaturedItem" data-estado="${esc(product.estado)}">
    <p class="m-featured">${esc(ui.destacat)}</p>
    <div class="m-item__top">
      <h3>${esc(product.nombre)}</h3>
      ${MobilePrice(product, ui)}
    </div>
    ${MobileDescription(product)}
    ${MobileIngredientList(product, ui)}
    ${MobileAllergenInfo(product, ui, alergenos)}
  </article>`;
}

export function MobileCategorySection(section, products, ui, alergenos) {
  const items = products.map((product) => {
    const featured = MobileFeaturedItem(product, ui, alergenos);
    return featured || MobileMenuItem(product, ui, alergenos);
  }).join("");
  const note = section.nota
    ? `<p class="m-note">${esc(section.nota)}</p>`
    : (products.length === 0 ? `<p class="m-note is-pending">${esc(ui.pendiente)}</p>` : "");
  const badge = sectionBadge(section, ui);
  return `<section class="m-section" id="${esc(section.id)}" data-component="MobileCategorySection" data-estado="${esc(section.estado_contenido)}">
    <h2>${esc(section.titulo)}${badge ? ` <span class="m-badge">${esc(badge)}</span>` : ""}</h2>
    ${note}
    ${items}
  </section>`;
}

export function MobileCreateYourPizza(section, grupos, ui) {
  const columns = grupos.map((group) => `<div class="m-group">
    <h3>${esc(group.etiqueta)}</h3>
    <p class="is-pending">${esc(ui.pendiente)}</p>
  </div>`).join("");
  const badge = sectionBadge(section, ui);
  return `<section class="m-section m-crea" id="${esc(section.id)}" data-component="MobileCreateYourPizza" data-estado="${esc(section.estado_contenido)}">
    <h2>${esc(section.titulo)}${badge ? ` <span class="m-badge">${esc(badge)}</span>` : ""}</h2>
    ${section.nota ? `<p class="m-note">${esc(section.nota)}</p>` : ""}
    <div class="m-groups">${columns}</div>
  </section>`;
}

export function MobileContactActions(contacto, ui) {
  const row = (label, value) => {
    const shown = contacto.estado === "CONFIRMADO" && value
      ? esc(value)
      : `<span class="is-pending">${esc(ui.pendiente)}</span>`;
    return `<p class="m-action"><span>${esc(label)}</span> ${shown}</p>`;
  };
  return `<div class="m-actions" data-component="MobileContactActions">
    ${row(contacto.etiquetas.telefon, contacto.telefon)}
    ${row(contacto.etiquetas.adreca, contacto.adreca)}
    ${row(contacto.etiquetas.horari, contacto.horari)}
  </div>`;
}

export function MobileFooter(catalog, ui) {
  const social = catalog.social.enlaces
    ? ""
    : `<p class="is-pending">${esc(ui.pendiente)}</p>`;
  const privacy = catalog.privacitat.url
    ? ""
    : `<p class="is-pending">${esc(ui.pendiente)}</p>`;
  const legal = catalog.legal.texto && catalog.legal.estado === "CONFIRMADO"
    ? `<p>${esc(catalog.legal.texto)}</p>`
    : `<p class="is-pending">${esc(ui.pendiente)}</p>`;
  return `<footer class="m-footer" data-component="MobileFooter">
    <h2>${esc(catalog.contacto.titulo)}</h2>
    ${MobileContactActions(catalog.contacto, ui)}
    <h2>${esc(catalog.alergenos.titulo)}</h2>
    ${MobileAllergenInfo(null, ui, catalog.alergenos)}
    <h2>${esc(catalog.legal.titulo)}</h2>
    ${legal}
    <h2>${esc(catalog.social.titulo)}</h2>
    ${social}
    <h2>${esc(catalog.privacitat.titulo)}</h2>
    ${privacy}
    <p class="m-footer__brand">${esc(catalog.marca.nombre)} ${esc(catalog.interfaz.separador_marca)} ${esc(catalog.marca.tipo)} ${esc(catalog.interfaz.separador_marca)} ${esc(catalog.marca.desde)}</p>
  </footer>`;
}

export function analyticsSeam(catalog) {
  const payload = {
    activo: catalog.analitica.activo,
    cookies: catalog.analitica.cookies,
    revisores: catalog.analitica.revisores,
  };
  return `<script type="application/json" id="lb-analytics-seam">${JSON.stringify(payload)}</script>`;
}
