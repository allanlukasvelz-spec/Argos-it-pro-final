STATUS:
PARTIAL

BASELINE:
PASS

QR P0:
PARTIAL

MOBILE MENU:
PARTIAL

SOURCE OF TRUTH:
PASS

A3:
Estudio de proporción actualizado, no carta publicada. Una página, DIN A3 vertical, archivo de sangrado 303 × 426 mm. MediaBox medido 858,96 × 1207,92 pt (303,02 × 426,13 mm): el redondeo de Chrome queda por debajo de 0,15 mm y no bloquea esta fase. Zonas de producto: pizzes 125,6 mm + crea 37,9 mm = 163,5 mm (58,2 %); smash 29,3 mm (10,4 %); per compartir + amanides 64,9 mm (23,1 %); postres + begudes 23,0 mm (8,2 %). El módulo «La carta al teu mòbil» queda fuera de ese reparto, con QR_DEV (http://127.0.0.1:4173/carta), corrección Q, zona muda, negro sobre blanco y la etiqueta de que no es el código de producción. QR_PRODUCTION no se dibuja.

LOGO:
PLACEHOLDER. El logo visual existe fuera del repositorio y no está ingerido. Los hex siguen POR_CONFIRMAR. Fraunces y Source Sans 3 siguen como tipografía candidata.

CATALOG:
0.2.0, revisión 2026-09-22. Única fuente. 17 pizzas con nombre en SOURCE_MISSING (LB-PIZ-001…017), fuente extraccion-textual-2026-09-22-sin-documento; precio, ingredientes, alérgenos, descripción y foto en null; ninguna CONFIRMADO. Crea la teva: solo etiquetas Base pizza, Carn, Vegetals, Formatges, sin SKU. Smash: 4 huecos sin nombre (LB-BUR-001…004). Amanides: 3 (LB-AMA-001…003). Complements: 11 (LB-COM-001…011). Postres: nota HISTORICO de sección, cero productos. Begudes: sección POR_CONFIRMAR, cero productos. Sin combos. 35 filas, 0 precios, 0 confirmadas.

FILES CREATED:
docs/LA-BOBILA-QR-QA.md
la-bobila/catalog/validate.mjs
la-bobila/mobile/carta.css
la-bobila/mobile/carta.html
la-bobila/mobile/check.mjs
la-bobila/mobile/components.mjs
la-bobila/mobile/render.mjs
la-bobila/mobile/server.mjs
la-bobila/print/qr-svg.mjs
la-bobila/print/vendor/qrcode.mjs
la-bobila/print/vendor/qrcode-LICENSE.txt

FILES MODIFIED:
.cursor/rules/la-bobila-multitalk.md
docs/LA-BOBILA-DATA-MODEL.md
docs/LA-BOBILA-DECISIONS.md
docs/LA-BOBILA-DESIGN-SYSTEM.md
docs/LA-BOBILA-MASTER-SPEC.md
docs/LA-BOBILA-STATUS.md
la-bobila/README.md
la-bobila/catalog/catalog.json
la-bobila/print/carta-a3.html
la-bobila/print/carta.css
la-bobila/print/components.mjs
la-bobila/print/export.mjs
la-bobila/print/render.mjs
la-bobila/print/renders/carta-a3.pdf
la-bobila/print/renders/carta-a3.png

TESTS:
`node la-bobila/mobile/check.mjs` pasó el 2026-09-22: un solo catalog.json; Prosciutto y Mallorquina en A3 y en /carta; sin palabras de alérgeno inventadas; sin precios en euros; sin URL https; destino de desarrollo http://127.0.0.1:4173/carta etiquetado QR_DEV; QR_PRODUCTION destino null y BLOQUEADO; /carta es HTML; h1 y h2; CSS con min-height 44px; costura de analítica inactiva y sin script src; GET / responde 302 a /carta; CSS y fuente local servidos.
Revisión visual de la lámina (cabecera, 17 nombres, crea, smash, complements, amanides, postres, begudes, módulo QR_DEV, pie) y de /carta a 390 px (banner de no publicado, nav vertical, nombres, precios en raya, ingredientes y alérgenos en «Per confirmar», pie de contacto vacío). scrollWidth 390: sin desbordamiento horizontal.
Las 10 pruebas de dispositivo de docs/LA-BOBILA-QR-QA.md no se han ejecutado. El QR no se ha leído con cámara: BarcodeDetector no está en este Chrome y no hay zbar ni opencv. La generación se comprobó por estructura (versión 3, ECC Q, zona muda, URL local). QR y menú móvil no son PASS.

MULTITALK REVIEW:
CEO: El nombre y el oficio siguen en la lámina y en /carta. Sin el logo real no es reconocible como La Bòbila más allá de un wordmark placeholder. El reconocimiento no pasa.
CPO: A3 y /carta salen del mismo catálogo y muestran el mismo vacío. Son el mismo producto a medias: la experiencia existe y los datos no.
COO: Un JSON y un validador compartido se pueden mantener. Nadie puede actualizar precios que no están en el archivo. Infraestructura sí; carta viva, no.
CSO: La paleta provisional y la tipografía candidata sostienen un tono mediterráneo artesano. Sigue siendo un estudio, no la identidad cerrada.
CRO: La navegación vertical ayuda a encontrar categorías. No hay ofertas, combos ni destacados inventados. Tampoco hay un precio que ayude a elegir.
CDAO: Hay una fuente. Impresión y móvil se generan desde catalog.json y se contrastaron. La fuente pasa. El contenido no está contrastado con el documento de carta.
Head of Product Design: Tokens y fuentes locales compartidos; la UX móvil no es un A3 comprimido. La jerarquía se lee. El vacío donde faltan datos es correcto y deja la pieza incompleta.
CTO: /carta es estable, la redirección local ilustra el mecanismo futuro y QR_DEV está separado de QR_PRODUCTION. La arquitectura aguanta. El destino de producción no existe.
CISO: El servidor escucha solo en 127.0.0.1. No hay login, cookies ni tracker, ni URL pública. El riesgo de esta fase es bajo. QR_DEV no puede salir a imprenta.
CLO: Alérgenos, contacto, legal y privacidad están bloqueados o vacíos. Los nombres SOURCE_MISSING no se presentan como confirmados y el banner lo dice. Correcto para un estudio e insuficiente para publicar.
Customer Success: Un comensal entiende que esto no es la carta publicada. No puede consultar un precio ni un alérgeno real. El módulo QR promete información que la página todavía no tiene.
Chief of Staff: PARTIAL — CONTINUE. No está terminado.

BLOCKERS P0:
No hay dominio público: QR_PRODUCTION sigue bloqueado.
Las 10 pruebas de dispositivo no se han ejecutado.
El documento de la carta vigente no está ingerido: los nombres de pizza no están contrastados y los precios e ingredientes que existen fuera del repo no están en el catálogo.
No hay matriz de alérgenos.

BLOCKERS P1:
Muestrear el logo cuando el archivo esté en el repo.
Ingerir la carta histórica.
La PWA está documentada y no construida.
No hay sitio público.
Faltan la autorización de imprenta y la prueba de máquina.

DATA EXTERNALLY AVAILABLE BUT NOT YET INGESTED:
Logo visual de La Bòbila.
Carta vigente.
Carta histórica.
Primera extracción de productos y clasificación por categorías. Los 17 nombres están registrados como texto; el documento fuente no está en el repo.
Precios visibles en la carta vigente. Los valores no están en este encargo y no se inventan.
Ingredientes visibles en la carta vigente. Igual: no se inventan.
Concepto visual aprobado.
Formato DIN A3 vertical aprobado.

DATA ACTUALLY MISSING FROM CLIENT:
Dominio público definitivo.
Catálogo de bebidas confirmado.
Confirmación de que los postres y los gelats históricos siguen vigentes.
Combos o packs.
Matriz de alérgenos.
Autorización para imprimir.

NEXT ACTION:
Ingerir en el repositorio el logo existente y la carta vigente desde los archivos de origen. Después, muestrear el logo sobre una copia (el máster no se modifica) y rellenar solo los hechos contrastados con esos documentos. QR_PRODUCTION sigue bloqueado hasta que exista un dominio.
