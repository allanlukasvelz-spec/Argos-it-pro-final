# Auditoría visual forense V1

Inspección solamente. No se ha movido, añadido ni quitado ningún elemento. No se ha rellenado ninguna sección vacía. No se ha rediseñado. No se fusiona ni se publica.

Los prototipos V2, V3 y V4 siguen en `la-bobila/print/renders/` y no son el documento de producción. La imagen conceptual no se ha usado como fuente.

No existe `linguistic-pending-resolution.md`. Ninguna grafía pendiente tiene una decisión formal posterior. Siguen visibles y sin resolver.

Medida de trabajo, sin cambiar: A3+ 329 × 483 mm. Retall horizontal 483 × 329 mm, archivo 489 × 335 mm. Retall vertical 329 × 483 mm, archivo 335 × 489 mm. Sangre 3 mm. PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR.

La medida se tomó en el DOM a escala real (96 px por pulgada, milímetros), no sobre una miniatura.

## Archivos y quién los genera

| Cara | HTML | CSS | PDF | Preview |
| --- | --- | --- | --- | --- |
| Horizontal | `la-bobila-menu-final/02_HORIZONTAL/carta-horizontal.html` | `la-bobila-menu-final/02_HORIZONTAL/carta-horizontal.css` | `la-bobila-menu-final/04_RENDERS/carta-horizontal.pdf` | `la-bobila-menu-final/04_RENDERS/carta-horizontal-preview.png` |
| Portada | `la-bobila-menu-final/03_VERTICAL/portada.html` | `la-bobila-menu-final/03_VERTICAL/carta-vertical.css` | `la-bobila-menu-final/04_RENDERS/portada.pdf` | `la-bobila-menu-final/04_RENDERS/portada-preview.png` |
| Interior | `la-bobila-menu-final/03_VERTICAL/interior.html` | `la-bobila-menu-final/03_VERTICAL/carta-vertical.css` | `la-bobila-menu-final/04_RENDERS/interior.pdf` | `la-bobila-menu-final/04_RENDERS/interior-preview.png` |
| Contraportada | `la-bobila-menu-final/03_VERTICAL/contraportada.html` | `la-bobila-menu-final/03_VERTICAL/carta-vertical.css` | `la-bobila-menu-final/04_RENDERS/contraportada.pdf` | `la-bobila-menu-final/04_RENDERS/contraportada-preview.png` |

Los cuatro HTML los escribe `la-bobila-menu-final/build-masters.mjs` leyendo solo `la-bobila-menu-final/01_SOURCE_OF_TRUTH/catalogo_normalizado.json`. El dibujo de línea entra desde `la-bobila/print/illustrations.mjs`. El logo colocado es `la-bobila/processed/logo/la-bobila-logo-presentation.png`. Los PDF y los PNG de `04_RENDERS/` son la exportación Chrome de esos HTML. El CSS no se genera: está escrito en los dos archivos de arriba.

Fuentes de contenido consultadas: `la-bobila/catalog/catalog.json`, `la-bobila-menu-final/01_SOURCE_OF_TRUTH/auditoria_fuentes.md`, `catalogo_normalizado.json`, `la-bobila-menu-final/05_QA/linguistic-audit.md`.

## Datos

Comparación de las 62 filas contra la cara horizontal y contra el interior. La portada no lleva productos. La contraportada lleva solo el bloque histórico.

| Diff | Horizontal | Interior |
| --- | --- | --- |
| NAME_DIFF | 0 | 0 |
| PRICE_DIFF | 0 | 0 |
| INGREDIENT_DIFF | 0 | 0 |
| CATEGORY_DIFF | 0 | 0 |

DATA_INTEGRITY: PASS.

Acentos, ela geminada y apóstrofos del catálogo coinciden con el texto pintado (`caramel·litzada`, `oli d'oliva`, `tomàquets`, `cèsar`). No hay carácter de reemplazo.

## Tipo medido

Contraste calculado sobre el color computado. Crema `#FAF0E7` = rgb(250, 240, 231). Tinta `#202B17` = rgb(32, 43, 23), contraste 13,16:1. Terracota `#8E4A30` = rgb(142, 74, 48), contraste 5,89:1. El filete oliva muestreado en el PNG es rgb(108, 113, 83) = `#6C7153`, contraste 4,53:1, y no lleva texto.

