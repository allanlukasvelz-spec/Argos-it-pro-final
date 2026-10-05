Los prototipos V2, V3 y V4 siguen en `la-bobila/print/renders/` y no son este documento de producción.

STATUS:
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
