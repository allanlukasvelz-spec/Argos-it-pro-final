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

- Decisión: precio, ingredientes, alérgenos, horario y dirección solo se pintan con estado `CONFIRMADO`. Un nombre `SOURCE_MISSING` o `CANDIDATE_MATCH` puede mostrarse marcado como no contrastado. Si no hay nombre, el hueco dice «Per confirmar». El precio desconocido es «—».
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
- Estado: aceptada en su momento. ADR-020 coloca el archivo recibido como identidad de cabecera. Fraunces sigue en categorías y en el copy de proyecto, no dentro del logo.

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
- Motivo: aunque el PNG ya está ingerido, pegarlo en la cabecera sería un cambio de diseño. El wordmark tipográfico sigue en su sitio hasta una decisión aparte.
- Roles: CEO, CSO, Head of Product Design.
- Impacto: la cabecera móvil marca el hueco. La A3 sigue con el nombre en Fraunces, no con un símbolo inventado.
- Estado: el wordmark tipográfico sigue `PLACEHOLDER`. La cabecera ya no depende de él: ADR-020 coloca el archivo.

## ADR-014 — La paleta sigue provisional hasta muestrear el logo

- Decisión: los hex no se sustituyen solos después del muestreo. El máster no se modifica. La comparación queda en `docs/LA-BOBILA-BRAND-AUDIT.md`.
- Motivo: el tomate muestreado (`#8E4A30`) y la tinta (`#202B17`) no son los hex provisionales. Cambiarlos sin cierre de CSO y diseño movería toda la lámina.
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

## ADR-017 — Primero se ingiere, y el original no se toca

- Decisión: el orden es archivo fuente, extracción, normalización, `catalog.json`, validación, A3 y `/carta`. Los másteres en `la-bobila/source/` son inmutables. Las copias van a `la-bobila/processed/`. Sin archivo físico no hay muestreo de logo, ni transcripción, ni diff. `QR_PRODUCTION` sigue bloqueado.
- Motivo: el andamiaje no sustituye al logo ni a las cartas. Inventar su contenido o descargar un logo parecido falsificaría la fuente.
- Roles: CDAO, CEO, CPO, CLO, CTO, Chief of Staff.
- Impacto: manifiesto `assets.json` con `FILE_NOT_INGESTED` y `sha256` null. Los 17 nombres de pizza pasan a `CANDIDATE_MATCH`. No hay `CONFIRMADO_SOURCE`. No se reexporta el PDF.
- Estado: aceptada. La ingesta que esta ADR dejaba bloqueada se cierra en ADR-018. El orden y la inmutabilidad siguen vigentes.

## ADR-018 — Ingesta del 2026-09-22, sin rediseño y sin QR de producción

- Decisión: se copian byte a byte el logo, la carta vigente y la carta histórica desde el zip de Downloads. El catálogo 0.4.0 sale de la foto vigente tras dos pases de OCR. Lo histórico queda en `catalog.historico` y no se pinta. Los hex no se sustituyen. El wordmark sigue en `PLACEHOLDER`. `QR_PRODUCTION` sigue bloqueado y sin destino. Si la retícula no cabe, se informa y no se baja el tipo.
- Motivo: ya hay archivo. Seguir con huecos vacíos sería ignorar la fuente. Sustituir la paleta o pegar el PNG sería diseñar antes de cerrar el contraste de marca.
- Roles: CEO, CPO, COO, CFO, CSO, CRO, CDAO, CLO, Head of Product Design, CTO, Chief of Staff.
- Impacto: 17 pizzas, 4 smash, 11 complements y 3 amanides en `CONFIRMADO`. Doce líneas de Crea la teva en `REVIEW_REQUIRED`, incluida cansalada en la columna de verdura. A3 en OVERFLOW por ese módulo. No hay alérgenos legales. No hay segunda carta ni segundo PR.
- Estado: aceptada. La colocación del archivo y el arreglo de retícula quedan en ADR-019 a ADR-022. El overflow de aquella A3 no se cierra bajando el tipo.

