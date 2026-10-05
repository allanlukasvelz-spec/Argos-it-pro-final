# Corrección lingüística V1

Base: `b34624b` en `la-bobila-menu-system`. Solo los ocho grupos confirmados. No se ha fusionado ni se ha publicado.

Santlucar no se ha tocado. Sigue literal en LB-COM-005, con su marca PENDIENTE.

Las notas de origen (`observaciones`) que citan la foto — ORIGINAL CLASSICA, ORIGINAL PARMESA, ORIGINAL COGOMBREE, «El pa de briox está en la página» — se dejan como estaban. No son el texto de la carta. Los prototipos `la-bobila/mobile/carta.html` y `la-bobila/print/carta-a3.html` también conservan la grafía anterior: no están en la lista de archivos de esta corrección. `cogombret` y el `formatge parmesà` de la amanida cèsar no se han reescrito. Los `fior di latte` que ya estaban bien tampoco.

## Inventario, antes de editar

| Id | Campo | Antes | Después |
| --- | --- | --- | --- |
| LB-BUR-001 | nombre | Classica | Clàssica |
| LB-PIZ-012 | ingrediente | parmesa | parmesà |
| LB-PIZ-016 | ingrediente | butifarra | botifarra |
| LB-PIZ-016 | ingrediente | all i oli | allioli |
| LB-BUR-001 | ingrediente | pa de brioche | pa de brioix |
| LB-BUR-002 | ingrediente | pa de briox | pa de brioix |
| LB-BUR-003 | ingrediente | pa de briox | pa de brioix |
| LB-BUR-001 | ingrediente | salsa la bòbila | salsa La Bòbila |
| LB-BUR-002 | ingrediente | salsa la bòbila | salsa La Bòbila |
| LB-AMA-003 | ingrediente | cogombree | cogombre |
| LB-PIZ-001 | ingrediente | flor di latte | fior di latte |

Cada fila está en `la-bobila/catalog/catalog.json`, en `catalogo_normalizado.json`, en la horizontal y en el interior. En las dos caras se quita la marca PENDIENTE que iba pegada a ese token. Santlucar conserva la suya.

## Lista blanca

Solo estos cambios de texto, repetidos en los dos catálogos y las dos caras:

- Classica → Clàssica
- parmesa → parmesà
- butifarra → botifarra
- all i oli → allioli
- pa de brioche → pa de brioix
- pa de briox → pa de brioix
- salsa la bòbila → salsa La Bòbila
- cogombree → cogombre
- flor di latte → fior di latte
- retirada de `<i class="pend">` cuyo `data-duda` era uno de esos tokens

UNEXPECTED_TEXT_CHANGES: 0
PRICE_DIFF: 0
CATEGORY_DIFF: 0
INGREDIENT_SEMANTIC_DIFF: 0

## Medida

No se ha editado CSS.

- PRODUCT_NAME_FONT: 3,85 mm
- Ingrediente horizontal: 2,85 mm
- PENDIENTE horizontal: 2,15 mm
- Ingrediente interior: 3,15 mm
- PENDIENTE interior: 2,30 mm
- Hueco horizontal Per compartir → Smash: 3,00 mm
- Bajo Begudes: 8,00 mm
- Hueco interior Per compartir → Smash: 65,88 mm → 66,30 mm

El hueco interior se mueve 0,42 mm. Al quitar las marcas PENDIENTE, algunas líneas ocupan menos y la página reparte el aire. No se ha encogido el tipo ni se han movido bloques para devolverlo. El bloque de Smash horizontal acaba en y 202,36 mm; en V1.1 acababa en y 204,28 mm. El hueco de 3,00 mm que lo separa de Per compartir no cambia.

OVERFLOW_COUNT: 0
LINE_WRAP_REGRESSIONS: 0
FOLD_SAFETY: PASS. Cruces 0. El sello sigue a 14,00 mm del plec.
PRICE_ALIGNMENT: PASS. En las columnas de un solo bloque la diferencia entre precios es 0,00 mm. En Pizzes y en los bloques de dos columnas, la cifra grande es la distancia entre columnas, no un precio fuera de su fila.
SECTION_ALIGNMENT: PASS. Los bordes izquierdos siguen donde estaban: horizontal complements 362,50 mm y pizzes 114,69 mm; interior complements 8,00 mm, pizzes 346,00 mm y begudes 346,00 mm.

HORIZONTAL_VISUAL_REGRESSION: no en el hueco de 3,00 mm.
VERTICAL_VISUAL_REGRESSION: el hueco interior pasa de 65,88 mm a 66,30 mm. No se corrige con maquetación.

## Pendientes que siguen

Santlucar. Y las lecturas sin confirmar: Pernil ibèric, Tonyina, Pebrot vermell, Carxofa, Xampinyons, Mozzarella fior di latte, Emmental, Formatge de cabra, Roquefort, Parmesà, Formatge feta. Cansalada sigue en SOURCE_CONFLICT, en vegetals: el conflicto es de columna, no de grafía.

LANGUAGE_GATE: PASS_WITH_PENDING

## Vistas

- `la-bobila-menu-final/04_RENDERS/carta-horizontal-language-v1.png`
- `la-bobila-menu-final/04_RENDERS/interior-language-v1.png`

No se han sobrescrito `carta-horizontal-v1.1.png` ni `interior-after.png`.

PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR
NEXT ACTION: revisión humana conjunta de horizontal e interior con los textos corregidos.
