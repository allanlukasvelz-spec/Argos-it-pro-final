# La Bòbila — modelo de datos

Fecha: 2026-09-22. Versión de catálogo: 0.4.0. Fuente ejecutable: `la-bobila/catalog/catalog.json`. El validador está en `la-bobila/catalog/validate.mjs`. Lo usan la A3 y `/carta`. Los originales viven en `la-bobila/source/` y se registran en `la-bobila/source/manifest/assets.json`.

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
| `CONFIRMADO_SOURCE` | Hecho contrastado dos veces contra el archivo ingerido. En el precio vive en `precio.status`. La fila de producto, si el nombre también cuadra, está en `CONFIRMADO`. |
| `HISTORICO` | Carta o estado anterior. No entra solo en la carta vigente ni en `/carta`. |
| `PROPUESTA_ARGOS` | Texto nuestro, no un dato del negocio. |
| `DESCARTADO` | Se conserva la traza y no se muestra. Hoy no hay filas. |

`null` en precio, ingredientes, alérgenos, descripción o foto significa que ese valor no está en el catálogo. No sustituye al estado de la fila.

## Qué hay ahora

La carta vigente está ingerida. El catálogo 0.4.0 sale de esa foto.

| Grupo | Filas | Estado | Nombre |
| --- | --- | --- | --- |
| Pizzes `LB-PIZ-001` … `017` | 17 | `CONFIRMADO` | Las 17 candidatas coinciden con la foto. Precio e ingredientes con `CONFIRMADO_SOURCE` |
| Smash `LB-BUR-001` … `004` | 4 | `CONFIRMADO` | Classica, La Bòbila de luxe, Cheese burger trufat, Pollo aguacate burger |
| Complements `LB-COM-001` … `011` | 11 | `CONFIRMADO` | Los 11 nombres de la columna |
| Amanides `LB-AMA-001` … `003` | 3 | `CONFIRMADO` | Cèsar, grega, verda |
| Crea la teva `LB-EXT-*` | 27 | 15 `CONFIRMADO`, 12 `REVIEW_REQUIRED` | Base 12,00 y extras de grupo. El pie de formatges no se lee. Cansalada sigue en la columna de verdura, en revisión |
| Postres | 0 en `productos` | sección `HISTORICO` | Los gelats están en `historico`, no en la carta vigente |
| Begudes | 0 | sección `POR_CONFIRMAR` | La foto no trae bebidas |
| Combos | 0 | — | No están en la foto |

El precio vigente es `{ value, currency: null, source, status: CONFIRMADO_SOURCE, original }`. `currency` es null porque la moneda global sigue `POR_CONFIRMAR`: el archivo muestra el signo y la lámina no lo pinta. `historico` no lo lee el renderer. Un alérgeno legal no se infiere de un ingrediente.

## Marca y QR

`marca.nombre`, tipo y «Des de 2005» siguen en el encargo. `marca.wordmark` es `PLACEHOLDER`: el PNG ingerido no se pega en la cabecera. `logo_archivo` apunta al máster. El OCR del archivo lee «DESDE 2005» y «PIZZERIA ARTIGIANALE»; no sustituye el encargo.

`qr.ruta_estable` es `/carta`. `QR_PRODUCTION` está `BLOQUEADO` y su destino es `null`. `QR_DEV` solo puede ser `http://127.0.0.1:<puerto>/carta`. El validador rechaza cualquier otra URL.

## Contacto, legal, analítica

Dirección, horario, teléfono, redes, privacidad y texto legal de publicación están vacíos. La analítica está inactiva, sin cookies. Los revisores previstos son CLO, CDAO y Growth. No hay tracker.

## Reglas del validador

- Un `POR_CONFIRMAR` no lleva nombre ni valores.
- Un `CANDIDATE_MATCH` es una pizza con nombre de la extracción y sin valores.
- Un `SOURCE_MISSING` de smash, complements o amanides lleva el nombre en null.
- Precio, ingredientes, alérgenos, descripción y foto siguen en null fuera de `CONFIRMADO`, `CONFIRMADO_SOURCE` e `HISTORICO`.
- Un precio confirmado es un objeto con `value` numérico, `status: CONFIRMADO_SOURCE` y `currency` null.
- Crea la teva admite toppings solo si `fuente` es `LB-ASSET-MENU-CURRENT-001`.
- Cero productos vigentes en postres y begudes.
- Postres de sección en `HISTORICO`. `catalog.historico` no se pinta.
- `QR_PRODUCTION` sin destino. `QR_DEV` solo local hacia `/carta`.

## Fuera, a propósito

No hay combos, helados vigentes ni bebidas inventadas. `LB-EXT` numera los toppings leídos en la foto. `LB-POS` y `LB-BEG` siguen sin filas vigentes.

## Dos listas distintas

Ya ingerido: logo, carta vigente, carta histórica. Precios e ingredientes vigentes están en el catálogo cuando el doble contraste cerró. Fotos de producto: el zip no las trae.

Ausente de verdad en el cliente: dominio público, cierre de la moneda en la lámina, matriz de alérgenos, si los gelats históricos siguen vigentes, si el grupo de salses sigue en la carta, bebidas, combos, horario, teléfono, dirección, y un máster de logo vectorial. El pie de formatges de la foto vigente no se lee.