Fraunces 500 y Source Sans 3 400 y 600 cargan. Fraunces 600 está declarado y, en la horizontal y el interior, no se usa. En la contraportada la marca HISTORICO hereda Fraunces y el peso 600 sí carga. `font-synthesis` queda en `weight style small-caps`. Los pesos que sí se pintan están cargados: no hay falso bold en uso. Las familias de reserva (Iowan Old Style, Palatino, Georgia, Source Sans Pro, Segoe UI) están en la pila y no sustituyen a la cargada.

### Horizontal

| Rol | Selector | Familia | Peso | Tamaño | Interlínea | Tracking | Color |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SECTION_TITLE lead | `.zone--lead .zone-title` | Fraunces | 500 | 8,40 mm | 8,82 mm | normal | tinta |
| SECTION_TITLE second | `.zone--second .zone-title` | Fraunces | 500 | 6,10 mm | 6,41 mm | normal | tinta |
| SECTION_TITLE | `.zone--salad .zone-title` | Fraunces | 500 | 5,00 mm | 5,25 mm | normal | tinta |
| PRODUCT_NAME | `.zone--lead .name` | Source Sans 3 | 600 | 3,85 mm | 4,55 mm | normal | tinta |
| PRODUCT_NAME second | `.zone--second .name` | Source Sans 3 | 600 | 4,25 mm | 5,00 mm | normal | tinta |
| INGREDIENT | `.zone--lead .ings` | Source Sans 3 | 400 | 2,85 mm | 3,55 mm | normal | tinta |
| PRICE | `.zone--lead .price` | Source Sans 3 | 600 | 3,55 mm | 4,55 mm | normal | tinta |
| DESCRIPTION | — | — | — | — | — | — | El catálogo no trae descripción aparte. La lleva el ingrediente. |
| PENDING_LABEL | `.pend` | Source Sans 3 | 600 | 2,15 mm | 2,15 mm | 0,06 mm | terracota |
| NOTE | `.medida` | Source Sans 3 | 400 | 2,35 mm | 2,94 mm | normal | tinta |
| FOOTER | `.stamp` | Source Sans 3 | 600 | 3,15 mm | 3,62 mm | 0,13 mm | terracota |

### Interior

El lead sube a 9,00 mm / 9,45 mm. Smash, 7,00 mm / 7,35 mm. Sección, 5,40 mm / 5,67 mm. Nombre de pizza, 4,35 mm / 5,00 mm. Nombre smash, 4,70 mm / 5,50 mm. Ingrediente, 3,15 mm / 3,95 mm. Precio, 3,85 mm / 5,00 mm. Pendiente, 2,30 mm, tracking 0,07 mm, terracota. Nota de medida, 2,45 mm / 3,19 mm.

### Contraportada

NOTE histórica `.hist-diff`: Source Sans 3, 400, 3,45 mm / 4,60 mm, tinta. Precio histórico `.hist-price`: Source Sans 3, 600, 4,00 mm / 5,00 mm, tinta. Título histórico: Fraunces 500, 5,60 mm / 6,16 mm.

## Jerarquía

En tres segundos el orden de tamaño es el previsto. Horizontal: logo 46 × 24,81 mm, luego Pizzes 8,40 mm, Smash 6,10 mm, el resto de secciones 5,00 mm, nombres 3,85–4,25 mm, precios 3,55 mm, ingredientes 2,85 mm. El precio no supera al nombre. Interior: Pizzes 9,00 mm en la página derecha y Smash 7,00 mm en la izquierda.

HIERARCHY horizontal: WARNING. El tamaño dice que Smash es el segundo lead, pero entre Per compartir (acaba en y 124,3 mm) y Smash (empieza en y 241,7 mm) hay 117,37 mm vacíos. El segundo lead queda pegado al pie de la columna derecha.

HIERARCHY vertical: WARNING. Es otra retícula, no una horizontal reducida. Amanides y Plats del dia comparten la franja alta de la página izquierda (y 34,9–81,5 mm). Per compartir sigue debajo. Smash no aparece hasta y 410,7 mm. Pizzes ocupa la página derecha desde y 16,1 mm. El segundo lead y el lead no se leen juntos.

## Legibilidad

