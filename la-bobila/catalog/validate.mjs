/** Executable catalog rules. Print and /carta both import this. */

const ESTADOS = new Set([
  "CONFIRMADO",
  "CONFIRMADO_SOURCE",
  "POR_CONFIRMAR",
  "SOURCE_MISSING",
  "CANDIDATE_MATCH",
  "REVIEW_REQUIRED",
  "SOURCE_CONFLICT",
  "HISTORICO",
  "PROPUESTA_ARGOS",
  "DESCARTADO",
]);

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

const VALUE_FIELDS = ["nombre_corto", "descripcion", "ingredientes", "precio", "precio_historico", "alergenos", "foto"];

export function validate(catalog) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(catalog.productos)) {
    errors.push("El catálogo no tiene lista de productos.");
  }
  const sectionIds = new Set((catalog.secciones ?? []).map((section) => section.id));
  const groupIds = new Set((catalog.grupos_crea ?? []).map((group) => group.id));

  for (const product of catalog.productos ?? []) {
    for (const key of REQUIRED) {
      if (!Object.prototype.hasOwnProperty.call(product, key)) {
        errors.push(`${product.id ?? "?"}: falta ${key}.`);
      }
    }
    if (!ESTADOS.has(product.estado)) errors.push(`${product.id}: estado inválido.`);
    if (ids.has(product.id)) errors.push(`ID duplicado ${product.id}.`);
    ids.add(product.id);
    const prefix = PREFIX[product.categoria];
    if (!prefix) errors.push(`${product.id}: categoría sin prefijo.`);
    else if (!String(product.id).startsWith(`${prefix}-`)) {
      errors.push(`${product.id}: prefijo incorrecto.`);
    }
    if (!sectionIds.has(product.categoria)) errors.push(`${product.id}: categoría fuera de secciones.`);
    if (product.destacado !== false && product.estado !== "CONFIRMADO" && product.estado !== "CONFIRMADO_SOURCE") {
      errors.push(`${product.id}: destacado comercial solo con producto confirmado.`);
    }
    if (product.estado !== "CONFIRMADO" && product.estado !== "CONFIRMADO_SOURCE" && product.disponible != null) {
      errors.push(`${product.id}: disponible debe ser null hasta confirmar.`);
    }
    for (const key of VALUE_FIELDS) {
      if (product.estado !== "CONFIRMADO" && product.estado !== "CONFIRMADO_SOURCE" && product.estado !== "HISTORICO" && product[key] != null) {
        errors.push(`${product.id}: ${key} tiene valor sin confirmación.`);
      }
    }
    if ((product.estado === "CONFIRMADO" || product.estado === "CONFIRMADO_SOURCE") && product.precio != null) {
      const price = product.precio;
      if (typeof price !== "object" || typeof price.value !== "number" || price.status !== "CONFIRMADO_SOURCE") {
        errors.push(`${product.id}: el precio contrastado es { value, status: CONFIRMADO_SOURCE }.`);
      }
      if (price && price.currency != null) {
        errors.push(`${product.id}: la moneda global sigue sin confirmar. currency null.`);
      }
    }
    if (product.estado === "HISTORICO" && product.precio != null) {
      errors.push(`${product.id}: un histórico no publica el precio vigente.`);
    }
    if (product.estado === "POR_CONFIRMAR" && product.nombre != null) {
      errors.push(`${product.id}: POR_CONFIRMAR no puede llevar nombre.`);
    }
    if (product.estado === "CONFIRMADO_SOURCE" && product.fuente !== "LB-ASSET-MENU-CURRENT-001") {
      errors.push(`${product.id}: CONFIRMADO_SOURCE exige la carta vigente ingerida LB-ASSET-MENU-CURRENT-001.`);
    }
    if (product.estado === "CANDIDATE_MATCH") {
      if (product.categoria !== "pizzes") {
        errors.push(`${product.id}: CANDIDATE_MATCH solo aplica a nombres de pizza ya extraídos.`);
      }
      if (product.fuente !== "extraccion-textual-2026-09-22-sin-documento") {
        errors.push(`${product.id}: CANDIDATE_MATCH sigue citando la extracción, no un documento ingerido.`);
      }
      if (typeof product.nombre !== "string" || product.nombre.trim() === "") {
        errors.push(`${product.id}: CANDIDATE_MATCH necesita el nombre candidato.`);
      }
    }
    if (product.estado === "SOURCE_MISSING") {
      if (product.fuente !== "extraccion-textual-2026-09-22-sin-documento") {
        errors.push(`${product.id}: SOURCE_MISSING debe citar la extracción, no un documento ingerido.`);
      }
      const unnamed = product.categoria === "smash" || product.categoria === "complements" || product.categoria === "amanides";
      if (unnamed && product.nombre != null) {
        errors.push(`${product.id}: hueco sin nombre ingerido. No inventar el nombre.`);
      }
      if (product.categoria === "pizzes" && (typeof product.nombre !== "string" || product.nombre.trim() === "")) {
        errors.push(`${product.id}: la referencia de pizza SOURCE_MISSING necesita el nombre extraído.`);
      }
      if (product.categoria === "crea") {
        errors.push(`${product.id}: no hay SKU de topping confirmado ni extraído.`);
      }
    }
    if ((product.estado === "CONFIRMADO" || product.estado === "CONFIRMADO_SOURCE") && product.tipo !== "producto") {
      errors.push(`${product.id}: un confirmado es tipo producto.`);
    }
    if (!product.observaciones) errors.push(`${product.id}: observaciones vacías.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(product.ultima_revision ?? "")) {
      errors.push(`${product.id}: ultima_revision no es una fecha.`);
    }
    if (product.categoria === "crea" && product.subcategoria != null && !groupIds.has(product.subcategoria)) {
      errors.push(`${product.id}: grupo de crea desconocido.`);
    }
  }

  const count = (categoria) => (catalog.productos ?? []).filter((product) => product.categoria === categoria).length;
  if (count("postres") !== 0) errors.push("Postres: no fabricar productos vigentes. Solo nota de sección histórica.");
  if (count("begudes") !== 0) errors.push("Begudes: no inventar bebidas.");
  for (const product of (catalog.productos ?? []).filter((item) => item.categoria === "crea")) {
    if (product.fuente !== "LB-ASSET-MENU-CURRENT-001") {
      errors.push(`${product.id}: un topping solo entra desde la carta vigente ingerida.`);
    }
    if (product.estado !== "CONFIRMADO" && product.estado !== "CONFIRMADO_SOURCE" && product.estado !== "REVIEW_REQUIRED") {
      errors.push(`${product.id}: topping sin estado de ingesta.`);
    }
  }

  const postres = (catalog.secciones ?? []).find((section) => section.id === "postres");
  if (postres?.estado_contenido !== "HISTORICO") {
    errors.push("Postres: la sección debe estar en HISTORICO, no darse por vigente.");
  }

  const qr = catalog.qr ?? {};
  if (qr.produccion?.id !== "QR_PRODUCTION") errors.push("Falta QR_PRODUCTION.");
  if (qr.produccion?.destino != null) errors.push("QR_PRODUCTION no puede tener destino.");
  if (qr.produccion?.estado !== "BLOQUEADO") errors.push("QR_PRODUCTION debe estar BLOQUEADO.");
  if (qr.desarrollo?.id !== "QR_DEV") errors.push("Falta QR_DEV.");
  if (!/^http:\/\/127\.0\.0\.1:\d+\/carta$/.test(qr.desarrollo?.destino ?? "")) {
    errors.push("QR_DEV solo puede codificar http://127.0.0.1:<puerto>/carta.");
  }
  if (qr.ruta_estable !== "/carta") errors.push("La ruta estable debe ser /carta.");
  const blob = JSON.stringify(qr);
  if (/https?:\/\/(?!127\.0\.0\.1)/.test(blob)) {
    errors.push("El bloque QR contiene una URL que no es local.");
  }

  if (catalog.contacto?.estado !== "CONFIRMADO") {
    for (const key of ["adreca", "horari", "telefon"]) {
      if (catalog.contacto?.[key] != null) errors.push(`Contacto: ${key} sin confirmación.`);
    }
  }
  if (catalog.alergenos?.estado !== "CONFIRMADO" && catalog.alergenos?.items != null) {
    errors.push("Alérgenos: hay lista sin estado CONFIRMADO.");
  }
  if (catalog.social?.enlaces != null) errors.push("Redes: no inventar enlaces.");
  if (catalog.privacitat?.url != null) errors.push("Privacidad: no inventar URL.");
  if (catalog.analitica?.activo !== false) errors.push("La analítica debe estar inactiva.");
  if (catalog.marca?.nombre !== "La Bòbila") errors.push("La marca debe ser La Bòbila.");
  if (catalog.marca?.wordmark !== "PLACEHOLDER") errors.push("El wordmark tipográfico sigue siendo PLACEHOLDER.");
  const assetText = catalog.marca?.brand_asset_text;
  const editorial = catalog.marca?.editorial_copy;
  if (assetText?.estado !== "BRAND_ASSET_TEXT" || assetText?.desde !== "DESDE 2005" || assetText?.tipo !== "PIZZERIA ARTIGIANALE") {
    errors.push("BRAND_ASSET_TEXT debe conservar «DESDE 2005» y «PIZZERIA ARTIGIANALE».");
  }
  if (assetText?.fuente !== "LB-ASSET-LOGO-001") errors.push("BRAND_ASSET_TEXT cita el logo, no la carta.");
  if (editorial?.estado !== "EDITORIAL_COPY_PENDING" || editorial?.desde !== "Des de 2005" || editorial?.tipo !== "Pizzeria artesana") {
    errors.push("EDITORIAL_COPY sigue pendiente del cliente: «Des de 2005» y «Pizzeria artesana», aparte del logo.");
  }
  if (catalog.moneda?.estado !== "CONFIRMADO") {
    if (catalog.moneda?.presentacion !== "EUR_PENDING_PRESENTATION") {
      errors.push("La presentación de la moneda debe ser EUR_PENDING_PRESENTATION.");
    }
    if (catalog.moneda?.simbolo != null || catalog.moneda?.codigo != null) {
      errors.push("No se autoriza símbolo ni código mientras la presentación está pendiente.");
    }
  }

  const CURRENT = "LB-ASSET-MENU-CURRENT-001";
  const HISTORICAL = "LB-ASSET-MENU-HISTORICAL-001";
  const cites = (value, asset) => JSON.stringify(value ?? null).includes(asset);
  if (catalog.historico) {
    if (catalog.historico.fuente !== HISTORICAL) {
      errors.push("historico.fuente debe ser LB-ASSET-MENU-HISTORICAL-001.");
    }
    if (cites(catalog.historico, CURRENT)) {
      errors.push("Un registro HISTORICO cita LB-ASSET-MENU-CURRENT-001.");
    }
  }
  for (const section of catalog.secciones ?? []) {
    if (section.estado_contenido === "HISTORICO" && section.fuente !== HISTORICAL) {
      errors.push(`${section.id}: una sección HISTORICO solo puede citar la carta histórica.`);
    }
    if (section.estado_contenido === "HISTORICO" && cites(section, CURRENT)) {
      errors.push(`${section.id}: una sección HISTORICO cita la carta vigente.`);
    }
  }
  for (const product of catalog.productos ?? []) {
    if (product.estado === "HISTORICO" && cites(product, CURRENT)) {
      errors.push(`${product.id}: un producto HISTORICO cita la carta vigente.`);
    }
    if (product.precio_historico && product.precio_historico.source !== HISTORICAL) {
      errors.push(`${product.id}: precio_historico solo puede citar la carta histórica.`);
    }
    if (product.precio?.status === "CONFIRMADO_SOURCE" && product.precio.source !== CURRENT) {
      errors.push(`${product.id}: un precio CONFIRMADO_SOURCE de la carta vigente cita un asset que no es el vigente.`);
    }
    if (product.precio?.status === "CONFIRMADO_SOURCE" && product.precio.source === HISTORICAL) {
      errors.push(`${product.id}: un precio CONFIRMADO_SOURCE cita la carta histórica.`);
    }
  }
  for (const group of catalog.grupos_crea ?? []) {
    if (group.extra?.status === "CONFIRMADO_SOURCE" && group.extra.source !== CURRENT) {
      errors.push(`${group.id}: el suplemento CONFIRMADO_SOURCE cita un asset que no es el vigente.`);
    }
  }

  if (errors.length) {
    throw new Error(`Catálogo rechazado:\n- ${errors.join("\n- ")}`);
  }
}