## ADR-019 — El texto del logo y el copy de proyecto no se mezclan

- Decisión: `BRAND_ASSET_TEXT` es el texto del archivo, sin tocarlo: «DESDE 2005» y «PIZZERIA ARTIGIANALE». `EDITORIAL_COPY` es decisión de proyecto: «Des de 2005» y «Pizzeria artesana». El copy de proyecto solo aparece fuera del logo, con la marca visible «Text de projecte». No se reescribe el PNG. No se presenta el copy como si estuviera dentro del logo.
- Motivo: el encargo y el archivo no dicen lo mismo. Sustituir uno por el otro falsificaría la fuente o el encargo.
- Roles: CEO, CSO, CPO, Head of Product Design, CLO.
- Impacto: la cabecera muestra el archivo y, debajo, el copy marcado. `marca.wordmark` sigue en `PLACEHOLDER`.
- Estado: aceptada.

## ADR-020 — Se coloca una copia de presentación, no el máster

- Decisión: el máster `la-bobila/source/logo/la-bobila-logo-reference.png` no se modifica. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. La copia byte a byte permanece en `processed/logo/`. Como el PNG es RGB sin alfa y el crema de fondo (mediana 250, 241, 230) dibuja un rectángulo sobre la lámina, se genera `la-bobila-logo-presentation.png`: el mismo píxel, con alfa donde el fondo coincide (distancia ≤ 14 transparente, ≥ 36 opaco, pluma entre medias). Sin recorte, sin redibujo, sin autotrace. Esa copia es la identidad de la A3 y de `/carta`.
- Motivo: el archivo ya puede colocarse. Seguir con el wordmark tipográfico como identidad primaria escondería el logo recibido.
- Roles: CSO, Head of Product Design, CDAO.
- Impacto: el wordmark Fraunces deja de ser la cabecera. Fraunces sigue en categorías y en el copy de proyecto.
- Estado: aceptada.

## ADR-021 — Estudio de paleta, sin ganadora

- Decisión: no se sustituyen los tokens. No hay paleta C. El prototipo editorial prueba la candidata B y lo dice en la lámina. No es una decisión de marca.
- Motivo: la candidata A (marfil `#F3EEE4`, verde `#1E3A32`, terracota `#C15B3A`, oliva `#6E7A45`) deja la terracota en 3,76:1 y la oliva en 4,01:1 sobre el marfil, por debajo de 4,5:1 para texto pequeño. La candidata B (marfil `#FAF0E7`, tinta `#202B17`, tomate `#8E4A30`, rama `#6C7153`) pasa: tinta 13,16, tomate 5,89, rama 4,53. B ya cumple el contraste y coincide con el logo colocado. Inventar una tercera mezcla sería preferencia, no una necesidad. La rama queda justa para papel no estucado en el tipo más pequeño. Los tintes de apoyo (lavado, filete, verde suave) son mezclas de los cuatro hex de la candidata, no una paleta nueva.
- Roles: CSO, Head of Product Design.
- Impacto: `tokens.json` no cambia. `/carta` sigue en los tokens provisionales. La lámina del prototipo lleva la clase de la candidata B.
- Estado: estudio. Sin ganadora.

## ADR-022 — Crea la teva usa el corte editorial

- Decisión: de las tres arquitecturas medidas con el mismo tipo (3,6 mm, interlínea 1,35), se usa la C. La base y los suplementos van en una banda de 6 columnas. La lista completa sigue en la A3, en líneas que fluyen, no en una columna de trece. A y B se rechazan porque desbordan la lámina (12,2 mm y 69,1 mm) sin bajar el tipo. El detalle está en `docs/LA-BOBILA-CREATE-YOUR-PIZZA-STUDY.md`.
- Motivo: el desborde no era un problema de cuerpo. Encoger la letra para esconderlo estaba prohibido.
- Roles: Head of Product Design, CPO, COO, CRO, Customer Success.
- Impacto: la A3 de conjunto pasa a 0 OVERFLOW. La pizza sigue delante y con más aire que la smash. Los toppings confirmados no se aparcan en el QR.
- Estado: aceptada para el prototipo editorial. No es carta final.

