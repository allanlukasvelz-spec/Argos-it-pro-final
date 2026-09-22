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
    if (product.destacado !== false && product.estado !== "CONFIRMADO") {
      errors.push(`${product.id}: destacado comercial solo con producto confirmado.`);
    }
    if (product.estado !== "CONFIRMADO" && product.disponible != null) {
      errors.push(`${product.id}: disponible debe ser null hasta confirmar.`);
    }
    for (const key of VALUE_FIELDS) {
      if (product.estado !== "CONFIRMADO" && product.estado !== "HISTORICO" && product[key] != null) {
        errors.push(`${product.id}: ${key} tiene valor sin confirmación.`);
      }
    }
    if (product.estado === "HISTORICO" && product.precio != null) {
      errors.push(`${product.id}: un histórico no publica el precio vigente.`);
    }
    if (product.estado === "POR_CONFIRMAR" && product.nombre != null) {
      errors.push(`${product.id}: POR_CONFIRMAR no puede llevar nombre.`);
    }
    if (product.estado === "CONFIRMADO_SOURCE") {
      errors.push(`${product.id}: CONFIRMADO_SOURCE exige carta vigente ingerida y doble contraste. Hoy no hay archivo.`);
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
    if (product.estado === "CONFIRMADO" && product.tipo !== "producto") {
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
  if (count("postres") !== 0) errors.push("Postres: no fabricar productos. Solo nota de sección histórica.");
  if (count("begudes") !== 0) errors.push("Begudes: no inventar bebidas.");
  if (count("crea") !== 0) errors.push("Crea la teva: solo etiquetas de arquitectura, sin toppings.");

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
  if (catalog.marca?.wordmark !== "PLACEHOLDER") errors.push("El wordmark sigue siendo PLACEHOLDER.");

  if (errors.length) {
    throw new Error(`Catálogo rechazado:\n- ${errors.join("\n- ")}`);
  }
}
