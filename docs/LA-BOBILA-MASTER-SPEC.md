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
- Estados: `CONFIRMADO`, `POR_CONFIRMAR`, `SOURCE_MISSING`, `HISTORICO`, `PROPUESTA_ARGOS`, `DESCARTADO`.

## Roles

Gobierno permanente en `.cursor/rules/la-bobila-multitalk.md`. Un rol solo habla si tiene competencia real. Nivel IV no se simula.

En esta entrega intervinieron, de verdad: CEO, CPO, COO, CSO, CRO, CDAO, Head of Product Design, CTO, CLO (aviso de lámina, alérgenos, QR sin URL) y Chief of Staff. CFO no fijó precios: no hay datos. CISO no tiene formularios ni integraciones que revisar todavía.

## Diseño

Dirección cálida: marfil, verde profundo, terracota contenida, oliva, carbón cálido. Dos familias candidatas, no finales: Fraunces (marca y categorías) y Source Sans 3 (producto, ingredientes, precios). Archivos de fuente dentro del repo. Hex provisional, no extraído de un logo.

La lámina es DIN A3 vertical con sangre. La pizza, incluido «Crea la teva pizza», ocupa el 57 % del área de producto. La smash queda en el 12,5 %. Detalle, componentes y medición en `docs/LA-BOBILA-DESIGN-SYSTEM.md`.

El wordmark es `PLACEHOLDER`. El logo visual existe fuera del repositorio y no está ingerido.

## Arquitectura

```
catalog.json
  ├── print/render.mjs  → A3
  ├── mobile/render.mjs → /carta
  ├── QR_DEV local, QR_PRODUCTION bloqueado
  └── web futura
```

No hay un segundo catálogo. No hay dependencia npm nueva en Argos. `/carta` se sirve en local con `node la-bobila/mobile/server.mjs` (`127.0.0.1:4173`). `GET /` responde 302 a `/carta`, que es el ensayo de la redirección futura. No hay dominio público.

Regenerar:

```bash
node la-bobila/print/render.mjs
node la-bobila/print/export.mjs
```

`export.mjs` reescribe el HTML y exige Chrome en `/usr/bin/google-chrome-stable` (o `CHROME_PATH`).

## Catálogo

Versión 0.2.0. No es el catálogo definitivo. 17 pizzas con nombre `SOURCE_MISSING` (extracción textual, sin documento ingerido). 4 smash, 11 complements y 3 amanides sin nombre, mismo estado: el recuento se conoce y el nombre no. Crea la teva: solo cuatro etiquetas, cero toppings. Postres y gelats: nota `HISTORICO`, cero productos. Begudes: cero productos, catálogo no confirmado por el cliente. Cero precios, ingredientes, alérgenos y fotos. Modelo en `docs/LA-BOBILA-DATA-MODEL.md`.

No confundir «no está en el repo» con «no existe». El logo, la carta vigente, la carta histórica, los precios y los ingredientes visibles existen fuera y aún no se han ingerido.

## Hoja de ruta

1. Hecho: infraestructura provisional (reglas, tokens, renderer A3).
2. Hecho en este pase: `/carta`, módulo QR_DEV, estado `SOURCE_MISSING`, nombres de pizza de la extracción textual.
3. Siguiente: ingerir en el repo el logo y la carta vigente que ya existen fuera, muestrear el logo sobre una copia y rellenar solo hechos contrastados.
4. Bloqueado: `QR_PRODUCTION` hasta un dominio. Luego la URL estable redirige a `/carta`.
5. Después: web pública sobre el mismo catálogo. PWA solo cuando la carta contrastada exista (ADR-016).
6. Imprenta: la A3 sigue siendo un estudio. La tolerancia final espera una prueba de máquina. El redondeo de Chrome por debajo de 0,15 mm no bloquea.

Fuera de alcance: IA, cambios en Argos IT, publicar, imprimir la carta definitiva, combos sin confirmación.

## Criterios de aceptación

No es válido si parece plantilla, podría ser cualquier pizzería, domina el negro o la smash, el logo va pegado sin sistema, la pizza pierde protagonismo, el tipo es pequeño, hay sobredecoración o clichés italianos, sobran fotos, el precio domina, los ingredientes se leen peor que el precio, no imprime, no hay fuente única, hay datos inventados, o carta y web se contradicen.

Es válido con reconocimiento inmediato de La Bòbila, mediterráneo real, oficio, actualidad, elegancia cálida, claridad, legibilidad, personalidad, escala y coherencia papel/digital.

Esta entrega cumple la estructura, la fuente única, la jerarquía y la impresión. No cumple el reconocimiento inmediato: no hay logo. No se declara PASS.

## Veredicto

La infraestructura de base aguanta. QR y `/carta` están construidos y no pueden declararse PASS: faltan pruebas de dispositivo, dominio y documentos contrastados. Síntesis en `docs/LA-BOBILA-STATUS.md`. Criterios de QR en `docs/LA-BOBILA-QR-QA.md`.
