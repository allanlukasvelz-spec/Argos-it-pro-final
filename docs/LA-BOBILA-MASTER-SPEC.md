# La Bòbila — especificación maestra

Fecha: 2026-09-22. Idioma interno: español. Carta de cliente: catalán.

## Inspección

El repositorio es ARGOS-IT: sitio de consultoría tecnológica. Frontend Next.js, backend Express, exportación WordPress, pruebas e2e y esquema PostgreSQL. No es una base de pizzería.

Búsqueda de partida, repetida al empezar:

- Ningún archivo ni texto con Bòbila, Bobila o pizzería.
- Ninguna carta, ningún logo raster, ninguna carta histórica.
- Imágenes existentes: solo `frontend/public/favicon.svg` y `frontend/public/apple-touch-icon.svg` (Argos).
- `.cursor/` contenía únicamente `plans/endurecimiento_argos-it_completo_208321a7.plan.md`. No había `.cursor/rules/`.

Esa ausencia es un hecho. No se inventan logo, productos, precios, alérgenos, horarios, dirección, teléfono ni fotos.

Decisión: el sistema nuevo vive en `la-bobila/` y en documentos `docs/LA-BOBILA-*`. No se toca el producto Argos IT.

## Visión

La Bòbila es una pizzería artesana mediterránea, contemporánea, en activo desde 2005. El trabajo no es «hacer una carta bonita». Es un sistema de marca y producto para que, cuando entren los datos reales, el resultado siga siendo La Bòbila y se vea como siempre debió verse.

Sin el logo y sin la carta vigente, el reconocimiento inmediato no se puede declarar. Esta entrega construye la estructura honesta: huecos, jerarquía, tipo, retícula e impresión. El veredicto es parcial.

## Principios

- Nombre: La Bòbila. Tipo: pizzería artesana. Identidad: mediterráneo artesanal contemporáneo.
- «Des de 2005» se conserva.
- No es trattoria italiana, restaurante medieval, fast food ni una marca cuyo protagonista sea la smash burger.
- Sin pergamino falso, sin negro dominante, sin abuso de dorado, sin clichés italianos, sin fotos genéricas, sin datos inventados.
- Orden: verdad de producto, arquitectura, jerarquía, diseño, implementación.
- Una sola fuente: `la-bobila/catalog/catalog.json`.
- Estados: `CONFIRMADO`, `POR_CONFIRMAR`, `HISTORICO`, `PROPUESTA_ARGOS`, `DESCARTADO`.

## Roles

Gobierno permanente en `.cursor/rules/la-bobila-multitalk.md`. Un rol solo habla si tiene competencia real. Nivel IV no se simula.

En esta entrega intervinieron, de verdad: CEO, CPO, COO, CSO, CRO, CDAO, Head of Product Design, CTO, CLO (aviso de lámina, alérgenos, QR sin URL) y Chief of Staff. CFO no fijó precios: no hay datos. CISO no tiene formularios ni integraciones que revisar todavía.

## Diseño

Dirección cálida: marfil, verde profundo, terracota contenida, oliva, carbón cálido. Dos familias: Fraunces (marca y categorías) y Source Sans 3 (producto, ingredientes, precios). Archivos de fuente dentro del repo. Hex provisional, no extraído de un logo.

La lámina es DIN A3 vertical con sangre. La pizza, incluido «Crea la teva pizza», ocupa el 57 % del área de producto. La smash queda en el 12,5 %. Detalle, componentes y medición en `docs/LA-BOBILA-DESIGN-SYSTEM.md`.

El wordmark «La Bòbila» es tipográfico y provisional. El logo real no está colocado.

## Arquitectura

```
la-bobila/catalog/catalog.json     fuente única
la-bobila/tokens/                  color, tipo, espacio, impresión
la-bobila/print/components.mjs     componentes con nombre estable
la-bobila/print/render.mjs         valida y genera carta-a3.html
la-bobila/print/export.mjs         PDF y PNG con Chrome del sistema
la-bobila/print/renders/           salida de imprenta y previsualización
```

No hay dependencia npm nueva en el `package.json` de Argos. No hay CMS, web pública ni QR real: el destino del QR es `POR_CONFIRMAR` y el marco no es un código escaneable.

Regenerar:

```bash
node la-bobila/print/render.mjs
node la-bobila/print/export.mjs
```

`export.mjs` reescribe el HTML y exige Chrome en `/usr/bin/google-chrome-stable` (o `CHROME_PATH`).

## Catálogo

29 huecos, todos `POR_CONFIRMAR`, fuente `estructura-inicial`, revisión 2026-09-22. Cero precios, cero alérgenos, cero fotos. Los prefijos `LB-POS` y `LB-BEG` son esquema, no productos. Los toppings de «Crea la teva pizza» usan `LB-EXT` y no son SKU inventados. Modelo en `docs/LA-BOBILA-DATA-MODEL.md`.

Confirmado por el encargo, no por un archivo del repo: el nombre, «Pizzeria artesana», «Des de 2005» y las etiquetas de arquitectura (pizzes, crea, smash, per compartir, amanides, y los cinco grupos del módulo). Postres y begudes se muestran como secciones pendientes.

## Hoja de ruta

1. Hecho: reglas, tokens, catálogo estructural, componentes, lámina A3, PDF y PNG.
2. Siguiente: recibir logo original y carta vigente (productos, precios, alérgenos) y volcarlos solo en el JSON.
3. Después: destino real del QR, dirección, horario y teléfono; texto legal revisado en lugar del aviso de prueba.
4. Después: carta digital y web leyendo el mismo catálogo. Misma jerarquía, mismos IDs.
5. Imprenta: marcas de corte solo si el impresor las pide. El PDF actual ya es la caja de sangre.

Fuera de alcance: funciones de IA, cambios en Argos IT, publicación a producción, combos o precios sin datos.

## Criterios de aceptación

No es válido si parece plantilla, podría ser cualquier pizzería, domina el negro o la smash, el logo va pegado sin sistema, la pizza pierde protagonismo, el tipo es pequeño, hay sobredecoración o clichés italianos, sobran fotos, el precio domina, los ingredientes se leen peor que el precio, no imprime, no hay fuente única, hay datos inventados, o carta y web se contradicen.

Es válido con reconocimiento inmediato de La Bòbila, mediterráneo real, oficio, actualidad, elegancia cálida, claridad, legibilidad, personalidad, escala y coherencia papel/digital.

Esta entrega cumple la estructura, la fuente única, la jerarquía y la impresión. No cumple el reconocimiento inmediato: no hay logo. No se declara PASS.

## Veredicto

Parcial. La síntesis está en `docs/LA-BOBILA-STATUS.md`.