## ADR-023 — Alérgenos: arquitectura híbrida, capa legal vacía

- Decisión: se prototipa la opción 3. La A3 y `/carta` muestran un sistema de marcas neutras que no se asigna a ningún plato. Cuando exista la matriz, el detalle por plato vivirá en `/carta` y la A3 conservará la leyenda, no un icono pegado al plato sin fuente. No se infieren alérgenos.
- Motivo: un icono junto a un plato parecería una declaración legal. Hoy no hay matriz.
- Roles: CLO, CPO, COO, Head of Product Design.
- Impacto: `ALLERGEN_GATE` sigue BLOCKED. El componente `AllergenSystem` va con `data-attached="false"`.
- Estado: recomendación de arquitectura. Sin contenido legal.

## ADR-024 — La moneda se conserva y no se pinta

- Decisión: los valores no se tocan y no se pierden decimales. `moneda.presentacion` es `EUR_PENDING_PRESENTATION`. El símbolo no entra en la A3 ni en `/carta` mientras `moneda.estado` no sea `CONFIRMADO`.
- Motivo: la foto pinta el euro y el cierre editorial de la moneda no está dado.
- Roles: CFO, CLO, CPO.
- Impacto: 6 Formatges sigue en 15,90 `CONFIRMADO_SOURCE`. El 13,90 histórico es otro periodo y no abre conflicto.
- Estado: aceptada.

## ADR-025 — Una build de producción no puede apuntar a localhost

- Decisión: `QR_PRODUCTION` sigue `BLOQUEADO` y con destino null. `QR_DEV` puede seguir en `127.0.0.1`. Si `LA_BOBILA_BUILD=production` o `NODE_ENV=production`, el guard falla cuando un destino es localhost. La lámina de desarrollo enseña `PROVA / NO IMPRIMIR`. La URL local no se pinta como arte. El módulo «La carta al teu mòbil» sigue siendo un componente propio.
- Motivo: un QR de imprenta que abre localhost no se puede retirar.
- Roles: CTO, CISO, CLO, COO.
- Impacto: `node la-bobila/print/production-guard.mjs` con build de producción sale en error. El test lo cubre.
- Estado: aceptada. `QR_PRODUCTION_GATE` sigue BLOCKED.

## ADR-026 — La arquitectura C queda como baseline

- Decisión: C es la arquitectura editorial. No se vuelve a A ni a B salvo una regresión medida. En V2 el cuerpo de Crea la teva sigue en 3,6 mm e interlínea 1,35. Los toppings no pasan al QR.
- Motivo: A y B desbordaban con el mismo tipo. V2 no ha mostrado esa regresión: la pila cierra a 16 mm del borde.
- Roles: Head of Product Design, CPO, COO.
- Impacto: las dos láminas V2 usan C. La retícula de 6 columnas no cambia.
- Estado: aceptada para el prototipo. No es carta final.

## ADR-027 — La rama no pinta el texto crítico pequeño

- Decisión: la candidata B sigue en estudio. No se tocan `tokens.css` ni `tokens.json`. En la lámina y en `/carta` los precios, el cuerpo, los ingredientes y los avisos pendientes van en tinta `#202B17`. La rama `#6C7153` queda en filetes, el marco interior y adorno. `/carta` aplica la candidata en el `body`, sin sustituir el token global.
- Motivo: la rama sobre el marfil está en 4,53:1. Pasa justo y no sobra en papel ni en un precio pequeño. La tinta está en 13,16:1.
- Roles: CSO, Head of Product Design, CLO.
- Impacto: `PALETTE_GATE` sigue PARTIAL. No hay paleta definitiva.
- Estado: candidata de trabajo. Pendiente del cliente.

