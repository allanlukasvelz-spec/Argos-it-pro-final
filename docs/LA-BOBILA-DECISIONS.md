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
- Estado: vigente. El muestreo del logo real queda descrito en ADR-014.

## ADR-003 — Un dato no confirmado no se presenta como real

- Decisión: precio, ingredientes, alérgenos, horario y dirección solo se pintan con estado `CONFIRMADO`. Un nombre `SOURCE_MISSING` puede mostrarse marcado como no contrastado. Si no hay nombre, el hueco dice «Per confirmar». El precio desconocido es «—».
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
- Estado: candidata, no final. Ver ADR-015.

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

## ADR-009 — Postres y begudes no se fabrican

- Decisión: no hay filas `LB-POS` ni `LB-BEG` mientras no exista un documento contrastado. Postres y gelats quedan como nota de sección en `HISTORICO`. Begudes queda en `POR_CONFIRMAR` porque el cliente no ha confirmado ese catálogo. No se añade una categoría de helados ni de combos.
- Motivo: el encargo reserva esas secciones y las marca pendientes. Inventar postres, bebidas o helados sería un catálogo falso.
- Roles: CPO, CDAO, COO, CLO.
- Impacto: el helado, si sigue vigente, entrará después como producto de postres con id nuevo y estado propio, solo tras contrastar el documento.
- Estado: aceptada.

## ADR-010 — QR + carta móvil es P0

- Decisión: `/carta` y el QR son producto central. La arquitectura es catálogo → impresión A3, catálogo → `/carta`, QR de desarrollo ahora y QR de producción bloqueado.
- Motivo: la carta digital no puede ser un PDF, una foto de la lámina ni un shrink de escritorio.
- Roles: CEO, CPO, CTO, Head of Product Design, Chief of Staff.
- Impacto: hay renderer móvil, servidor local en `127.0.0.1:4173` y módulo editorial en la A3.
- Estado: aceptada.

## ADR-011 — `catalog.json` es la única fuente

- Decisión: impresión, `/carta` y el QR leen el mismo JSON. No existen catálogos paralelos.
- Motivo: dos copias divergen. La web futura tiene que entrar por el mismo sitio.
- Roles: CDAO, CTO, CPO.
- Impacto: `print/render.mjs` y `mobile/render.mjs` validan y generan. El HTML no se edita a mano.
- Estado: aceptada.

## ADR-012 — QR de producción bloqueado

- Decisión: `QR_PRODUCTION` no tiene destino y no se dibuja. `QR_DEV` solo codifica `http://127.0.0.1:4173/carta`, con aviso de que no se imprime. La ruta estable es `/carta`. Cuando haya dominio, una redirección controlada conservará el QR físico.
- Motivo: no hay dominio público definitivo. Una URL temporal quedaría impresa en una carta que no se puede retirar.
- Roles: CTO, CISO, CLO, COO.
- Impacto: corrección de error Q, zona muda de 4 módulos, negro sobre blanco. El código no compite con la marca.
- Estado: aceptada.

## ADR-013 — El wordmark es placeholder

- Decisión: `marca.wordmark` es `PLACEHOLDER`. No se diseña como logo final. El archivo real, cuando se ingiera, se conserva intacto; se trabaja sobre una copia.
- Motivo: el logo visual existe fuera del repositorio y todavía no está ingerido.
- Roles: CEO, CSO, Head of Product Design.
- Impacto: la cabecera móvil marca el hueco. La A3 sigue con el nombre en Fraunces, no con un símbolo inventado.
- Estado: aceptada.

## ADR-014 — La paleta sigue provisional hasta muestrear el logo

- Decisión: los hex no cambian hasta tener el archivo de logo, muestrear la copia optimizada, documentar el muestreo y comparar con esta paleta. El máster no se modifica.
- Motivo: muestrear un archivo que no está en el repo sería inventar el color.
- Roles: CSO, Head of Product Design, CDAO.
- Impacto: `tokens.json` mantiene `estado_hex: POR_CONFIRMAR`.
- Estado: aceptada.

## ADR-015 — Fraunces y Source Sans 3 son candidatas

- Decisión: no se cambian en este pase y tampoco se declaran finales. Se evaluarán sobre una A3 real: carácter, catalán, números, precios, ingredientes, impresión y móvil.
- Motivo: la pareja funciona y está vendida en el repo, pero sin la prueba impresa con el logo no es irreversible.
- Roles: Head of Product Design, CSO.
- Impacto: no hay experimento de fuentes nuevas en esta entrega.
- Estado: candidata.

## ADR-016 — PWA anotada, no construida

- Decisión: no hay service worker ni manifest. Propuesta: cuando el dominio y la carta contrastada existan, cachear solo `/carta`, los tokens y las fuentes locales, sin dependencia nueva, para una conexión móvil floja. Hoy se rechaza porque cachearía datos sin contrastar.
- Motivo: la página ya es un HTML, un CSS y fuentes locales. Un worker prematuro fijaría la versión equivocada.
- Roles: CTO, CISO, COO, CLO.
- Impacto: cero código de offline. La página sigue siendo ligera.
- Estado: propuesta, no construida.
