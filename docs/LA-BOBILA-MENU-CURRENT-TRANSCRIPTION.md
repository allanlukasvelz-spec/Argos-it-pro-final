# La Bòbila — transcripción de la carta vigente

Fuente primaria: `la-bobila/source/menu-current/la-bobila-carta-vigente.jpeg`.
sha256: `3484610b4d455e837d8c77568a155073894427d1ef06b424bcd1e2412bb54755`.

Pase 1: OCR del archivo entero. Pase 2: OCR de cada recorte, en color y en binario. Solo entra como `CONFIRMADO_SOURCE` lo que los dos pases leen igual. No se ha rellenado ningún precio por el de al lado. Un ingrediente no es un alérgeno legal.

Texto auxiliar de cabecera, leído: «OBERT», «FA 25 ANYS», «LA BÒBILA», «PIZZA • SMASH BURGER • BON ROTLLO», «PIZZA ARTESANA». «FORNO / TORNO ITALIANO» sale con confianza baja y no se confirma. No hay horario, teléfono ni dirección.

La moneda pinta el signo de euro en el archivo. La moneda global del catálogo sigue `POR_CONFIRMAR` y el signo no se publica.

## Pizzes — las 17 candidatas coinciden

| Producto | Precio | Ingredientes leídos | Cruce |
| --- | --- | --- | --- |
| Prosciutto | 13,90 | salsa de tomàquet, mozzarella, flor di latte, pernil dolç, orenga | MATCH. Los dos recortes leen FLOR, no FIOR. |
| Napolitana | 13,90 | salsa de tomàquet, mozzarella, fior di latte, anxoves, olives negres, ceba, orenga | MATCH. La vocal del queso no cierra: FLOR en color, FIOR en binario. |
| Gorgonzola | 13,90 | salsa de tomàquet, mozzarella, fior di latte, bacon, ceba caramel·litzada, gorgonzola, nous, orenga | MATCH. ORIGINAL BACON. No se cambia a bacó. |
| Verdura | 13,90 | salsa de tomàquet, mozzarella, fior di latte, ceba, carbassó, pebrot, xampinyons, albergínia, orenga | MATCH. |
| High Protein | 15,90 | salsa de tomàquet, mozzarella, fior di latte, carn de vedella, bacó, frankfurt, ou, xampinyons, salsa barbacoa, orenga | MATCH. |
| Toscana | 13,90 | salsa de tomàquet, mozzarella, fior di latte, cabra, nous, mel, ceba caramel·litzada, orenga | MATCH. |
| 4 Estacions | 15,90 | 1/4 xampinyons i salami i salsa de tòfona; 1/4 pernil dolç i ceba caramel·litzada; 1/4 pebrot vermell i olives verdes i anxoves; 1/4 carxofa i salsa barbacoa; mozzarella fior di latte, orenga | MATCH. El recorte lee DOIÇ; la página lee DOLC. Es pernil dolç. |
| Piera | 13,90 | salsa de tomàquet, mozzarella, fior di latte, xampinyons, sobrassada, bacó, tomàquets cherry, ou, orenga | MATCH. |
| Tropical | 13,90 | salsa de tomàquet, mozzarella, fior di latte, pernil dolç, pinya, orenga | MATCH. |
| 6 Formatges | 15,90 | mozzarella, emmental, cheddar, roquefort, cabra, gorgonzola, orenga, sobre salsa de tomàquet | MATCH. Seis quesos. |
| Tartufata | 13,90 | salsa de tòfona, mozzarella, fior di latte, bacó, ceba, xampinyons, orenga | MATCH. |
| Carbonara | 13,90 | salsa carbonara, mozzarella, fior di latte, bacó, ou, parmesa, orenga | MATCH. ORIGINAL PARMESA. No se reescribe parmesà. |
| Miss Smash | 13,90 | salsa de tomàquet, mozzarella, fior di latte, carn picada de vedella, ceba, emmental fresc, formatge de cabra, orenga | MATCH. |
| Fitness | 15,90 | salsa de tomàquet, mozzarella, fior di latte, rúcula, olives, espinacs, alvocat, pernil dolç, orenga | MATCH. |
| Blanca | 15,90 | gorgonzola, poma, nous, mel | MATCH. Ningún pase lee tomàquet. No se añade. |
| Catalana | 15,90 | butifarra, ou, ceba, all i oli, xampinyons | MATCH. No hay línea de mozzarella. |
| Mallorquina | 15,90 | sobrassada, mel, formatge de cabra fos, ceba | MATCH. El recorte lee CESA; la página lee CEBA. |