## ADR-028 — El copy editorial sigue pendiente y va fuera del logo

- Decisión: `editorial_copy.estado` es `EDITORIAL_COPY_PENDING`. Las frases «Des de 2005» y «Pizzeria artesana» no se presentan como texto del archivo. Se midieron tres tratamientos. Las láminas V2 usan el C: descriptor separado, con la marca «Pendent de client». A no enseña el copy que el cliente tiene que cerrar. B lo coloca en el eje del logo y se lee como pie del propio dibujo.
- Motivo: la elección no es de gusto. Es para no atribuir al máster un texto que el cliente no ha validado.
- Roles: CSO, CLO, Head of Product Design.
- Impacto: `COPY_GATE` sigue PARTIAL. El máster no se edita.
- Estado: pendiente del cliente.

## ADR-029 — Una microilustración, sin ganadora

- Decisión: V2 clean no lleva dibujo. V2 illustrated lleva un solo tomate de línea en la cabecera de pizzas. No hay rama, hoja, masa ni contorno en la misma lámina. Mismo contenido, misma retícula, misma candidata.
- Motivo: el tomate marca la categoría protagonista y sale del vocabulario ya derivado del logo. Poner más dibujos sería decoración.
- Roles: Head of Product Design, CSO.
- Impacto: no se declara ganadora entre V1, V2 clean y V2 illustrated.
- Estado: estudio. V3, en ADR-030, usa el contorno de pizza ya dibujado como marca de agua, no como icono de cabecera.

## ADR-030 — La lectura sube un punto y el dibujo queda detrás

- Decisión: en la A3 de V3 cada tamaño de lectura suma 1 pt. No cambia la familia, el peso ni el tracking. La interlínea no se aprieta. Si el punto no cabe, se ajustan gaps y paddings. La pizza de línea ya estudiada (`pizzaContour`) marca el territorio de pizzas y Crea la teva. Hamburguesa, patatas, bol, helado y copa usan el mismo trazo y van detrás de su sección, en rama, con un acento de tomate solo donde la forma lo pide. Cuatro ramas de esquina, dibujadas aparte, no recortadas del logo. El copy editorial se centra en el eje de la hoja. «Pendent de client» pasa a «Pendent del client». No se reescriben las lecturas `REVIEW_REQUIRED` ni los datos confirmados.
- Motivo: el punto mejora la lectura. El dibujo identifica la zona sin convertirse en dato ni en foto.
- Roles: Head of Product Design, CPO, CDAO, CLO.
- Impacto: V2 no se sobrescribe. `/carta` no hereda las marcas de agua grandes. `PRINT_GATE` sigue cerrado.
- Estado: prototipo V3. Sin impresión. V4, en ADR-031, sustituye el dibujo y no la medida.

## ADR-031 — El dibujo de V4 se reconoce sin leer el título

- Decisión: V4 conserva la arquitectura C, la tipografía de V3, la retícula, el copy centrado y el logo. Sustituye el contorno vacío de pizza, la hamburguesa abstracta, las patatas de trazo, el bol vacío y las ramas de 28 mm. La pizza es una pieza vista desde arriba, con corteza, tomate, albahaca, queso y otros ingredientes, y cruza Pizzes y Crea la teva. Hamburguesa, patatas en cucurucho, ensalada, helado de cucurucho y copa de vino quedan detrás de su zona. Cuatro ramas distintas nacen de las esquinas. El helado y la copa son decoración: no añaden productos.
- Motivo: la revisión humana de V3 rechazó el dibujo por irreconocible, pequeño o demasiado tenue. El archivo SVG no basta; el objeto tiene que leerse en la lámina.
- Roles: Head of Product Design, CSO, CLO.
- Impacto: V2 y V3 no se sobrescriben. La tipografía no vuelve a subir ni a bajar. `PRINT_GATE` sigue cerrado.
- Estado: prototipo V4. Sin impresión.

