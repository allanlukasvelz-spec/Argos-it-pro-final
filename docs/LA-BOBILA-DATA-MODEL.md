# La Bòbila — modelo de datos

Fecha: 2026-09-22. Versión de catálogo: 0.3.0. Fuente ejecutable: `la-bobila/catalog/catalog.json`. El validador está en `la-bobila/catalog/validate.mjs`. Lo usan la A3 y `/carta`. Los originales, cuando existan, viven en `la-bobila/source/` y se registran en `la-bobila/source/manifest/assets.json`.

## Una sola fuente

Impresión, carta móvil y QR salen de este JSON. No hay `catalog-mobile.json`, `catalog-print.json` ni `menu-data.json`. El HTML generado no se edita.

## Estados

| Estado | Significado |
| --- | --- |
| `AVAILABLE_EXTERNALLY` | Se sabe que existe fuera del repositorio. Estado de activo, no de fila de producto. |
| `FILE_NOT_INGESTED` | El archivo no está físicamente en el repo. `sha256` null. No es un hash fingido. |
| `SOURCE_MISSING` | No hay documento con el que contrastar ese hecho. |
| `CANDIDATE_MATCH` | Nombre anotado, sin cruce contra la carta vigente. No es confirmado. |
| `REVIEW_REQUIRED` | Original y normalización divergen, o el dato pide revisión. |
| `SOURCE_CONFLICT` | El candidato no está en la fuente, o dos fuentes chocan. |
| `POR_CONFIRMAR` | Hay documento, y el cliente aún debe validar el dato. |
| `CONFIRMADO` | Contrastado y válido. |
| `CONFIRMADO_SOURCE` | Solo tras transcripción y segundo contraste contra el archivo. Hoy el validador lo rechaza: no hay carta ingerida. |
| `HISTORICO` | Carta o estado anterior. No entra solo en la carta vigente ni en `/carta`. |
| `PROPUESTA_ARGOS` | Texto nuestro, no un dato del negocio. |
| `DESCARTADO` | Se conserva la traza y no se muestra. Hoy no hay filas. |

`null` en precio, ingredientes, alérgenos, descripción o foto significa que ese valor no está en el catálogo. No sustituye al estado de la fila.

## Qué hay ahora

No es el catálogo definitivo.

| Grupo | Filas | Estado | Nombre |
| --- | --- | --- | --- |
| Pizzes `LB-PIZ-001` … `017` | 17 | `CANDIDATE_MATCH` | El de la extracción textual, sin cruce |
| Smash `LB-BUR-001` … `004` | 4 | `SOURCE_MISSING` | null. El recuento se conoce; el nombre no |
| Complements `LB-COM-001` … `011` | 11 | `SOURCE_MISSING` | null. Igual |
| Amanides `LB-AMA-001` … `003` | 3 | `SOURCE_MISSING` | null. Igual |
| Crea la teva | 0 | etiquetas solo | Base pizza, Carn, Vegetals, Formatges |
| Postres | 0 | sección `HISTORICO` | Nota de postres y gelats. No se asume vigencia |
| Begudes | 0 | sección `POR_CONFIRMAR` | El cliente no ha confirmado el catálogo |
| Combos | 0 | — | No confirmados. No se añaden |

Fuente de las filas candidatas y de los huecos sin nombre: `extraccion-textual-2026-09-22-sin-documento`. Precio, ingredientes, alérgenos, descripción y foto en `null`. `destacado` es `false`. Ninguna fila es `CONFIRMADO` ni `CONFIRMADO_SOURCE`.

El precio, cuando se extraiga de la carta, será `{ value, currency, source, status }`. La moneda global sigue `POR_CONFIRMAR`. No se rellena un precio por patrón. Crea la teva, cuando la carta lo permita, será base más grupos carn, vegetals, formatges y altres, cada ingrediente con id, nombre, grupo, extra y estado. Hoy solo hay las cuatro etiquetas y cero SKU. Un alérgeno legal no se infiere de un ingrediente.

## Marca y QR

`marca.nombre`, tipo y «Des de 2005» siguen `CONFIRMADO` por el encargo. `marca.wordmark` es `PLACEHOLDER`. `logo_archivo` es `null`: el logo visual no está ingerido.

`qr.ruta_estable` es `/carta`. `QR_PRODUCTION` está `BLOQUEADO` y su destino es `null`. `QR_DEV` solo puede ser `http://127.0.0.1:<puerto>/carta`. El validador rechaza cualquier otra URL.

## Contacto, legal, analítica

Dirección, horario, teléfono, redes, privacidad y texto legal de publicación están vacíos. La analítica está inactiva, sin cookies. Los revisores previstos son CLO, CDAO y Growth. No hay tracker.

## Reglas del validador

- Un `POR_CONFIRMAR` no lleva nombre ni valores.
- Un `CANDIDATE_MATCH` es una pizza con nombre de la extracción y sin valores.
- Un `SOURCE_MISSING` de smash, complements o amanides lleva el nombre en null.
- Precio, ingredientes, alérgenos, descripción y foto siguen en null fuera de `CONFIRMADO`.
- Cero productos en crea, postres y begudes.
- Postres de sección en `HISTORICO`.
- `QR_PRODUCTION` sin destino. `QR_DEV` solo local hacia `/carta`.

## Fuera, a propósito

No hay combos, helados como productos, bebidas inventadas ni toppings inventados. Los prefijos `LB-POS`, `LB-BEG` y `LB-EXT` siguen reservados en el validador para cuando entre un documento real.

## Dos listas distintas

Disponible fuera y todavía no ingerido como documento: logo visual, carta vigente, carta histórica, precios visibles, ingredientes visibles, concepto visual aprobado, formato A3 vertical aprobado.

Ausente de verdad en el cliente: dominio público definitivo, catálogo de bebidas confirmado, confirmación de que postres y gelats históricos siguen vigentes, combos, matriz de alérgenos, autorización de impresión.
