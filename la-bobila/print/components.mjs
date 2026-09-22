/** Reusable La Bòbila menu components.
 *  Print, web, mobile, and the digital menu should keep these names.
 *  Customer strings come from the catalog. This file does not own product facts. */

export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function BrandHeader(marca, olive) {
  return `<header class="lb-brand" data-component="BrandHeader">
    <div class="lb-brand__olive">${olive}</div>
    <div class="lb-brand__lockup">
      <p class="lb-brand__name">${esc(marca.nombre)}</p>
      <p class="lb-brand__tipo">${esc(marca.tipo)}</p>
      <p class="lb-brand__desde">${esc(marca.desde)}</p>
      <span class="lb-brand__tick" aria-hidden="true"></span>
    </div>
    <div class="lb-brand__balance" aria-hidden="true"></div>
  </header>`;
}

export function sectionBadge(section, ui) {
  if (section.estado_contenido === "HISTORICO") return ui.historic;
  if (section.estado_contenido === "SOURCE_MISSING" || section.estado_contenido === "CANDIDATE_MATCH") {
    return ui.sense_contrastar;
  }
  if (section.estado_etiqueta !== "CONFIRMADO" || section.estado_contenido === "POR_CONFIRMAR") {
    return ui.pendiente;
  }
  return "";
}

export function CategoryHeader(section, ui, opts = {}) {
  const badgeText = opts.badge ?? "";
  const badge = badgeText
    ? `<span class="lb-cat__badge">${esc(badgeText)}</span>`
    : "";
  const icon = opts.icon ?? "";
  return `<header class="lb-cat lb-cat--${esc(section.peso)}" data-component="CategoryHeader">
    ${icon}
    <h2 class="lb-cat__title">${esc(section.titulo)}</h2>
    ${badge}
    <span class="lb-cat__rule" aria-hidden="true"></span>
  </header>`;
}

function amountFrom(product) {
  const price = product.precio;
  if (price == null) return null;
  const value = typeof price === "number" ? price : price.value;
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value.toFixed(2).replace(".", ",");
}

function isPriced(product) {
  return (product.estado === "CONFIRMADO" || product.estado === "CONFIRMADO_SOURCE") && amountFrom(product) != null;
}

export function Price(product, ui) {
  if (!isPriced(product)) {
    return `<span class="lb-price is-empty" data-component="Price"><span class="lb-sr">${esc(ui.pendiente)}</span>${esc(ui.precio_vacio)}</span>`;
  }
  const symbol = ui.moneda_confirmada ? ` ${esc(ui.moneda_confirmada)}` : "";
  return `<span class="lb-price" data-component="Price">${esc(amountFrom(product))}${symbol}</span>`;
}

export function Description(product) {
  if ((product.estado !== "CONFIRMADO" && product.estado !== "CONFIRMADO_SOURCE") || product.descripcion == null || product.descripcion === "") {
    return "";
  }
  return `<p class="lb-desc" data-component="Description">${esc(product.descripcion)}</p>`;
}

export function IngredientList(product, ui) {
  if ((product.estado !== "CONFIRMADO" && product.estado !== "CONFIRMADO_SOURCE") || product.ingredientes == null) {
    return `<p class="lb-ingredients is-pending" data-component="IngredientList">${esc(ui.pendiente)}</p>`;
  }
  const text = Array.isArray(product.ingredientes)
    ? product.ingredientes.join(" · ")
    : String(product.ingredientes);
  return `<p class="lb-ingredients" data-component="IngredientList">${esc(text)}</p>`;
}

function showsName(product) {
  return Boolean(product.nombre) && (
    product.estado === "CONFIRMADO"
    || product.estado === "CONFIRMADO_SOURCE"
    || product.estado === "SOURCE_MISSING"
    || product.estado === "CANDIDATE_MATCH"
    || product.estado === "REVIEW_REQUIRED"
  );
}

function visibleName(product, ui) {
  if ((product.estado === "CONFIRMADO" || product.estado === "CONFIRMADO_SOURCE") && product.nombre) {
    return esc(product.nombre);
  }
  if (showsName(product)) return `<span class="is-uncontrasted">${esc(product.nombre)}</span>`;
  return `<span class="is-pending">${esc(ui.pendiente)}</span>`;
}

export function MenuItem(product, ui, opts = {}) {
  const featured = opts.featured === true && product.destacado === true && product.estado === "CONFIRMADO";
  const component = featured ? "MenuItemFeatured" : "MenuItem";
  const pendingName = !showsName(product);
  const name = visibleName(product, ui);
  const id = product.estado === "CONFIRMADO" || product.estado === "CONFIRMADO_SOURCE"
    ? ""
    : `<span class="lb-id">${esc(product.id)}</span>`;
  const contour = featured ? (opts.contour ?? "") : "";
  return `<article class="lb-item${featured ? " lb-item--featured" : ""}" data-component="${component}" data-id="${esc(product.id)}" data-estado="${esc(product.estado)}">
    ${contour}
    <div class="lb-item__top">
      ${id}
      ${Price(product, ui)}
    </div>
    <h3 class="lb-name${pendingName ? " is-pending" : ""}">${name}</h3>
    ${IngredientList(product, ui)}
    ${Description(product)}
  </article>`;
}

export function MenuItemFeatured(product, ui, opts = {}) {
  return MenuItem(product, ui, { ...opts, featured: true });
}

