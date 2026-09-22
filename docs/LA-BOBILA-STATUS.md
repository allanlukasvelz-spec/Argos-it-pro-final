STATUS:
EDITORIAL V3. Prototipo. No es carta final, ni imprenta, ni producción. EDITORIAL_ARCHITECTURE_GATE PASS. BRAND_GATE PARTIAL. PALETTE_GATE PARTIAL. COPY_GATE PARTIAL. ALLERGEN_GATE BLOCKED. QR_PRODUCTION_GATE BLOCKED. PRINT_GATE BLOCKED. PUBLICATION_GATE BLOCKED.

TYPOGRAPHY +1PT:
PASS. La lectura de la A3 sube exactamente 1 pt. Nombre de pizza 4,55 mm (antes 4,2). Precio de fila 3,70 mm (antes 3,35). Topping de Crea la teva 3,95 mm, interlínea 5,34 mm (antes 3,6 / 4,86). Fraunces y Source Sans 3 no cambian. El peso y el tracking no cambian. La interlínea no se comprime. Ningún nombre de fila parte.

ORTHOGRAPHY REVIEW:
PASS. Auditoría del catalán visible. No hay error seguro dentro de `catalog.json`. Se conserva como lectura incierta, sin corregir: flor di latte en Prosciutto, fior di latte donde la foto no cierra, parmesa, butifarra, Classica, briox, cogombree, Santlucar, bacon, Cansalada en vegetals y Mozzarella fior di latte. La única corrección es de interfaz: «Pendent de client» pasa a «Pendent del client».

BACKGROUND PIZZA:
PASS. Es el mismo contorno lineal ya estudiado. Atraviesa Pizzes y Crea la teva, centrado en ese territorio y algo recortado por el bloque. Opacidad baja, más suave en el centro. El texto medido sigue en tinta pura `rgb(32, 43, 23)`.

BURGER:
PASS. Línea fina detrás de Smash burgers. No protagoniza.

FRIES:
PASS. Detrás de Per compartir / complements.

SALAD:
PASS. Detrás de Amanides.

DESSERT:
PASS. Detrás de Postres. No añade productos, sabores ni precios. El estado histórico se mantiene.

DRINK:
PASS. Detrás de Begudes. No añade bebidas ni precios. Sigue pendiente.

CORNER LAURELS:
PASS. Cuatro ramas distintas, no cuatro giros del mismo archivo y no un recorte del logo. Nacen de la esquina y no cierran un marco.

CENTERED HEADER COPY:
PASS. El descriptor editorial y la línea de estudio quedan a 0,00 mm del eje de la hoja. El logo no se ha movido ni editado.

DENSITY V3:
PASS. 0 OVERFLOW. El pie cierra a 16 mm. Informe: `docs/LA-BOBILA-DENSITY-REPORT.md`.

LOGO INTEGRITY:
PASS. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. Una sola imagen en la lámina.

DATA INTEGRITY:
PASS. `catalog.json` no cambia. Arquitectura C intacta: carn 1 línea, vegetals 2, formatges 1, 27 nombres, cuerpo 3,95 mm. Sin €. Sin fotos. Sin productos nuevos.

MOBILE REGRESSION:
PASS en 320, 390 y 430. Sin scroll horizontal, nav sticky, 50 objetivos de al menos 44 px, cero marcas de agua grandes.

MULTITALK REVIEW:
CEO: la hoja se reconoce más como La Bòbila. Sigue siendo un prototipo.
CSO: el dibujo es de línea y mediterráneo, no una trattoria genérica ni comida rápida. La paleta sigue en candidata.
CPO: el texto va delante. La pizza sigue por encima de la smash. Crea la teva no cambia de estructura.
COO: los nombres y los precios se leen de un vistazo. Lo pendiente sigue marcado como pendiente.
CRO: cada dibujo señala su zona y no compite con el precio. El precio sigue en tinta y más pequeño que el nombre.
CDAO: la única fuente sigue siendo `catalog.json`. El prompt no ha reordenado ni repreciado nada.
CLO: el helado y la copa no confirman postres, bebidas ni alérgenos. El sello dice que no se imprime. El QR de producción sigue prohibido.
Head of Product Design: hay más vida y la lámina sigue limpia. El punto extra cabe sin encoger la letra.
Customer Success: el punto se nota en el nombre y en el precio. En el móvil la lectura no se ha cargado de fondos.
CTO: V2 no se ha sobrescrito. El guard de producción sigue rechazando localhost. `/carta` no arrastra las marcas de agua.
Chief of Staff: V3 se puede enseñar junto a V2. No se imprime, no se publica, no se genera QR de producción y no se hace merge.

REMAINING BLOCKERS:
- QR_PRODUCTION sin destino.
- Matriz de alérgenos ausente.
- Copy editorial, paleta B y autorización de imprenta sin cierre del cliente.
- Bebidas, postres, salsas, dirección, teléfono y horario vacíos.
- Grafías en revisión, Cansalada y la columna de formatges.
- PRINT_GATE y PUBLICATION_GATE cerradas.

NEXT ACTION:
Revisar la lámina V3 con el cliente, al lado de V2. No publicar. No imprimir. No generar QR_PRODUCTION. No merge final.

ARCHIVOS:
la-bobila/print/renders/carta-a3-editorial-v3.png
la-bobila/print/renders/carta-a3-editorial-v3.pdf
docs/LA-BOBILA-DENSITY-REPORT.md
docs/LA-BOBILA-TYPOGRAPHY.md
