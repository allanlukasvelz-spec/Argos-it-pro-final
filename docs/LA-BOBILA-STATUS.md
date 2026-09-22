STATUS:
PROTOTIPO EDITORIAL V1. No es carta final, ni imprenta, ni producción. INGESTION_GATE PASS. DATA_PROVENANCE_GATE PASS. EDITORIAL_ARCHITECTURE_GATE PASS (0 OVERFLOW). BRAND_GATE PARTIAL. ALLERGEN_GATE, QR_PRODUCTION_GATE, PRINT_GATE y PUBLICATION_GATE siguen BLOCKED.

PROVENANCE FIX: PASS
Los tres precios de `catalog.historico` (base 10,00, salses 1,00, gelats 6,90) citan ahora `LB-ASSET-MENU-HISTORICAL-001`. Ningún registro histórico cita la carta vigente. Ningún precio `CONFIRMADO_SOURCE` cita la histórica. El test `la-bobila/catalog/provenance.test.mjs` falla si el cruce vuelve. No se ha borrado ninguna fila histórica.

LOGO INTEGRATION: PASS
El máster no se ha tocado. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. La cabecera y `/carta` usan la copia de presentación con alfa, trazable al máster. El wordmark tipográfico deja de ser la identidad primaria y sigue en `PLACEHOLDER`. «DESDE 2005» y «PIZZERIA ARTIGIANALE» no se reescriben: viven en el píxel.

PALETTE STUDY: A y B generadas. C no existe.
A: marfil `#F3EEE4`, verde `#1E3A32`, terracota `#C15B3A`, oliva `#6E7A45`. Terracota 3,76:1 y oliva 4,01:1, por debajo de 4,5:1 en texto pequeño.
B: marfil `#FAF0E7`, tinta `#202B17`, tomate `#8E4A30`, rama `#6C7153`. Tinta 13,16, tomate 5,89, rama 4,53. La rama queda justa en papel no estucado.
No hay ganadora. Los tokens no se han sustituido. `/carta` sigue en la paleta provisional. El prototipo prueba la candidata B y lo dice en la lámina.

CREA LA TEVA: A, B y C medidas con cuerpo 3,6 mm e interlínea 1,35 (4,86 mm), 27 nombres, ancho 271 mm.
A — cuatro columnas. Alto 109,6 mm. Vegetals 78,7 mm. Distancia nombre–precio 6,6 mm. La pila se sale 12,2 mm. OVERFLOW.
B — 2×2. Alto 166,4 mm. Vegetals sigue en 78,7 mm. Distancia 38,5 mm. La pila se sale 69,1 mm. OVERFLOW.
C — banda de precios en 6 columnas y lista completa en la misma A3. Alto 72,4 mm. Carn 1 línea, vegetals 2, formatges 1. Distancia 12,9 mm. La pila cierra a 16 mm del borde. PASS.

SELECTED ARCHITECTURE: C
A se rechaza porque desborda 12,2 mm con el mismo tipo: cerrarlo comería el aire de la pizza o el cuerpo. B se rechaza porque desborda 69,1 mm y aleja el precio. C es la única que cabe, conserva la lista entera fuera del QR, deja la pizza por delante (zona 60,9 mm frente a 32,8 mm de smash) y no baja el tipo. El detalle está en `docs/LA-BOBILA-CREATE-YOUR-PIZZA-STUDY.md`.

A3: PASS
0 OVERFLOW. Etiquetada EDITORIAL PROTOTYPE V1, con `PROVA / NO IMPRIMIR`. No es prueba de imprenta.

DENSITY V2:
Pizzes 17, 60,9 / 42,5 mm, 70 %, 4,1 mm, PASS. Crea la teva 27, banda 72,4 mm, cuerpo 3,6 mm, máximo 2 líneas, PASS. Smash 4, 32,8 / 25,7 mm, 78 %, PASS. Complements 11, 78,6 / 72,1 mm, 92 %, PASS: el resto es la cabecera, no hay recorte. Amanides 3, 19,1 mm dentro de 78,6 mm, PASS. Postres y begudes, 0 ítems, nota de sección, PASS. Informe: `docs/LA-BOBILA-DENSITY-REPORT.md`.

MOBILE: PASS en 320 / 360 / 390 / 430
Sin scroll horizontal. Nav sticky de salto. Objetivos medidos ≥ 44 px. Nombres e ingredientes largos parten. Crea la teva sale del catálogo. Contraste de títulos 10,6:1 con la paleta provisional. El precio en oliva provisional queda en 4,01:1: no se ha cambiado el token para disimularlo. No hay pase físico del QR.

QR DEV:
Sigue en `http://127.0.0.1:4173/carta`, solo en el HTML oculto y dentro del código. No se pinta como arte. La lámina lleva `PROVA / NO IMPRIMIR`. El módulo «La carta al teu mòbil» sigue aparte y no parece una prueba de imprenta. Una build con `LA_BOBILA_BUILD=production` falla: el guard se ha ejecutado y el test está en verde.

QR PRODUCTION: BLOCKED
Destino null. Estado `BLOQUEADO`. No se genera. No se imprime. No se publica.

