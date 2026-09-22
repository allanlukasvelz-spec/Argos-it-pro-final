STATUS:
PARTIAL

MEMORY:
.cursor/rules/la-bobila-multitalk.md

FILES CREATED:
.cursor/rules/la-bobila-multitalk.md
docs/LA-BOBILA-MASTER-SPEC.md
docs/LA-BOBILA-DATA-MODEL.md
docs/LA-BOBILA-DESIGN-SYSTEM.md
docs/LA-BOBILA-DECISIONS.md
docs/LA-BOBILA-STATUS.md
la-bobila/README.md
la-bobila/catalog/catalog.json
la-bobila/tokens/tokens.json
la-bobila/tokens/tokens.css
la-bobila/tokens/fonts/fraunces-400-normal.ttf
la-bobila/tokens/fonts/fraunces-500-normal.ttf
la-bobila/tokens/fonts/fraunces-600-normal.ttf
la-bobila/tokens/fonts/fraunces-500-italic.ttf
la-bobila/tokens/fonts/source-sans-3-400-normal.ttf
la-bobila/tokens/fonts/source-sans-3-500-normal.ttf
la-bobila/tokens/fonts/source-sans-3-600-normal.ttf
la-bobila/tokens/fonts/source-sans-3-400-italic.ttf
la-bobila/tokens/fonts/Fraunces-OFL.txt
la-bobila/tokens/fonts/SourceSans3-OFL.txt
la-bobila/print/illustrations.mjs
la-bobila/print/components.mjs
la-bobila/print/carta.css
la-bobila/print/render.mjs
la-bobila/print/export.mjs
la-bobila/print/carta-a3.html
la-bobila/print/renders/carta-a3.pdf
la-bobila/print/renders/carta-a3.png

FILES MODIFIED:
none

DESIGN SYSTEM:
Dirección aprobada y aplicada: marfil cálido, verde profundo, terracota contenida, oliva, carbón cálido. Hex provisional (POR_CONFIRMAR), no extraído de un logo. Dos familias venidas en el repo, Fraunces y Source Sans 3, con fallback. Retícula de 6 columnas en A3 vertical, archivo 303 × 426 mm. Wordmark tipográfico provisional. Cero fotos. Reparto medido del área de producto: pizza + Crea la teva pizza 57,0 %; smash 12,5 %; per compartir + amanides 18,7 %; postres + begudes 11,8 %.

DATA MODEL:
catalog.json es la única fuente. 29 huecos, todos POR_CONFIRMAR, hechos en null. Prefijos LB-PIZ, LB-BUR, LB-COM, LB-AMA, LB-EXT y, solo como esquema, LB-POS y LB-BEG. El validador rechaza un hecho relleno en un hueco no confirmado. El HTML se genera; no se copia a mano.

A3 LAYOUT:
Producida. PDF de 1 página, MediaBox 858,96 × 1207,92 pt (303,02 × 426,13 mm; el resto es redondeo de Chrome, <0,15 mm). PNG 2290 × 3220. Fuentes incrustadas. Jerarquía legible, ingredientes por encima del precio, precios en raya, QR sin URL.

MULTITALK REVIEW:
CEO: El nombre y «Des de 2005» están, y la pizza manda. Sin logo no hay reconocimiento inmediato. No puedo decir que esto ya es La Bòbila como siempre debió verse. Parcial.
CPO: La arquitectura de categorías coincide con el encargo. No hay platos inventados. «Crea la teva pizza» es un módulo de grupos, no una lista de toppings falsa. Postres y begudes están marcados pendientes. Parcial: falta la carta.
COO: Se regenera desde un JSON y el equipo ve el id del hueco. No sirve todavía como carta de servicio: no hay precios, disponibilidad, dirección ni horario. Parcial.
CSO: La dirección es mediterránea y actual, no trattoria, no negro, no dorado, no smash como marca. Con solo el nombre y el año, una lámina bien hecha aún puede parecer de otra pizzería artesana. Parcial.
CRO: No hay catálogo de promos ni destacado comercial. El precio no domina. Correcto, y también imposible trabajar el ticket. Parcial.
CDAO: Una fuente, prefijos, null distinto de «no lleva», hex declarado provisional. Integridad bien cerrada. Los datos de negocio siguen vacíos. Parcial.
HEAD OF PRODUCT DESIGN: Se puede juzgar tipo, retícula y aire. Los ingredientes se leen mejor que el precio. La repetición de «Per confirmar» es honesta y a la vez impide juzgar la carta terminada. El wordmark no sustituye al logo. Parcial.
CTO: Aislado de Argos, sin dependencia nueva, fuentes locales, PDF de una página al tamaño de sangre. Chrome del sistema es un supuesto documentado. No hay integración de QR. El sistema técnico aguanta; la fase no está cerrada. Parcial.
CLO: No hay alérgenos, dirección ni URL inventados. El aviso de la lámina es PROPUESTA_ARGOS, no un texto legal de publicación. Esta hoja no debe imprimirse como carta vigente. Parcial.
CHIEF OF STAFF: No hay contradicción entre catálogo y lámina. La contradicción con PASS es externa: faltan logo y carta real. Decisión: PARTIAL. No se rellenan precios para que parezca terminada.

OPEN ISSUES:
- No hay archivo de logo. El wordmark es provisional.
- No hay carta vigente ni carta histórica en el repositorio.
- Los hex no están muestreados.
- Moneda, destino del QR y texto legal de publicación siguen abiertos.
- Hace falta Chrome del sistema para regenerar PDF y PNG.
- El MediaBox de Chrome queda a menos de 0,15 mm del nominal 303 × 426 mm.

DATA TO CONFIRM:
Logo (vector o raster original), carta vigente, carta histórica, dirección, horario, teléfono, bebidas, postres, helados, alérgenos, fotografías reales del local, combos, promociones, moneda y destino del QR.

NEXT ACTION:
Pedir al cliente, en un solo envío, el archivo de logo original y la carta vigente con productos, precios y alérgenos, para volcarlos solo en catalog.json y sustituir el wordmark.
