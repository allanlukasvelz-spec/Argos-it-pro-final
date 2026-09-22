STATUS:
EDITORIAL V2. Prototipo. No es carta final, ni imprenta, ni producción. EDITORIAL_ARCHITECTURE_GATE PASS. BRAND_GATE PARTIAL. PALETTE_GATE PARTIAL. COPY_GATE PARTIAL. ALLERGEN_GATE BLOCKED. QR_PRODUCTION_GATE BLOCKED. PRINT_GATE BLOCKED. PUBLICATION_GATE BLOCKED.

EDITORIAL V2 CLEAN:
PARTIAL. Arquitectura C, candidata B, 0 desborde, logo a 36 mm, copy separado y marcado pendiente. La marca no se cierra hasta la revisión del cliente.

EDITORIAL V2 ILLUSTRATED:
PARTIAL. El mismo contenido, la misma retícula y el mismo color. Un solo tomate en la cabecera de pizzas. No se declara mejor que clean.

LOGO:
Integrado en la cabecera. Alto 36 mm, ancho 66,7 mm, sin deformar. Aire superior hasta el logo: 27,2 mm. El máster no se ha tocado: sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. La copia con alfa es técnica y no sustituye al máster. El texto interno del archivo no se ha reescrito.

TYPOGRAPHY:
CANDIDATA MANTENIDA. Fraunces y Source Sans 3. Informe: `docs/LA-BOBILA-TYPOGRAPHY.md`. Los nombres largos de la A3 caben en una línea. El precio va en tinta, más pequeño que el nombre, tabular. No hay motivo para una tercera familia.

PALETTE:
CANDIDATE B / PENDING CLIENT. `#FAF0E7`, `#202B17`, `#8E4A30`, `#6C7153`. Los tokens globales no cambian. La rama (4,53:1) no pinta precios, cuerpo, ingredientes ni avisos. Eso va en tinta (13,16:1). `/carta` aplica la candidata en el cuerpo de la página, no en `:root`.

COPY:
EDITORIAL_COPY_PENDING. Tratamientos medidos: A solo logo (hueco a Pizzes 10,6 mm), B frases en el eje del logo (18,0 mm), C descriptor separado (19,5 mm). Los tres sin desborde. Las láminas V2 usan C porque A esconde el texto que hay que validar y B lo presenta como pie del archivo. No es una elección de gusto. «Des de 2005» y «Pizzeria artesana» no se atribuyen al logo.

A3:
PASS. 0 OVERFLOW. El pie cierra a 16 mm del borde en clean y en illustrated. Crea la teva sigue a 3,6 mm e interlínea 4,86 mm: carn 1 línea, vegetals 2, formatges 1. Pizza 55,7 / 46,1 mm, por encima de smash 32,8 / 25,7 mm. La zona de pizza está más llena que en V1 porque el descriptor ocupa aire que antes quedaba dentro de esa zona. No hay fotos. No hay €. Sello: PROTOTIP / NO IMPRIMIR.

MOBILE:
PASS en 320, 360, 390 y 430. Sin scroll horizontal. Nav sticky. 50 objetivos, mínimo 44 px. Misma crema, misma tinta, Fraunces en categorías, Source Sans 3 en producto, ingrediente y precio. El logo va en la cabecera y el copy en un descriptor aparte. No copia la retícula A3. Precio en tinta, sin €, con los mismos dos decimales y coma.

CLIENT REVIEW PACKAGE:
PASS. `docs/LA-BOBILA-CLIENT-REVIEW.md`. Quince cierres, en lenguaje llano. No vuelve a pedir las pizzas, los precios ni los ingredientes ya contrastados.

MULTITALK REVIEW:
CEO: se reconoce el logo y la pizza manda. Sigue pareciendo un prototipo hasta que el cliente cierre copy y color. No se publica.
CSO: la marca es más fiel que en V1 porque el copy no se hace pasar por el archivo. La paleta sigue en candidata. No hay ganadora entre clean e illustrated.
CPO: producto primero, precio localizable y menor, ingrediente en `/carta`. La jerarquía pizza sobre smash se mantiene. Crea la teva no ha cambiado de estructura.
COO: la lámina sigue sirviendo para tomar el pedido de lo confirmado. Lo que va en revisión o en «Per confirmar» no se puede vender como cerrado. Los alérgenos siguen vacíos.
CRO: el precio se encuentra y no protagoniza. No hay destacados ni fotos que empujen un plato. La banda de suplemento sigue en la A3.
CDAO: el catálogo no se ha reescrito. Los confirmados siguen confirmados. El único cambio de estado es el copy editorial, que pasa a EDITORIAL_COPY_PENDING. Una sola fuente.
CLO: nada pendiente se presenta como hecho legal. No hay iconos de alérgeno en los platos, no hay €, no hay dominio y el sello dice que no se imprime. El QR de producción sigue prohibido.
Head of Product Design: V2 mejora el aire del logo, la tinta del precio y la separación del copy. Illustrated no decora de más: es un tomate. No se corona.
Customer Success: en el móvil la lectura sigue siendo nombre, precio e ingrediente, con salto de categoría sticky. Falta el pase en un teléfono real.
CTO: `/carta` sale del mismo `catalog.json`. Los tokens globales no se han sustituido. El guard de producción sigue rechazando localhost.
Chief of Staff: se puede enseñar al cliente el paquete de revisión y las dos láminas. No se imprime, no se publica, no se genera QR de producción y no se hace merge final. La siguiente acción es el cierre del cliente, no otro rediseño.

CLIENT DECISIONS REQUIRED:
1. Si se mantiene el copy editorial junto al logo, y con qué palabras.
2. Si se muestra el símbolo €.
3. Si la candidata B se aprueba al verla.
4. Grafía de Pernil ibèric, Tonyina, Pebrot vermell, Carxofa, Xampinyons, cogombree/cogombret y Santlucar.
5. Si Cansalada se queda en la columna de verdura.
6. Foto legible de la columna Formatges.
7. Bebidas.
8. Postres y gelats.
9. Salsas.
10. Dirección.
11. Teléfono.
12. Horario.
13. Matriz de alérgenos.
14. Dominio o ruta pública de la carta.
15. Autorización de imprenta.

P0 BLOCKERS:
- QR_PRODUCTION sin destino. No generar, no imprimir, no publicar.
- Matriz de alérgenos ausente.
- PRINT_GATE y PUBLICATION_GATE cerradas. La lámina es un prototipo.

P1 BLOCKERS:
- Copy editorial sin validar.
- Paleta B sin aprobación visual del cliente.
- Bebidas, postres, salsas, dirección, teléfono y horario vacíos.
- Grafías en revisión, Cansalada y la columna de formatges.
- Pase físico del QR en un teléfono.

NEXT ACTION:
Enviar `docs/LA-BOBILA-CLIENT-REVIEW.md` con las dos láminas V2. No publicar. No imprimir. No QR_PRODUCTION. No merge final.

ARCHIVOS:
docs/LA-BOBILA-CLIENT-REVIEW.md
docs/LA-BOBILA-EDITORIAL-V2-REVIEW.md
docs/LA-BOBILA-TYPOGRAPHY.md
la-bobila/print/renders/carta-a3-editorial-v2-clean.png
la-bobila/print/renders/carta-a3-editorial-v2-clean.pdf
la-bobila/print/renders/carta-a3-editorial-v2-illustrated.png
la-bobila/print/renders/carta-a3-editorial-v2-illustrated.pdf