ALLERGEN ARCHITECTURE:
Opción 3, híbrida, recomendada por CLO. Marcas neutras, sin nombre de alérgeno y sin plato asignado, en la A3 y en `/carta`. Cuando exista la matriz, el detalle por plato irá a `/carta` y la lámina guardará la leyenda. Opciones 1 y 2 se apartan: el icono junto al plato parecería una declaración, y dejar la A3 muda no avisa de que la matriz falta. La capa legal sigue vacía.

FILES CREATED:
docs/LA-BOBILA-CREATE-YOUR-PIZZA-STUDY.md
la-bobila/catalog/provenance.test.mjs
la-bobila/print/chrome-sheet.mjs
la-bobila/print/measure.mjs
la-bobila/print/production-guard.mjs
la-bobila/print/production-guard.test.mjs
la-bobila/print/renders/carta-a3-editorial-v1.pdf
la-bobila/print/renders/carta-a3-editorial-v1.png
la-bobila/print/renders/palette-comparison-a.png
la-bobila/print/renders/palette-comparison-b.png
la-bobila/processed/logo/la-bobila-logo-presentation.png

FILES MODIFIED:
docs/LA-BOBILA-BRAND-AUDIT.md
docs/LA-BOBILA-DATA-MODEL.md
docs/LA-BOBILA-DECISIONS.md
docs/LA-BOBILA-DENSITY-REPORT.md
docs/LA-BOBILA-MENU-DIFF.md
docs/LA-BOBILA-STATUS.md
la-bobila/README.md
la-bobila/catalog/catalog.json
la-bobila/catalog/validate.mjs
la-bobila/mobile/carta.css
la-bobila/mobile/carta.html
la-bobila/mobile/check.mjs
la-bobila/mobile/components.mjs
la-bobila/mobile/render.mjs
la-bobila/mobile/server.mjs
la-bobila/print/carta-a3.html
la-bobila/print/carta.css
la-bobila/print/components.mjs
la-bobila/print/export.mjs
la-bobila/print/render.mjs
la-bobila/print/renders/carta-a3.pdf
la-bobila/print/renders/carta-a3.png
la-bobila/source/manifest/assets.json

MULTITALK REVIEW:
CEO: el archivo ya es la cabecera. «Pizzeria artesana» no está dentro del logo: es copy de proyecto y va marcado. No se publica.
CSO: no hay paleta ganadora. B se prueba porque pasa el contraste y se parece al logo. A no sirve para precio pequeño. Los tokens no se han movido.
CPO: la lista de Crea la teva cabe entera en la A3. Lo que no se lee sigue en revisión. 6 Formatges permanece en 15,90.
COO: el personal puede tomar el pedido con la lámina sola. No puede confirmar un topping en cursiva ni un alérgeno.
CFO: la moneda no se pinta. Los decimales siguen. No hay margen que cerrar ni conflicto inventado entre el 15,90 vigente y el 13,90 histórico.
CRO: el suplemento está en la banda y junto al grupo. El desborde que escondía vegetals ya no está. No hay packs ni destacados.
CDAO: la procedencia vuelve a PASS. Histórico e vigente no se citan cruzados. Una sola fuente.
CLO: la arquitectura de alérgenos no rellena la matriz. Imprimir o publicar seguiría siendo indebido. El QR de producción sigue prohibido.
Head of Product Design: C es la única arquitectura que cierra sin encoger el tipo. La pizza conserva el aire. La rama de B está justa en el tipo pequeño: por eso no se corona.
Customer Success: en el móvil, a 320 px, el salto de categoría es sticky, el objetivo mide 44 px y el nombre largo parte. Falta el pase del teléfono real.
CTO: el guard de producción rechaza localhost. `/carta` sigue saliendo de `catalog.json`.
Chief of Staff: el prototipo está rotulado y no se imprime. El siguiente paso no es elegir la paleta por nuestra cuenta ni generar `QR_PRODUCTION`.

BLOCKERS P0:
- `QR_PRODUCTION` sin dominio. No generar, no imprimir, no publicar.
- Matriz legal de alérgenos ausente.
- La lámina es un prototipo. PRINT_GATE y PUBLICATION_GATE siguen cerradas.

BLOCKERS P1:
- Decisión de paleta. B se prueba; no está elegida. La oliva provisional del móvil queda en 4,01:1.
- Cierre del cliente sobre el copy «Des de 2005» / «Pizzeria artesana» frente al texto del archivo.
- Autorización para pintar el signo. Hoy `EUR_PENDING_PRESENTATION`.
- Doce lecturas inestables, cansalada en vegetals, pie de formatges ilegible, y si gelats o salses siguen.
- Máster vectorial solo si el logo tiene que ocupar más que esta cabecera.
- Pase físico del QR.

DATA STILL REQUIRED:
Dominio público, autorización de impresión, matriz de alérgenos, horario, teléfono, dirección, bebidas, si los gelats siguen vigentes, si el grupo de salses sigue, y una foto del pie de formatges donde se lean los quesos. No hace falta reescribir los platos ya contrastados. No hace falta declarar una paleta ganadora para seguir.

NEXT ACTION:
Revisión del prototipo con el cliente, sin imprimir y sin publicar. Cerrar solo lo que la foto no dice: el signo en la lámina, la matriz de alérgenos, y si el copy de proyecto se queda al lado del logo. No bajar el tipo. No generar `QR_PRODUCTION`. No sustituir los tokens hasta una decisión explícita de paleta.
