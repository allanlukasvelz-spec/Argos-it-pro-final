STATUS:
INGESTA CONTRASTADA. No es un PASS de publicación. El logo, la carta vigente y la carta histórica están en el repositorio, byte a byte, y la vigente se contrastó dos veces antes de marcar `CONFIRMADO_SOURCE`. La A3 desborda en Crea la teva, la moneda y los alérgenos no cierran, y `QR_PRODUCTION` sigue bloqueado.

ASSETS INGESTED:
Zip, sin modificar y dejado en Downloads: `/Users/allanlukasvelz/Downloads/web pizeria/LA-BOBILA_SOURCE_ASSETS.zip`.

- LB-ASSET-LOGO-001 `la-bobila/source/logo/la-bobila-logo-reference.png` INGESTED sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`
- LB-ASSET-MENU-CURRENT-001 `la-bobila/source/menu-current/la-bobila-carta-vigente.jpeg` INGESTED sha256 `3484610b4d455e837d8c77568a155073894427d1ef06b424bcd1e2412bb54755`
- LB-ASSET-MENU-HISTORICAL-001 `la-bobila/source/menu-historical/la-bobila-carta-historica.jpeg` INGESTED sha256 `a19f86d39c9471e2517a9d9f3e1bb279538b5535bc608998874b5575e5f59193`
- Fotos: FILE_NOT_INGESTED. El zip no trae ninguna. sha256 null. No hay logos de Argos IT ni facturas en el zip.

LOGO AUDIT:
PNG 1600×863, RGB, sin alfa. Wordmark, tomate y rama. OCR en dos pases: «• DESDE 2005 •» y «- PIZZERIA ARTIGIANALE -». El acento de Ò no sale en el OCR. El wordmark de la lámina sigue en PLACEHOLDER. No se ha pegado el PNG. Detalle en `docs/LA-BOBILA-BRAND-AUDIT.md`.

COLOR SAMPLING:
Provisional, sin sustituir, frente a la mediana de la copia:

- Marfil `#F3EEE4` / muestreado `#FAF0E7`
- Verde `#1E3A32` / tinta `#202B17`
- Terracota `#C15B3A` / tomate `#8E4A30`
- Oliva `#6E7A45` / rama `#6C7153`

CURRENT MENU:
PASS de transcripción. 17 pizzas, 4 smash, 11 complements y 3 amanides detectadas y confirmadas en nombre. Precios confirmados: 35 platos, más la base 12,00 y los suplementos de grupo 1 / 0,50 / 1. Ingredientes confirmados en 30 platos. Cinco complements no traen línea aparte. Doce líneas del pie de Crea la teva no cierran. Las 17 candidatas son MATCH. Ninguna queda en CANDIDATE_MATCH.

HISTORICAL MENU:
PASS parcial. Nombres leídos y diferencias cerradas donde dos bandas coinciden: base 10,00 frente a 12,00, Piera con tonyina frente a sobrassada, Verdura con tonyina, Miss Smash de mini discs frente a carn picada, gelats a 6,90 con sabores ilegibles, grupo de salses que la foto vigente no enseña. No se han copiado a la carta vigente. Diff en `docs/LA-BOBILA-MENU-DIFF.md`.

CATALOG:
62 filas vigentes / 50 confirmadas / 12 por confirmar / 6 históricas fuera de `productos` / 0 source missing. Conflictos de dato: los de abajo. Versión 0.4.0.

PRICES:
35 platos confirmados de 35 platos con precio en la foto, más 4 precios de grupo. 12 toppings en revisión sin precio de línea. 0 rellenados por patrón.

INGREDIENTS:
30 listas confirmadas / 35 platos con nombre cerrado. Los otros 5 no tienen lista en la foto. Los 12 toppings en revisión no tienen lista.

ALLERGENS:
Capa legal vacía, `POR_CONFIRMAR`. Nada inferido se publica.

DATA CONFLICTS:
- Logo «DESDE 2005» y «PIZZERIA ARTIGIANALE» frente al encargo «Des de 2005» y «Pizzeria artesana».
- Prosciutto lee FLOR DI LATTE. Napolitana no cierra FLOR/FIOR. Gorgonzola lee BACON y el resto BACÓ. Carbonara lee PARMESA. Amanida verda lee COGOMBREE y la smash COGOMBRET. Santlucar va sin acento.
- Cansalada está en la columna de verdura. SOURCE_CATEGORY vegetals. NORMALIZED_CATEGORY carn. REVIEW_REQUIRED. No se ha movido.
- La Bòbila de luxe: un recorte cortó el 1 y leyó 3,50. Página y recorte ancho leen 13,50. Publicado 13,50.
- 6 Formatges: la histórica sugiere 13,90 y la vigente lee 15,90. No cerrado.
- El pie de formatges de la foto vigente no se lee.

A3:
OVERFLOW. Pizzes PASS. Amanides PASS. Postres y begudes PASS, sin filas. Smash TIGHT. Complements TIGHT. Crea la teva OVERFLOW (85,7 mm de lista en 37,9 mm). No se ha bajado el tipo. La fila de la A3 no pinta ingredientes.