LEGIBILITY: WARNING. El contraste de la tinta y de la terracota aguanta luz moderada (13,16:1 y 5,89:1). El límite es el cuerpo pequeño: ingrediente horizontal 2,85 mm (unos 8,1 pt) e interior 3,15 mm; la marca PENDIENTE horizontal mide 2,15 mm (unos 6,1 pt). No hay nombres partidos (`wrapped` = 0) ni texto encima de otro texto.

## Densidad

DENSITY: WARNING. Los bloques con producto están llenos y no desbordan: Amanides 0,962, Pizzes 1, Per compartir 0,984, Smash 0,975, Crea 1. Eso es HIGH, no CRITICAL. El vacío de catálogo no es un error: Plats del dia, Postres y Begudes no tienen filas. En la horizontal ese vacío de Plats del dia se estira a 235,1 mm de alto. En el interior izquierdo, el hueco entre dos bloques con producto (Per compartir y Smash) mide 253,90 mm. En la página derecha, Begudes termina en y 278,1 mm y debajo quedan 210,9 mm hasta el borde del archivo.

## Retícula

GRID: WARNING. Las tres columnas horizontales cierran: izquierda x 8,5–110,5 mm, centro x 114,7–358,3 mm, derecha x 362,5–480,5 mm. El canal entre columnas mide 4,2 mm, como el CSS. Pizzes y Crea comparten el eje izquierdo x 114,69 mm. La desviación es el ritmo vertical: 6,99 mm entre Pizzes y Crea, 117,37 mm dentro de la columna derecha, 69,76 mm entre Crea y la banda de cierre. En el interior el canal del plec se respeta (contenido izquierdo hasta x 318 mm, derecho desde x 346 mm) y el ritmo vertical izquierdo se rompe con 253,90 mm.

## Zonas

Horizontal, en el orden medido: Amanides arriba a la izquierda; Plats del dia debajo, en la misma columna, vacío; Pizzes al centro como lead; Crea la teva pizza debajo de Pizzes (empieza 6,99 mm bajo el bloque de pizzas); Per compartir arriba a la derecha; Smash debajo, segundo por tamaño; Postres y Begudes cierran la banda y 306,5–328,5 mm.

Vertical: portada, interior y contraportada son páginas distintas. El interior no repite la horizontal a escala. La portada solo lleva logo, laureles y sello. La contraportada lleva las seis notas históricas y una zona de calidad vacía con PENDIENTE.

## Plec

El archivo interior mide 664 × 489 mm. El plec está en x 332 mm. Ningún nombre, precio, ingrediente, dibujo o imagen lo cruza. El elemento más cercano es el sello de la página izquierda, a 14,00 mm. El contenido de producto queda a ese margen o más (borde derecho izquierdo x 318 mm, borde izquierdo derecho x 346 mm).

FOLD_SAFETY: PASS.

## Sangre, retall y zona segura

SAFE_AREA: WARNING. El retall cae a 3 mm del borde del archivo. El texto medido queda a 5 mm o más dentro del retall. El logo horizontal empieza en y 8,0 mm, a 5,0 mm del retall. Dos laureles del cierre horizontal terminan en y 327,24 mm: a 4,76 mm del retall (el retall inferior está en y 332 mm). El filete oliva está a 4,5 mm del borde del archivo, esto es 1,5 mm dentro del retall. No corta texto. Sí puede desaparecer si el corte se mueve.

## Logo

Máster `la-bobila/source/logo/la-bobila-logo-reference.png`, sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. No se ha modificado. La copia colocada `la-bobila-logo-presentation.png` conserva sha256 `ba7b0648ac45efafd698510dc0d2c69782fcf41d320cadd6759e0bd77b918113`. `filter: none`. La relación 1600 × 863 se mantiene en las cuatro caras (delta de aspecto ≤ 0,0003). No hay estiramiento, recolor ni redibujo. El hash del máster es el de la ingesta cuyos píxeles leen DESDE 2005 y PIZZERIA ARTIGIANALE. El HTML no reescribe esas palabras: no aparece «Des de 2005» ni «Pizzeria artesana».

LOGO_INTEGRITY: PASS.

Resolución al tamaño pintado: horizontal 883 ppi, interior 968 ppi, contraportada 635 ppi, portada 178 ppi en 228 × 122,97 mm.

