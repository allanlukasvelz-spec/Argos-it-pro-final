# Corrección visual V1

Corrección quirúrgica sobre la auditoría `la-bobila-menu-final/05_QA/visual-forensic-audit-v1.md`. No es un rediseño. No se ha añadido contenido, no se ha fusionado y no se ha publicado.

Los renders auditados siguen como BEFORE: `04_RENDERS/carta-horizontal-preview.png`, `interior-preview.png`, `portada-preview.png`, `contraportada-preview.png`, `carta-vertical-preview.png` y los PDF del mismo directorio. Las vistas AFTER son archivos nuevos.

Medida de trabajo, sin cambiar: retall horizontal 483 × 329 mm, archivo 489 × 335 mm; retall vertical 329 × 483 mm, archivo 335 × 489 mm; doble página 664 × 489 mm, plec en x 332 mm; sangre 3 mm. PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR. Sello: PROTOTIPO / REVISIÓN / PENDIENTE.

Catálogo, HTML, nombres, ingredientes, precios, categorías, logo, paleta, familias tipográficas, ilustraciones, orden de secciones, opacidad de la pizza, filete y laureles: sin cambios.

## 1. Hueco interior entre Per compartir y Smash

ISSUE: HIGH. En el interior, Smash quedaba separado de Per compartir por un hueco estructural de 253,90 mm (`margin-top: auto` en `.zone--second`).

BEFORE: 253,90 mm. Complements y 84,8–156,8 mm. Smash y 410,7–449,8 mm.

ACTION: Redistribuir los bloques que ya existían. `.page` pasa a `justify-content: space-between`. `.zone--second` y `.zone--close` dejan `margin-top: auto`. `.zone--crea` deja el margen extra de 5 mm. No se añade tipo, dibujo ni plato. El orden sigue: Amanides, Plats del dia, Per compartir, Smash, Postres.

AFTER: 65,88 mm. Complements y 210,10–282,12 mm. Smash y 348,00–387,13 mm. El hueco único de 253,90 mm desaparece. Los 65,88 mm que quedan son el resto repartido entre bloques existentes, no un `margin-top: auto`.

FILES_CHANGED: `la-bobila-menu-final/03_VERTICAL/carta-vertical.css`

REGRESSION: Ninguna de datos ni de plec. El elemento más cercano al plec sigue siendo el sello, a 14,00 mm. Cruces del plec: 0.

RESULT: RESUELTO

## 2. Vacío bajo Begudes

ISSUE: MEDIUM. Bajo Begudes, en la página derecha del interior, quedaban 210,9 mm sin uso. Begudes no tiene bebidas en el catálogo.

BEFORE: 210,9 mm. Zona y 250,1–278,1 mm. Archivo 489 mm.

ACTION: La misma recomposición. Begudes, sin clase de cierre y sin productos, baja con el reparto de la página y se queda en el pie. No se inventan bebidas ni se copian ítems históricos. La zona vacía se encoge y sigue reconocible, con su título de lectura y la marca PENDIENTE.

AFTER: 8,00 mm. Zona y 453–481 mm, alto 28 mm. Archivo 489 mm. Los 8,00 mm son el padding inferior de la página.

FILES_CHANGED: `la-bobila-menu-final/03_VERTICAL/carta-vertical.css`

REGRESSION: Ninguna. Postres, en la página izquierda, queda en la misma banda y 453–481 mm, también vacío.

RESULT: RESUELTO

## 3. Hueco horizontal entre Per compartir y Smash

ISSUE: MEDIUM. En la columna derecha de la horizontal, 117,37 mm vacíos entre Per compartir y Smash por el mismo `margin-top: auto`.

BEFORE: 117,37 mm. Complements bottom 124,3 mm. Smash top 241,7 mm.

ACTION: `.zone--second { margin-top: 0 }`. Smash sigue a Per compartir. No cambia el orden ni ningún dato. El aire que sobra queda debajo de Smash y encima de la banda de Postres y Begudes.

AFTER: 3,00 mm. Complements y 25,20–128,19 mm. Smash y 131,19–225,02 mm. La separación medida es el hueco de columna. Debajo de Smash, hasta el pie en y 306,50 mm, quedan 81,48 mm. Ese resto no se rellena.

FILES_CHANGED: `la-bobila-menu-final/02_HORIZONTAL/carta-horizontal.css`

REGRESSION: Ninguna de datos. El texto no sale de la hoja (`outside` 0) ni entra en el retall (`trimHits` 0).

RESULT: RESUELTO

## 4. Cuerpo del ingrediente

ISSUE: MEDIUM. El ingrediente horizontal medido en la auditoría es el cuerpo de `.ings`, 2,85 mm, no una distancia al borde. El texto ya estaba a 5 mm o más del retall.

BEFORE: 2,85 mm (`font-size`), interlineado 3,55 mm. En Smash, 3,00 mm / 3,75 mm.

ACTION: Subir `.ings` y `.zone--second .ings` a 5 mm. El texto no se edita. 8 mm, el tamaño preferible, no cabe: un interlineado de 6,2 mm ya empujaba «Olives negres» por debajo del retall. El interlineado enviado es 5,25 mm y el margen de fila 0,7 mm, para mantener el cuerpo en 5 mm sin desborde. El lead sigue en 8,40 mm y el título de Smash en 6,10 mm.