Ningún nombre candidato queda en `NOT_FOUND` ni en `MISMATCH`.

## Amanides

| Producto | Precio | Ingredientes |
| --- | --- | --- |
| Amanida cèsar | 11,50 | enciam fresc, pollastre, crostons, salsa cèsar, formatge parmesà |
| Amanida grega | 11,50 | tomàquet cherry, cogombre, ceba, pebrot vermell, olives verdes, daus de formatge feta, orenga, oli d'oliva verge 100% |
| Amanida verda | 11,50 | enciam fresc, ceba, cogombree, tomàquet, olives variades, tonyina |

ORIGINAL de la verda: COGOMBREE. No se corrige. En la smash el mismo archivo lee COGOMBRET.

## Smash

| Producto | Precio | Ingredientes |
| --- | --- | --- |
| Classica | 11,50 | doble smash de vedella 100%, tomàquet, ceba, formatge cheddar, cogombret, enciam fresc, pa de brioche, salsa la bòbila |
| La Bòbila de luxe | 13,50 | doble smash de vedella 100%, tomàquet, ceba, formatge cheddar, enciam fresc, bacó cruixent, ou, salsa la bòbila, pa de briox |
| Cheese burger trufat | 13,90 | doble smash de vedella 100%, formatge cheddar, salsa de tòfona negra, pa de briox |
| Pollo aguacate burger | 12,90 | pit de pollastre a l'estil la bòbila, alvocat, tomàquet, formatge cheddar, ceba, enciam fresc, maionesa |

Classica no lleva acento en el archivo. Pollo aguacate burger no se traduce. Un recorte estrecho de la de luxe leyó 3,50 al cortar el 1. La página y un recorte ancho leen 13,50.

## Complements

| Producto | Precio | Nota |
| --- | --- | --- |
| Patates de blat de moro fregides super cruixents | 5,90 | |
| Patates clàssiques fregides al punt de sal | 5,90 | |
| Top fries cheddar & bacon | 7,90 | patates fregides amb cheddar fos i bacó |
| Bombons cruixents de formatge brie i melmelada de tomàquet (4 unitats) | 7,90 | la segunda línea lee IMERMELADA; es «i melmelada» |
| Gambes de Santlucar cruixents a l'estil la bòbila | 7,90 | ORIGINAL SANTLUCAR. No se acentúa. |
| Alets de pollastre amb salsa barbacoa | 7,90 | sin ingredientes aparte |
| Pit de pollastre cruixent a l'estil la bòbila | 7,90 | |
| Tequeños | 7,90 | sin ingredientes aparte |
| Croquetes de pernil ibèric | 7,90 | |
| Croquetes de gambes vermelles | 7,90 | |
| Calamars | 7,90 | |

Son 11. No se han fusionado ni renombrado.

## Crea la teva

Base: BASES PIZZA 12,00. La foto no nombra tomàquet ni nata. No se inventan.

Cabeceras de suplemento, las dos pases: CARN 1, VERDURA 0,50, FORMATGES 1. El suplemento está en la cabecera, no en cada línea.

Confirmados en carn: pernil dolç, vedella, bacó, pollastre, frankfurt, mini discs smash.
En revisión: pernil ibèric, tonyina.

Confirmados en verdura: ceba caramel·litzada, carbassó, rúcula, albergínia, olives, tomàquets cherry, tomàquet natural, olives verdes, olives negres.
En revisión: pebrot vermell, carxofa, xampinyons.

Cansalada: los dos pases la leen con confianza alta en la columna de verdura, no bajo CARN.
ORIGINAL: columna vegetals. NORMALIZED_CATEGORY: carn. STATUS: REVIEW_REQUIRED. No se mueve.

Formatges: el pie de la foto no se lee. Mozzarella, emmental, formatge de cabra, roquefort, parmesà y feta quedan en revisión. No se confirma un cheddar de esa columna: el OCR no lo sostiene.

No hay grupo Altres en esta foto.

## Alérgenos

Capa legal vacía. No se publica leche por la mozzarella ni gluten por la masa.
