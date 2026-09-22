# La Bòbila — decisiones

ADRs breves. Fecha de todas: 2026-09-22.

## ADR-001 — La Bòbila vive en `la-bobila/`

- Decisión: sistema nuevo de marca y carta, separado del producto Argos IT. No se modifican frontend, backend, base de datos, wordpress-export, e2e, docs previos, README ni workflows.
- Motivo: el repositorio es una consultoría tecnológica. Mezclar la carta ahí rompe los dos productos.
- Roles: CEO, CTO, CDAO, Chief of Staff.
- Impacto: los archivos nuevos no arrastran el build de Argos. No hay dependencia npm añadida.
- Estado: aceptada.

## ADR-002 — El hex es provisional

- Decisión: la paleta direccional (marfil cálido, verde profundo, terracota, oliva, carbón cálido) se aprueba. Cada hex queda `POR_CONFIRMAR`. No se afirma que venga de un logo.
- Motivo: no hay archivo de logo en el repositorio. Extraer color de un archivo inexistente sería falso.
- Roles: CSO, Head of Product Design, CDAO.
- Impacto: `tokens.json` documenta el estado. Cuando llegue el logo se revisan los hex sin cambiar los nombres de rol de color.
- Estado: aceptada.

## ADR-003 — Un dato no confirmado no se presenta como real

- Decisión: ninguna fila pinta producto, precio, alérgeno, horario o dirección sin estado `CONFIRMADO`. El hueco dice «Per confirmar». El precio desconocido es «—».
- Motivo: inventar una carta utilizable haría daño operativo y legal.
- Roles: CDAO, CPO, CFO, CLO, COO.
- Impacto: el validador rechaza el render si un hueco `POR_CONFIRMAR` trae hechos rellenos. El renderer vuelve a comprobar el estado antes de pintar.
- Estado: aceptada.

## ADR-004 — La carta impresa sale del catálogo maestro

- Decisión: `render.mjs` lee `catalog.json` y escribe `carta-a3.html`. El HTML es salida. No hay una segunda copia manuscrita de productos.
- Motivo: dos cartas divergen. Carta y, más adelante, web tienen que leer lo mismo.
- Roles: CDAO, CTO, Principal Enterprise Architect, COO.
- Impacto: cambiar un texto de cliente es editar el JSON y regenerar. Los componentes no contienen hechos de producto.
- Estado: aceptada.

## ADR-005 — Wordmark tipográfico provisional

- Decisión: la cabecera es el nombre «La Bòbila» en Fraunces. No se dibuja un símbolo y se presenta como el logo del local.
- Motivo: no hay logo. Un emblema inventado impediría el reconocimiento real y ensuciaría la identidad.
- Roles: CEO, CSO, Head of Product Design.
- Impacto: la lámina no puede declararse PASS de reconocimiento. El bloqueo se sustituye entero cuando llegue el archivo.
- Estado: aceptada.

## ADR-006 — Fraunces y Source Sans 3

- Decisión: exactamente dos familias. Fraunces para marca y categorías. Source Sans 3 para producto, ingredientes y precios. Ambas venidas en el repo, licencia SIL OFL, con fallback documentado.
- Motivo: serif editorial contemporánea y sans humanista. Sin script, sin display italiano, sin dependencia de red en imprenta.
- Roles: Head of Product Design, CSO, CTO.
- Impacto: el PDF incrusta subconjuntos. Si más adelante un nombre necesita latino extendido fuera del juego actual, se añade el archivo; no se cambia de familia a la ligera.
- Estado: aceptada.

## ADR-007 — La smash no comparte identidad

- Decisión: smash burgers es categoría secundaria. En la lámina medida ocupa el 12,5 % del área de producto, frente al 57 % de pizza más «Crea la teva pizza». Sin icono de tomate, sin hueco protagonista, título menor.
- Motivo: la especialidad es la pizza. Igualar pesos convertiría la marca en otra cosa.
- Roles: CEO, CPO, CSO, CRO, Head of Product Design.
- Impacto: ningún `destacado: true`. El hueco ancho es composición, no promo. CRO no añade packs ni precios anzuelo.
- Estado: aceptada.

## ADR-008 — Cero fotografías

- Decisión: ilustración de línea propia y escasa (olivo, tomate, contorno). El trigo está en la biblioteca y no se coloca. Cero fotos.
- Motivo: no hay fotografías del local. Una foto genérica violaría la identidad. La regla admite como máximo dos fotos reales fuertes.
- Roles: Head of Product Design, CSO, CPO.
- Impacto: cuando existan una o dos fotos reales, se evalúan aparte. No se rellena con stock.
- Estado: aceptada.

## ADR-009 — Postres y begudes son esquema

- Decisión: `LB-POS` y `LB-BEG` existen en el modelo y en la lámina con badge «Per confirmar». No son productos. No se añade una categoría de helados.
- Motivo: el encargo reserva esas secciones y las marca pendientes. Inventar postres, bebidas o helados sería un catálogo falso.
- Roles: CPO, CDAO, COO, CLO.
- Impacto: el helado, si existe, entrará después como producto de postres con id nuevo y estado propio.
- Estado: aceptada.