## Color, fotos, Crea, precios, pendientes, afirmaciones

Colores de texto y fondo coinciden con los candidatos `#FAF0E7`, `#202B17`, `#8E4A30`. El filete coincide con `#6C7153`. No hay una quinta familia en uso.

Fotos de producto reales: 0. Fotos generadas presentadas como plato: 0. Hay dibujo de línea en SVG, con opacidad 0,14–0,22. Cero fotos reales no es un fallo.

Crea la teva pizza muestra el paso base (`12,00`, cero ingredientes), luego carn `1,00` (8 lecturas), vegetals `0,50` (13 lecturas) y formatges `1,00` (6 lecturas). Cansalada está en vegetals, estado SOURCE_CONFLICT, marcada PENDIENTE. No se ha inventado un ingrediente de base. El grupo Altres no está pintado.

Los precios de producto y de grupo salen como `13,90`, `12,00`, `1,00`, `0,50`, `11,50`. No hay símbolo de euro, no hay `13.90` como precio y no hay puntos conductores. En la contraportada la frase de catálogo «confianza 1.00» conserva el punto. Es la nota histórica, no un precio de plato.

Las grafías dudosas siguen escritas igual y llevan PENDIENTE en horizontal e interior: Classica, Santlucar, parmesa, butifarra, all i oli, brioche, briox, salsa la bòbila, cogombree, flor di latte, y las lecturas de Crea aún sin confirmar, Cansalada incluida.

No aparecen Risotto ai quattro formaggi, FREE GLUTEN, massa mare, forn, 48 h, «25 años», ni un eslogan de origen, calidad o frescura. `fresc` y `100%` solo figuran dentro de ingredientes confirmados. «Plats del dia» es la zona vacía con estado NO_EN_CATALOGO y marca PENDIENTE, sin platos.

UNSUPPORTED_CLAIMS: 0.

## Desborde

OVERFLOW_COUNT: 0. Ningún texto sale del archivo. No hay recorte de nombres. El dibujo de la pizza sí invade Crea: 29,89 mm en la horizontal y 51,49 mm en el interior, opacidad 0,14, con el texto por encima. Es solape dentro de la página, no desborde fuera de ella.

## Impresión

Cada PDF tiene una página. Horizontal 488,95 × 335,11 mm, apaisado. Portada y contraportada 335,11 × 488,95 mm, vertical. Interior 663,96 × 488,95 mm, apaisado. La diferencia con 489 × 335, 335 × 489 y 664 × 489 queda por debajo de 0,15 mm y es redondeo del MediaBox. La sangre sigue siendo 3 mm de especificación. No se ha producido arte final.

PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR.

## Hallazgos

1. WHAT: En el interior, Smash queda separado de Per compartir por 253,90 mm vacíos. WHERE: `03_VERTICAL/interior.html`, página izquierda, entre `[data-zone="complements"]` y `[data-zone="smash"]`. WHY: Smash lleva `margin-top: auto` y el hueco se abre entre dos bloques que sí tienen productos. EVIDENCE: complements y 84,8–156,8 mm; smash y 410,7–449,8 mm. SEVERITY: HIGH. RECOMMENDED_ACTION: cuando se autorice, acercar el segundo lead al bloque de arriba sin inventar platos. No ejecutado.

2. WHAT: En la página derecha del interior, bajo Begudes quedan 210,9 mm sin uso. WHERE: `[data-zone="begudes"]`, bottom 278,1 mm, archivo 489 mm. WHY: Begudes es una sección vacía de catálogo y además no cierra la página. EVIDENCE: zona y 250,1–278,1 mm. SEVERITY: MEDIUM. RECOMMENDED_ACTION: cuando se autorice, decidir si la banda vacía cierra el pie o se queda donde está. No rellenarla con bebidas. No ejecutado.

3. WHAT: En la horizontal, 117,37 mm vacíos entre Per compartir y Smash. WHERE: `02_HORIZONTAL/carta-horizontal.html`, columna derecha. WHY: el mismo `margin-top: auto` del segundo lead. EVIDENCE: complements bottom 124,3 mm; smash top 241,7 mm. SEVERITY: MEDIUM. RECOMMENDED_ACTION: cuando se autorice, recuperar ritmo sin cambiar los datos. No ejecutado.

