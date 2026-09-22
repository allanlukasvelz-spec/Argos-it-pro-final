# La Bòbila — modelo de datos

Fecha: 2026-09-22. Versión de catálogo: 0.2.0. Fuente ejecutable: `la-bobila/catalog/catalog.json`. El validador está en `la-bobila/catalog/validate.mjs`. Lo usan la A3 y `/carta`.

## Una sola fuente

Impresión, carta móvil y QR salen de este JSON. No hay `catalog-mobile.json`, `catalog-print.json` ni `menu-data.json`. El HTML generado no se edita.

## Estados

| Estado | Significado |
| --- | --- |
| `CONFIRMADO` | Dato contrastado. Solo entonces se pinta como hecho. |
| `POR_CONFIRMAR` | El cliente no lo ha confirmado. |
| `SOURCE_MISSING` | Existe fuera del repositorio. El documento fuente no está ingerido. No significa que no exista. |
| `HISTORICO` | Referencia antigua. No se da por vigente. |
| `PROPUESTA_ARGOS` | Texto nuestro, no un dato del negocio. |
| `DESCARTADO` | Se conserva la traza y no se muestra. Hoy no hay filas. |

`null` en precio, ingredientes, alérgenos, descripción o foto significa que ese valor no está en el catálogo. No sustituye al estado de la fila.

## Qué hay ahora

No es el catálogo definitivo.

| Grupo | Filas | Estado | Nombre |
| --- | --- | --- | --- |
| Pizzes `LB-PIZ-001` … `017` | 17 | `SOURCE_MISSING` | El de la extracción textual |
| Smash `LB-BUR-001` … `004` | 4 | `SOURCE_MISSING` | null. El recuento se conoce; el nombre no |
| Complements `LB-COM-001` … `011` | 11 | `SOURCE_MISSING` | null. Igual |
| Amanides `LB-AMA-001` … `003` | 3 | `SOURCE_MISSING` | null. Igual |
| Crea la teva | 0 | etiquetas solo | Base pizza, Carn, Vegetals, Formatges |
| Postres | 0 | sección `HISTORICO` | Nota de postres y gelats. No se asume vigencia |
| Begudes | 0 | sección `POR_CONFIRMAR` | El cliente no ha confirmado el catálogo |
| Combos | 0 | — | No confirmados. No se añaden |

Fuente de las filas `SOURCE_MISSING`: `extraccion-textual-2026-09-22-sin-documento`. Precio, ingredientes, alérgenos, descripción y foto en `null`. `destacado` es `false`. Esas pizzas no están marcadas `CONFIRMADO`.

## Marca y QR

`marca.nombre`, tipo y «Des de 2005» siguen `CONFIRMADO` por el encargo. `marca.wordmark` es `PLACEHOLDER`. `logo_archivo` es `null`: el logo visual no está ingerido.

`qr.ruta_estable` es `/carta`. `QR_PRODUCTION` está `BLOQUEADO` y su destino es `null`. `QR_DEV` solo puede ser `http://127.0.0.1:<puerto>/carta`. El validador rechaza cualquier otra URL.

## Contacto, legal, analítica

Dirección, horario, teléfono, redes, privacidad y texto legal de publicación están vacíos. La analítica está inactiva, sin cookies. Los revisores previstos son CLO, CDAO y Growth. No hay tracker.

## Reglas del validador

- Un `POR_CONFIRMAR` no lleva nombre ni valores.
- Un `SOURCE_MISSING` puede llevar el nombre extraído en pizzas, y debe llevarlo en null en smash, complements y amanides.
- Precio, ingredientes, alérgenos, descripción y foto siguen en null fuera de `CONFIRMADO`.
- Cero productos en crea, postres y begudes.
- Postres de sección en `HISTORICO`.
- `QR_PRODUCTION` sin destino. `QR_DEV` solo local hacia `/carta`.

## Fuera, a propósito

No hay combos, helados como productos, bebidas inventadas ni toppings inventados. Los prefijos `LB-POS`, `LB-BEG` y `LB-EXT` siguen reservados en el validador para cuando entre un documento real.

## Dos listas distintas

Disponible fuera y todavía no ingerido como documento: logo visual, carta vigente, carta histórica, precios visibles, ingredientes visibles, concepto visual aprobado, formato A3 vertical aprobado.

Ausente de verdad en el cliente: dominio público definitivo, catálogo de bebidas confirmado, confirmación de que postres y gelats históricos siguen vigentes, combos, matriz de alérgenos, autorización de impresión.
