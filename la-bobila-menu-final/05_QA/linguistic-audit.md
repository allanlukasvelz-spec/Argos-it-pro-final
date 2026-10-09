# La Bòbila — pase lingüístico doble

Fase 3. No se ha maquetado. No se ha modificado `catalog.json` ni el catálogo normalizado. Ningún nombre confirmado se ha traducido ni corregido.

Lengua de la carta: catalán. Se conservan los nombres comerciales confirmados en inglés, italiano, francés o castellano tal como están escritos. `Risotto ai quattro formaggi` no está en el catálogo y no se añade. No se añaden free gluten, massa mare, forn, 48 h ni plats del dia. Cansalada no se mueve de columna.

## Qué se ha revisado

Dos pases, el segundo sin mirar las marcas del primero, sobre el catálogo normalizado.

- 62 filas de producto.
- 176 ingredientes en esas filas.
- 7 títulos de sección y 5 etiquetas de grupo.
- 6 nombres del bloque histórico.
- 161 formas distintas en total.

Las notas internas en castellano del campo `diferencia` no son texto de carta y no se han tocado.

## Se dejan como están

Formas catalanas ya regulares, entre otras: Pizzes artesanes, Crea la teva pizza, Per compartir / complements, Amanides, Postres, Begudes, Carn, Vegetals, Formatges, 4 Estacions, 6 Formatges, Patates clàssiques, Patates de blat de moro, Croquetes de pernil ibèric, Croquetes de gambes vermelles, Calamars, Amanida cèsar, Amanida grega, Amanida verda, Pernil dolç, Bacó, Albergínia, Carbassó, Rúcula, Tomàquet natural, salsa de tomàquet, anxoves, orenga, sobrassada, alvocat, maionesa, melmelada de tomàquet, formatge de cabra fos, oli d'oliva verge, a l'estil, ceba caramel·litzada.

La ela geminada de `caramel·litzada` es la forma normativa. No se marca.

Nombres comerciales confirmados que no se traducen: High Protein, Fitness, Miss Smash, Smash burgers, Cheese burger trufat, Top fries cheddar & bacon, Mini discs smash, bacon, cherry, Prosciutto, Napolitana, Gorgonzola, Toscana, Tartufata, Carbonara, mozzarella, fior di latte, salami, cheddar, brie, Tequeños, Frankfurt, Pollo aguacate burger.

`flor di latte` en Prosciutto se deja escrito así porque los dos recortes de la foto leen FLOR. No se unifica con `fior`.

## PENDIENTE DE CONFIRMAR

Duda de grafía. El texto del catálogo no cambia.

| Id | Texto que queda | Duda |
| --- | --- | --- |
| LB-BUR-001 | Classica | Acento. No se escribe Clàssica. |
| LB-COM-005 | Santlucar | Topónimo y acento. No se reescribe. |
| LB-PIZ-012 | parmesa | Acento. En la amanida cèsar el mismo queso ya figura como formatge parmesà. No se unifican. |
| LB-PIZ-016 | butifarra | Grafía. No se cambia a botifarra. |
| LB-PIZ-016 | all i oli | Límite de palabra. No se junta en allioli. |
| LB-BUR-001 / LB-BUR-002 / LB-BUR-003 | pa de brioche / pa de briox | Dos grafías confirmadas del mismo pan. No se unifican. |
| LB-BUR-001 / LB-BUR-002 | salsa la bòbila | Preposición. No se inserta «de». |
| LB-AMA-003 | cogombree | Grafía. En la Classica el catálogo lee cogombret y en la grega cogombre. No se corrige. |
| LB-PIZ-001 | flor di latte | Vocal italiana. No se cambia a fior. |

## Ya pendientes, sin nueva corrección

Siguen en el estado de la fase 1, y este pase no les da una grafía nueva: Pernil ibèric, Tonyina, Pebrot vermell, Carxofa, Xampinyons, Mozzarella fior di latte, Emmental, Formatge de cabra, Roquefort, Parmesà, Formatge feta.

Cansalada sigue en SOURCE_CONFLICT, en la columna de vegetals. No se mueve a carn. La palabra, si la lectura fuera la buena, es catalán regular; el conflicto es de columna, no de acento.

## Fuera de la carta

No están y no se añaden: Risotto ai quattro formaggi, free gluten, massa mare, forn, 48 h, plats del dia, «25 años».

## CLIENT_CONFIRMED_CORRECTION

Corrección lingüística V1, sobre el commit `b34624b`. El pase 3 de arriba queda como historia: en aquel momento no se tocó el catálogo. Estas ocho dudas ya tienen corrección confirmada. Santlucar no entra.

| Id | Antes | Después | Estado |
| --- | --- | --- | --- |
| LB-BUR-001 | Classica | Clàssica | CLIENT_CONFIRMED_CORRECTION |
| LB-PIZ-012 | parmesa | parmesà | CLIENT_CONFIRMED_CORRECTION |
| LB-PIZ-016 | butifarra | botifarra | CLIENT_CONFIRMED_CORRECTION |
| LB-PIZ-016 | all i oli | allioli | CLIENT_CONFIRMED_CORRECTION |
| LB-BUR-001 | pa de brioche | pa de brioix | CLIENT_CONFIRMED_CORRECTION |
| LB-BUR-002 | pa de briox | pa de brioix | CLIENT_CONFIRMED_CORRECTION |
| LB-BUR-003 | pa de briox | pa de brioix | CLIENT_CONFIRMED_CORRECTION |
| LB-BUR-001 | salsa la bòbila | salsa La Bòbila | CLIENT_CONFIRMED_CORRECTION |
| LB-BUR-002 | salsa la bòbila | salsa La Bòbila | CLIENT_CONFIRMED_CORRECTION |
| LB-AMA-003 | cogombree | cogombre | CLIENT_CONFIRMED_CORRECTION |
| LB-PIZ-001 | flor di latte | fior di latte | CLIENT_CONFIRMED_CORRECTION |

La marca PENDIENTE de esas grafías sale de la carta. No se añade ni se quita ningún ingrediente. `cogombret` sigue en la Clàssica. `formatge parmesà` de la amanida cèsar no se toca. Los `fior di latte` que ya estaban bien no se reescriben.

Santlucar sigue literal en LB-COM-005: PENDIENTE_DE_CONFIRMAR.

Siguen pendientes, sin grafía nueva: Pernil ibèric, Tonyina, Pebrot vermell, Carxofa, Xampinyons, Mozzarella fior di latte, Emmental, Formatge de cabra, Roquefort, Parmesà, Formatge feta. Cansalada sigue en SOURCE_CONFLICT, en vegetals.

LANGUAGE_GATE: PASS_WITH_PENDING