MOBILE:
PARTIAL. `/carta` regenerada, con precios e ingredientes, sin signo de euro, sin gelats, alérgenos en «Per confirmar», begudes vacía. A 390 px y a 1280 px no hay scroll horizontal. No hay pase de dispositivo del QR, así que no es PASS.

QR P0:
BLOQUEADO. `QR_PRODUCTION` sin destino. En la lámina solo está `QR_DEV` hacia `http://127.0.0.1:4173/carta`. No se imprime. No se publica.

DENSITY REPORT:
`docs/LA-BOBILA-DENSITY-REPORT.md`. Conjunto A3: OVERFLOW por Crea la teva.

MULTITALK REVIEW:
CEO: el archivo ya es La Bòbila, y la lámina todavía no lleva ese logo. «DESDE» y «ARTIGIANALE» no se pueden dar por el eslogan del encargo.
CPO: las 17 pizzas y el resto de platos con precio ya salen de una sola foto. Crea la teva no cabe y el pie de quesos no se lee.
COO: el personal puede leer la carta vigente en el repo. No puede dar por bueno un topping que el OCR no cierra, ni un helado histórico.
CFO: hay 35 precios contrastados y ninguno inventado por serie. La moneda no está autorizada para pintarse. No hay margen que cerrar.
CSO: la paleta provisional no es el muestreo. No se ha movido un hex. Bien.
CRO: no hay destacados ni packs. Correcto. El desborde de Crea la teva esconde suplementos, y eso sí es un problema de venta.
CDAO: una fuente, hashes, histórico aparte. Cansalada no se ha reclasificado en silencio.
CLO: alérgenos, contacto y legal siguen vacíos. Publicar o imprimir seguiría siendo indebido.
Head of Product Design: no hay rediseño. El tipo no se ha encogido. OVERFLOW se informa.
CTO: `/carta` y el bloqueo de `QR_PRODUCTION` se mantienen. La ruta no ha cambiado.
Chief of Staff: la ingesta de archivos está hecha. La publicación no. El siguiente paso no es pedir que reescriban la carta.

BLOCKERS P0:
- `QR_PRODUCTION` sin dominio. No generar, no imprimir, no publicar.
- Matriz legal de alérgenos ausente.
- A3 OVERFLOW en Crea la teva. No se fuerza el encaje.

BLOCKERS P1:
- Cierre de moneda para pintar el signo.
- Cierre de «Des de 2005» frente a «DESDE 2005» y de «artesana» frente a «artigianale».
- Doce líneas del pie, cansalada incluida, y el grupo de salses que solo se ve en la histórica.
- Logo raster. Hace falta vector o un PNG mayor si se quiere en portada.
- Smash TIGHT y complements TIGHT, por unos píxeles.
- Pase de dispositivo del QR.

DATA ACTUALLY MISSING FROM CLIENT:
Dominio público, autorización de impresión, matriz de alérgenos, horario, teléfono, dirección, bebidas, si los gelats siguen vigentes, si el grupo de salses sigue, un máster de logo que no sea este PNG, y una foto del pie de formatges donde se lean los quesos. No hace falta reescribir los platos que ya están en las dos fotos. No hace falta un logo nuevo.

SOURCE PROVENANCE:
PASS para los tres archivos ingeridos. Los hashes coinciden con el zip.

FILES CREATED:
docs/LA-BOBILA-BRAND-AUDIT.md
docs/LA-BOBILA-MENU-CURRENT-TRANSCRIPTION.md
docs/LA-BOBILA-MENU-HISTORICAL-TRANSCRIPTION.md
docs/LA-BOBILA-MENU-DIFF.md
la-bobila/source/logo/la-bobila-logo-reference.png
la-bobila/source/menu-current/la-bobila-carta-vigente.jpeg
la-bobila/source/menu-historical/la-bobila-carta-historica.jpeg
las tres copias homónimas en la-bobila/processed/

FILES MODIFIED:
docs/LA-BOBILA-STATUS.md
docs/LA-BOBILA-DENSITY-REPORT.md
docs/LA-BOBILA-DATA-MODEL.md
docs/LA-BOBILA-DECISIONS.md
.cursor/rules/la-bobila-multitalk.md
la-bobila/README.md
la-bobila/source/README.md
la-bobila/source/manifest/assets.json
la-bobila/catalog/catalog.json
la-bobila/catalog/validate.mjs
la-bobila/print/components.mjs
la-bobila/print/carta.css
la-bobila/print/carta-a3.html
la-bobila/print/export.mjs
la-bobila/print/renders/carta-a3.pdf
la-bobila/print/renders/carta-a3.png
la-bobila/mobile/components.mjs
la-bobila/mobile/render.mjs
la-bobila/mobile/carta.html

NEXT ACTION:
Cerrar con el cliente solo lo que la foto no dice: moneda en la lámina, alérgenos, el eslogan del logo, cansalada, el pie de quesos y si los gelats o las salses siguen. No reescribir la carta. No imprimir. No generar `QR_PRODUCTION`. Si se quiere que Crea la teva quepa en la A3, es una decisión de retícula, no una reducción de tipo.
