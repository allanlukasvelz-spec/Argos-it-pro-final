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

function pending(ui) {
  return `<span class="is-pending">${esc(ui.pendiente)}</span>`;
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

export function CategoryHeader(section, ui, opts = {}) {
  const badge = opts.pending
    ? `<span class="lb-cat__badge">${pending(ui)}</span>`
    : "";
  const icon = opts.icon ?? "";
  return `<header class="lb-cat lb-cat--${esc(section.peso)}" data-component="CategoryHeader">
    ${icon}
    <h2 class="lb-cat__title">${esc(section.titulo)}</h2>
    ${badge}
    <span class="lb-cat__rule" aria-hidden="true"></span>
  </header>`;
}

export function Price(product, ui) {
  const show = product.estado === "CONFIRMADO" && product.precio != null;
  if (!show) {
    return `<span class="lb-price is-empty" data-component="Price"><span class="lb-sr">${esc(ui.pendiente)}</span>${esc(ui.precio_vacio)}</span>`;
  }
  const amount = typeof product.precio === "number"
    ? String(product.precio).replace(".", ",")
    : String(product.precio);
  const symbol = ui.moneda_confirmada ? ` ${esc(ui.moneda_confirmada)}` : "";
  return `<span class="lb-price" data-component="Price">${esc(amount)}${symbol}</span>`;
}

export function Description(product) {
  if (product.estado !== "CONFIRMADO" || product.descripcion == null || product.descripcion === "") {
    return "";
  }
  return `<p class="lb-desc" data-component="Description">${esc(product.descripcion)}</p>`;
}

export function IngredientList(product, ui) {
  if (product.estado !== "CONFIRMADO" || product.ingredientes == null) {
    return `<p class="lb-ingredients is-pending" data-component="IngredientList">${esc(ui.pendiente)}</p>`;
  }
  const text = Array.isArray(product.ingredientes)
    ? product.ingredientes.join(" · ")
    : String(product.ingredientes);
  return `<p class="lb-ingredients" data-component="IngredientList">${esc(text)}</p>`;
}

export function MenuItem(product, ui, opts = {}) {
  const featured = opts.featured === true;
  const component = featured ? "MenuItemFeatured" : "MenuItem";
  const pendingName = product.estado !== "CONFIRMADO" || product.nombre == null;
  const name = pendingName
    ? `<span class="is-pending">${esc(ui.pendiente)}</span>`
    : esc(product.nombre);
  const id = product.estado === "CONFIRMADO"
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

export function CreateYourPizzaModule(section, grupos, productos, ui) {
  const columns = grupos.map((group) => {
    const slots = productos
      .filter((item) => item.subcategoria === group.id)
      .sort((a, b) => a.orden - b.orden);
    const rows = slots.map((slot) => `<li class="lb-crea__slot">
      <span class="lb-id">${esc(slot.id)}</span>
      <span class="lb-crea__pending is-pending">${esc(ui.pendiente)}</span>
    </li>`).join("");
    return `<div class="lb-crea__group" data-grupo="${esc(group.id)}">
      <h3 class="lb-crea__label">${esc(group.etiqueta)}</h3>
      <ul class="lb-crea__list">${rows}</ul>
    </div>`;
  }).join("");

  return `<section class="lb-crea" data-component="CreateYourPizzaModule" data-zone="crea">
    ${CategoryHeader(section, ui)}
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

export function QRBlock(qr, ui) {
  const dest = qr.estado === "CONFIRMADO" && qr.destino
    ? `<p class="lb-qr__dest">${esc(qr.destino)}</p>`
    : `<p class="lb-qr__dest is-pending">${esc(ui.pendiente)}</p>`;
  return `<section class="lb-qr" data-component="QRBlock">
    <h2 class="lb-foot__title">${esc(qr.titulo)}</h2>
    <div class="lb-qr__frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    ${dest}
  </section>`;
}

export function LegalInfo(aviso) {
  return `<p class="lb-legal" data-component="LegalInfo" data-estado="${esc(aviso.estado)}">${esc(aviso.texto)}</p>`;
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
      ${QRBlock(catalog.qr, ui)}
      ${ContactBlock(catalog.contacto, ui)}
    </div>
    ${LegalInfo(catalog.aviso_lamina)}
    <p class="lb-footer__brand">${esc(marca)}</p>
  </footer>`;
}
