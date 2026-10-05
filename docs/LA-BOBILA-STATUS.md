Los prototipos V2, V3 y V4 siguen en `la-bobila/print/renders/` y no son este documento de producción. La auditoría de la fase 1 sigue debajo.

STATUS:
FASE: MÁSTERES EDITORIALES EN PROTOTIPO

No se fusiona, no se publica y no se imprime. Sello: PROTOTIPO / REVISIÓN / PENDIENTE. La medida sigue sin confirmar por la imprenta.

QUÉ SE HA MAQUETADO:
Cara horizontal 489 × 335 mm: Amanides, Pizzes artesanes, Crea la teva pizza (base, carn, vegetals, formatges), Per compartir / complements y Smash burgers. Libro vertical reconstruido: portada con el logo oficial, doble página 664 × 489 mm (plec al centro) e interior con los mismos hechos, contraportada con las seis notas históricas confirmadas.

QUÉ QUEDA VACÍO:
Plats del dia, Postres y Begudes, sin productos. Base de Crea, sin ingredientes confirmados. Formatges, sin nombre confirmado. Calidad de la contraportada, sin frase confirmada. Sin fotos, sin Altres, sin salses vigentes y sin gelats vigentes.

QA:
`la-bobila-menu-final/05_QA/qa-horizontal.md` PASS. `la-bobila-menu-final/05_QA/qa-vertical.md` PASS. Cero discrepancias de nombre, precio o ingrediente. El plec no corta ningún hecho.

VISTAS:
`/cursor/stores/bc-70d42429-279a-4600-b0fd-616ef926aa11/media/carta-horizontal-preview.png`
`/cursor/stores/bc-70d42429-279a-4600-b0fd-616ef926aa11/media/carta-vertical-preview.png`

STATUS ANTERIOR:
FASE: 1 AUDITORÍA

CATÁLOGO:
`la-bobila/catalog/catalog.json`, versión 0.4.1, revisión 2026-09-22. 62 productos: 50 CONFIRMADO y 12 REVIEW_REQUIRED en el archivo maestro. Por sección: 17 pizzes, 4 smash, 11 complements, 3 amanides, 27 crea. Postres y begudes no tienen productos. El normalizado de esta fase está en `la-bobila-menu-final/01_SOURCE_OF_TRUTH/catalogo_normalizado.json`: 50 CONFIRMADO, 11 PENDIENTE DE CONFIRMAR y 1 SOURCE_CONFLICT. Los precios confirmados conservan dos decimales. La presentación sigue EUR_PENDING_PRESENTATION.

LOGO:
`la-bobila/source/logo/la-bobila-logo-reference.png`. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. Los píxeles dicen «DESDE 2005» y «PIZZERIA ARTIGIANALE». No se ha reescrito.

FOTOS REALES:
Ninguna foto de producto. `la-bobila/source/photos/` está vacío. Las únicas fotografías son la carta vigente y la carta histórica, más el logo.

IMÁGENES QUE NO SON FUENTE:
Renders V1, V2 clean, V2 illustrated, V3, V4, `carta-a3` y las dos comparaciones de paleta. La variante de colocación del logo. La imagen conceptual `referencia-conceptual-carta.png`. No se ha transcrito.

CONTRADICCIONES:
El logo dice «DESDE 2005» y «PIZZERIA ARTIGIANALE». El copy «Des de 2005» y «Pizzeria artesana» es editorial y sigue pendiente. No se calcula «25 años». 6 Formatges vigente es 15,90, CONFIRMADO_SOURCE, fuente de la carta vigente. Una banda histórica, anotada en `docs/LA-BOBILA-MENU-DIFF.md`, lee 13,90 y no está guardada como precio del producto ni en `historico`. Bases: histórica 10,00 y vigente 12,00, cada una con su asset. Piera, Verdura y Miss Smash cambian de ingredientes entre periodos y esas diferencias citan la foto histórica. High Protein vigente y High-Protein histórica son el mismo nombre de periodo distinto. Ningún producto vigente cita los dos assets a la vez.

PENDIENTE DE CONFIRMAR:
Copy editorial. Moneda y símbolo. Alérgenos. Dirección, horario, teléfono, redes, privacidad y texto legal. QR de producción, sin destino. Begudes, vacía. Postres vigentes, vacíos. Grupo Altres. Salses, solo históricas y sin copiar. Gelats históricos a 6,90, sabores ilegibles y fuera de la carta vigente. Lecturas abiertas del pie de Crea la teva: Pernil ibèric, Tonyina, Pebrot vermell, Carxofa, Xampinyons, Mozzarella fior di latte, Emmental, Formatge de cabra, Roquefort, Parmesà, Formatge feta. Lecturas que el catálogo ya dejó sin cerrar dentro de platos confirmados: FLOR/FIOR, BACON/BACÓ, PARMESA, COGOMBREE/COGOMBRET, Santlucar, Classica, briox. Free gluten, massa mare, forn y 48 h. Medida A3+ con la imprenta.

SOURCE_CONFLICT:
Cansalada. El catálogo la lee en la columna de vegetals y una nota interna la clasificaría como carn. No se mueve. En el normalizado el nombre queda null y el estado es SOURCE_CONFLICT. No hay otra fila vigente que mezcle la cita histórica con la vigente.

MEDIDA A3+:
Provisional 329 × 483 mm. Cara horizontal 483 × 329 mm, archivo con sangre 489 × 335 mm. Página vertical 329 × 483 mm, archivo con sangre 335 × 489 mm. Sangre 3 mm. PENDIENTE DE CONFIRMAR con la imprenta. No es medida final.

NO SE HA MAQUETADO:
Sí.

NEXT ACTION:
Aceptar esta auditoría. No hay fase de diseño hasta entonces.

## VISUAL FORENSIC AUDIT V1

Inspección solamente. No se ha editado la carta, el catálogo, el HTML, el CSS ni el logo. Los prototipos V2, V3 y V4 siguen en `la-bobila/print/renders/` y no son el documento de producción.

OVERALL_VISUAL_GATE: PASS_WITH_CHANGES
DATA_INTEGRITY: PASS (NAME_DIFF 0, PRICE_DIFF 0, INGREDIENT_DIFF 0, CATEGORY_DIFF 0)
LOGO_INTEGRITY: PASS
FOLD_SAFETY: PASS
OVERFLOW_COUNT: 0
PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR

Informe: `la-bobila-menu-final/05_QA/visual-forensic-audit-v1.md`
Capturas: `la-bobila-menu-final/05_QA/visual-audit-v1/`
NEXT ACTION: esperar autorización antes de cualquier corrección.