4. WHAT: El ingrediente y la marca PENDIENTE son pequeños para luz moderada de comedor. WHERE: `.ings` 2,85 mm y `.pend` 2,15 mm en la horizontal; en el interior, 3,15 mm y 2,30 mm. WHY: el contraste es alto, el tamaño no. EVIDENCE: tinta 13,16:1, terracota 5,89:1, cero nombres partidos. SEVERITY: MEDIUM. RECOMMENDED_ACTION: cuando se autorice, subir cuerpo de ingrediente y de pendiente sin reducir el lead. No ejecutado.

5. WHAT: El logo de portada queda a 178 ppi. WHERE: `03_VERTICAL/portada.html`, imagen 228 × 122,97 mm, original 1600 × 863. WHY: el máster no da más píxeles a ese tamaño. EVIDENCE: 1600 / (228 / 25,4) = 178. Las otras caras superan 600 ppi. SEVERITY: MEDIUM. RECOMMENDED_ACTION: no trazar ni regenerar el logo. Cuando se autorice, usar un máster de más resolución o un tamaño menor. No ejecutado.

6. WHAT: El dibujo de la pizza entra en Crea. WHERE: `.mark--pizza` dentro de `[data-zone="pizzes"]`. WHY: el SVG mide 132 mm y 150 mm y la zona de pizzas acaba antes. EVIDENCE: solape 29,89 mm horizontal y 51,49 mm interior, opacidad 0,14, texto por encima. SEVERITY: LOW. RECOMMENDED_ACTION: cuando se autorice, contener el dibujo en su zona. No ejecutado.

7. WHAT: El filete y dos laureles se acercan al corte. WHERE: filete a 4,5 mm del borde del archivo; laureles horizontales de cierre con bottom 327,24 mm. WHY: el retall está a 3 mm del borde, así que el filete queda a 1,5 mm dentro del retall y el laurel a 4,76 mm. EVIDENCE: píxel del filete rgb(108, 113, 83); cajas medidas. El texto queda a 5 mm o más. SEVERITY: LOW. RECOMMENDED_ACTION: cuando se autorice, retirar adorno de la zona de corte. No ejecutado.

8. WHAT: Plats del dia ocupa 235,1 mm de alto en la horizontal y solo muestra el título pendiente. WHERE: `[data-zone="plats-del-dia"]`. WHY: la columna estira una sección que el catálogo deja vacía. En el interior la misma zona mide 46,7 mm. EVIDENCE: ocupación 0,018. No faltan platos. SEVERITY: INFO. RECOMMENDED_ACTION: no inventar platos. El alto es una decisión de retícula, no un error de catálogo.

9. WHAT: La contraportada pinta «confianza 1.00». WHERE: nota de Bases pizza. WHY: esa frase está en `diferencia` del catálogo normalizado. No es un precio. Los precios históricos siguen en coma: 10,00 y 6,90. SEVERITY: INFO. RECOMMENDED_ACTION: no reescribir la nota en esta fase.

10. WHAT: No hay archivo de resolución lingüística. WHERE: búsqueda de `linguistic-pending-resolution.md`, ausente. WHY: las dudas del pase 3 siguen abiertas y visibles con PENDIENTE. EVIDENCE: Classica, Santlucar, parmesa, butifarra, all i oli, brioche, briox, salsa la bòbila, cogombree, flor di latte y las lecturas de Crea, en las dos caras. SEVERITY: INFO. RECOMMENDED_ACTION: no normalizar grafías sin ese archivo.

DATA_INTEGRITY: PASS
NAME_DIFF: 0
PRICE_DIFF: 0
INGREDIENT_DIFF: 0
CATEGORY_DIFF: 0
HIERARCHY_HORIZONTAL: WARNING
HIERARCHY_VERTICAL: WARNING
LEGIBILITY: WARNING
DENSITY: WARNING
GRID: WARNING
SAFE_AREA: WARNING
FOLD_SAFETY: PASS
OVERFLOW_COUNT: 0
LOGO_INTEGRITY: PASS
FOTOS_REALES: 0
FOTOS_GENERADAS: 0
UNSUPPORTED_CLAIMS: 0
BLOCKERS: 0
HIGH: 1
MEDIUM: 4
LOW: 2
PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR
OVERALL_VISUAL_GATE: PASS_WITH_CHANGES