AFTER: 5,00 mm (`fontSize` calculado 5), interlineado 5,25 mm. Crea termina en y 298,71 mm. El pie empieza en y 306,50 mm. Holgura 7,79 mm.

FILES_CHANGED: `la-bobila-menu-final/02_HORIZONTAL/carta-horizontal.css`

REGRESSION: LOW. El ingrediente horizontal (5,00 mm) queda por encima del nombre de producto (3,85 mm). Subir los nombres por encima de 5 mm desbordaría la holgura de 7,79 mm. La jerarquía de sección no cambia: Pizzes 8,40 mm, Smash 6,10 mm, el resto de títulos 5,00 mm. En el interior, `.ings` sigue en 3,15 mm: esa cifra no era la medida autorizada de 2,85 mm y no se ha tocado.

RESULT: RESUELTO en el mínimo de 5,00 mm. 8 mm no aplicado.

## 5. Marca PENDIENTE

ISSUE: MEDIUM. La marca PENDIENTE horizontal medida en la auditoría es el cuerpo de `.pend`, 2,15 mm. No se oculta, no se borra y no se sustituye.

BEFORE: 2,15 mm, `line-height: 1`.

ACTION: `.pend` a 5 mm, interlineado 5,6 mm, `vertical-align: 0`. Misma familia, peso 600 y color terracota. 8 mm no cabe sin el desborde ya visto en el ingrediente.

AFTER: 5,00 mm (`fontSize` calculado 5), interlineado 5,6 mm. Sigue visible junto a las lecturas no confirmadas.

FILES_CHANGED: `la-bobila-menu-final/02_HORIZONTAL/carta-horizontal.css`

REGRESSION: LOW, la misma inversión de cuerpo respecto al nombre de 3,85 mm. En el interior, `.pend` sigue en 2,30 mm: no era la medida de 2,15 mm y no se ha tocado.

RESULT: RESUELTO en el mínimo de 5,00 mm. 8 mm no aplicado.

## Lo que no se ha tocado

LOGO_MASTER_SEARCH: no hay SVG, EPS, AI ni TIFF del logo de La Bòbila. El PNG de presentación (`la-bobila/processed/logo/la-bobila-logo-presentation.png`, sha256 `ba7b0648ac45efafd698510dc0d2c69782fcf41d320cadd6759e0bd77b918113`, 1600 × 863) no es un máster de más resolución. Los favicon de Argos no son este logo. No se sustituye nada.

LOGO_RESOLUTION_REVIEW_REQUIRED. El hash del máster sigue `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc` en `la-bobila/source/logo/la-bobila-logo-reference.png` y en la copia `la-bobila/processed/logo/la-bobila-logo-reference.png`. La portada no se ha reexportado. El logo de portada sigue a 178 ppi.

Pizza que entra en Crea al 14 %: ACCEPTED_AS_IS_PENDING_FINAL_VISUAL_REVIEW. No se ha movido, borrado ni cambiado de opacidad.

Filete y laureles cerca del corte: DECORATIVE_TRIM_PROXIMITY_ACCEPTED_FOR_NOW. No se han movido.

## Puertas

DATA_INTEGRITY: PASS
NAME_DIFF: 0
PRICE_DIFF: 0
INGREDIENT_DIFF: 0
CATEGORY_DIFF: 0
FOLD_SAFETY: PASS. Cruces 0. Más cercano al plec: sello, 14,00 mm.
OVERFLOW_COUNT: 0. `outside` 0, `trimHits` 0, `wrapped` 0. Las uniones de caja de los ingredientes en línea son el mismo falso positivo de la auditoría (la caja de un salto de línea, no un glifo encima de otro). El contacto de 0,67 mm entre el nombre y el primer ingrediente es la caja de línea de PENDIENTE a 5 mm, no un recorte.
LOGO_INTEGRITY: PASS
UNSUPPORTED_CLAIMS: 0. Sin euro visible, risotto, free gluten, massa mare, forn, 48 h ni «25 años».

## Medidas

- 253,90 mm → 65,88 mm
- 210,90 mm → 8,00 mm
- 117,37 mm → 3,00 mm
- 2,85 mm → 5,00 mm
- 2,15 mm → 5,00 mm

## Vistas AFTER

- `la-bobila-menu-final/04_RENDERS/carta-horizontal-after.png`
- `la-bobila-menu-final/04_RENDERS/interior-after.png`
- `/cursor/stores/bc-70d42429-279a-4600-b0fd-616ef926aa11/media/audit-v1-horizontal-after.png`
- `/cursor/stores/bc-70d42429-279a-4600-b0fd-616ef926aa11/media/audit-v1-vertical-after.png`

Los prototipos V2, V3 y V4 siguen en `la-bobila/print/renders/` y no son este documento.

BLOCKERS: 0
HIGH: 0
MEDIUM: 0 en los cinco puntos autorizados. El logo de portada a 178 ppi sigue abierto y no se ha corregido: LOGO_RESOLUTION_REVIEW_REQUIRED.
LOW: 1 introducida por esta corrección (ingrediente horizontal 5,00 mm por encima del nombre 3,85 mm). Los dos LOW de la auditoría (pizza en Crea, adorno junto al corte) siguen aceptados y sin tocar.
CORRECTION_GATE: PASS
PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR
NEXT ACTION: revisión comparativa, y después autorización humana. No se abre otra fase.