export function MenuRow(product, ui) {
  const pendingName = !showsName(product);
  const confirmed = product.estado === "CONFIRMADO" || product.estado === "CONFIRMADO_SOURCE";
  const id = product.nombre ? "" : `<span class="lb-id">${esc(product.id)}</span>`;
  const name = !pendingName ? esc(product.nombre) : esc(ui.pendiente);
  return `<article class="lb-row" data-component="MenuItem" data-id="${esc(product.id)}" data-estado="${esc(product.estado)}">
    <h3 class="lb-name${pendingName ? " is-pending" : confirmed ? "" : " is-uncontrasted"}">${name}</h3>
    <span class="lb-row__meta">${id}${Price(product, ui)}</span>
  </article>`;
}

export function CreateYourPizzaModule(section, grupos, productos, ui) {
  const columns = grupos.map((group) => {
    const slots = productos
      .filter((item) => item.subcategoria === group.id)
      .sort((a, b) => a.orden - b.orden);
    const rows = slots.length
      ? slots.map((slot) => {
        const confirmed = (slot.estado === "CONFIRMADO" || slot.estado === "CONFIRMADO_SOURCE") && slot.nombre;
        const label = slot.nombre && (confirmed || slot.estado === "REVIEW_REQUIRED")
          ? esc(slot.nombre)
          : esc(ui.pendiente);
        const klass = confirmed ? "lb-crea__name" : "lb-crea__pending is-pending";
        return `<li class="lb-crea__slot">
      <span class="${klass}">${label}</span>
    </li>`;
      }).join("")
      : `<li class="lb-crea__slot"><span class="lb-crea__pending is-pending">${esc(ui.pendiente)}</span></li>`;
    return `<div class="lb-crea__group" data-grupo="${esc(group.id)}">
      <h3 class="lb-crea__label">${esc(group.etiqueta)}${group.extra && group.extra.status === "CONFIRMADO_SOURCE" && typeof group.extra.value === "number" ? ` ${esc(group.extra.value.toFixed(2).replace(".", ","))}` : ""}</h3>
      <ul class="lb-crea__list">${rows}</ul>
    </div>`;
  }).join("");

  const note = section.nota ? `<p class="lb-note">${esc(section.nota)}</p>` : "";
  return `<section class="lb-crea" data-component="CreateYourPizzaModule" data-zone="crea">
    ${CategoryHeader(section, ui, { badge: sectionBadge(section, ui) })}
    ${note}
    <div class="lb-crea__grid">${columns}</div>
  </section>`;
}

export function AllergenBadge(block, ui) {
  const confirmed = block.estado === "CONFIRMADO" && Array.isArray(block.items);
  const body = confirmed
    ? `<div class="lb-badges">${block.items.map((item) => `<span class="lb-badge" data-component="AllergenBadge">${esc(item)}</span>`).join("")}</div>`
    : `<p class="lb-badge is-pending" data-component="AllergenBadge">${esc(ui.pendiente)}</p>`;
  return `<section class="lb-allergens">
    <h2 class="lb-foot__title">${esc(block.titulo)}</h2>
    ${body}
  </section>`;
}

export function SectionDivider() {
  return `<div class="lb-divider" data-component="SectionDivider" aria-hidden="true"><span></span></div>`;
}

export function QRBlock(qr, svg) {
  if (qr?.produccion?.destino != null || qr?.desarrollo?.id !== "QR_DEV") {
    throw new Error("QRBlock solo admite el módulo QR_DEV.");
  }
  return `<section class="lb-qrmod" data-component="QRBlock" data-qr="QR_DEV" data-estado="${esc(qr.modulo.estado_texto)}">
    <div class="lb-qrmod__copy">
      <h2 class="lb-qrmod__title">${esc(qr.modulo.titulo)}</h2>
      <p class="lb-qrmod__text">${esc(qr.modulo.texto)}</p>
      <p class="lb-qrmod__dev">${esc(qr.desarrollo.aviso)}</p>
      <p class="lb-qrmod__url">${esc(qr.desarrollo.destino)}</p>
    </div>
    <div class="lb-qrmod__mark">${svg}</div>
  </section>`;
}

export function LegalInfo(aviso) {
  return `<p class="lb-study" data-component="LegalInfo" data-estado="${esc(aviso.estado)}" role="note">${esc(aviso.texto)}</p>`;
}

export function ContactBlock(contacto, ui) {
  const row = (label, value) => {
    const shown = contacto.estado === "CONFIRMADO" && value
      ? esc(value)
      : `<span class="is-pending">${esc(ui.pendiente)}</span>`;
    return `<p class="lb-contact__row"><span class="lb-contact__label">${esc(label)}</span> ${shown}</p>`;
  };
  return `<section class="lb-contact" data-component="ContactBlock">
    <h2 class="lb-foot__title">${esc(contacto.titulo)}</h2>
    ${row(contacto.etiquetas.adreca, contacto.adreca)}
    ${row(contacto.etiquetas.horari, contacto.horari)}
    ${row(contacto.etiquetas.telefon, contacto.telefon)}
  </section>`;
}

export function FooterInfo(catalog, ui) {
  const marca = `${catalog.marca.nombre} ${catalog.interfaz.separador_marca} ${catalog.marca.tipo} ${catalog.interfaz.separador_marca} ${catalog.marca.desde}`;
  return `<footer class="lb-footer" data-component="FooterInfo" data-zone="footer">
    <div class="lb-footer__grid">
      ${AllergenBadge(catalog.alergenos, ui)}
      ${ContactBlock(catalog.contacto, ui)}
    </div>
    <p class="lb-footer__brand">${esc(marca)}</p>
  </footer>`;
}
