STATUS:
EDITORIAL V4. Corrección visual sobre V3. Prototipo. No es carta final, ni imprenta, ni producción. EDITORIAL_ARCHITECTURE_GATE PASS. BRAND_GATE PARTIAL. PALETTE_GATE PARTIAL. COPY_GATE PARTIAL. ALLERGEN_GATE BLOCKED. QR_PRODUCTION_GATE BLOCKED. PRINT_GATE BLOCKED. PUBLICATION_GATE BLOCKED.

ILLUSTRATION RECOGNIZABILITY:
IR01 PIZZA PASS. Pizza completa, vista desde arriba, con corteza irregular, superficie interior, tomate, albahaca, queso y otros ingredientes. 150 mm, opacidad 0,17, centrada en Pizzes y Crea la teva. Se lee sin el título de sección y el texto sigue delante.
IR02 BURGER PASS. Smash burger de frente: pan superior, hoja, tomate, queso, carne y pan inferior. 58 × 48 mm, opacidad 0,20, detrás de Smash burgers.
IR03 FRIES PASS. Patatas de distinta altura dentro de un cucurucho. 44 × 52 mm, opacidad 0,20, detrás de Per compartir / complements.
IR04 SALAD PASS. Bol mediterráneo con hojas, tomate y volumen por encima del borde. 80 × 68 mm, opacidad 0,18, detrás de Amanides.
IR05 ICE_CREAM PASS. Dos bolas y cucurucho. 28,6 × 40 mm, opacidad 0,22, detrás de Postres. Decoración: no afirma que haya helado a la venta.
IR06 WINE_GLASS PASS. Copa con cáliz, tallo, pie y línea de líquido. 23,5 × 40 mm, opacidad 0,22, detrás de Begudes. Decoración: no crea un vino en el catálogo.
IR07 CORNER_BOTANICAL PASS. Cuatro ramas distintas, 58 mm, opacidad 0,28, color #6C7153 y un acento mínimo #8E4A30. Salen de cada esquina por los dos lados y no tocan el logo.

TYPOGRAPHY LOCK:
PASS. Se conserva el +1 pt de V3. Nombre de pizza 4,55 mm. Precio de fila 3,70 mm. Topping de Crea la teva 3,95 mm, interlínea 5,34 mm. Familias, peso y tracking iguales. Ningún nombre de fila parte. El copy editorial sigue a 0,00 mm.

DENSITY:
PASS. 0 OVERFLOW. El pie cierra a 16 mm. Las marcas de agua son absolutas y no cambian la retícula. Informe: `docs/LA-BOBILA-DENSITY-REPORT.md`.

LOGO INTEGRITY:
PASS. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc` antes y después. Una sola imagen, 36 mm de alto, sin mover.

DATA INTEGRITY:
PASS. `catalog.json` no cambia. Arquitectura C intacta. Sin €. Sin fotos. Sin productos nuevos. Las lecturas REVIEW_REQUIRED siguen abiertas.

MOBILE:
PASS en 320, 390 y 430. Sin scroll horizontal, nav sticky, objetivos de 44 px, cero marcas de agua grandes, sin €.

REMAINING BLOCKERS:
- QR_PRODUCTION sin destino.
- Matriz de alérgenos ausente.
- Copy editorial, paleta B y autorización de imprenta sin cierre del cliente.
- Bebidas, postres, salsas, dirección, teléfono y horario vacíos.
- Grafías en revisión, Cansalada y la columna de formatges.
- PRINT_GATE y PUBLICATION_GATE cerradas.

NEXT ACTION:
Revisar la lámina V4 con el cliente, al lado de V3. No publicar. No imprimir. No generar QR_PRODUCTION. No merge final.

ARCHIVOS:
la-bobila/print/renders/carta-a3-editorial-v4.png
la-bobila/print/renders/carta-a3-editorial-v4.pdf
docs/LA-BOBILA-DENSITY-REPORT.md
docs/LA-BOBILA-DECISIONS.md
