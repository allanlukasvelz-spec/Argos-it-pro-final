# La Bòbila — densidad

Fecha: 2026-09-22. Medido sobre `la-bobila/print/renders/carta-a3-editorial-v1.png`, arquitectura C, candidata de color B. Lámina 303×426 mm. El tipo de Crea la teva sube de 3,2 mm a 3,6 mm. No se ha encogido para que cupiera.

La fila de producto pinta nombre y precio, sin signo de euro y con dos decimales. La línea de ingredientes sigue en `/carta`.

| Categoría | Ítems | Alto disponible | Alto usado | Ocupación | Cuerpo | Interlínea | Líneas máx. | Desborde | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pizzes | 17 | 60,9 mm | 42,5 mm | 70 % | 4,1 mm | 4,7 mm | 1 | no | PASS |
| Crea la teva | 27 | 72,4 mm | 72,4 mm | la banda es su contenido; la lista fluye en 40,8 mm | 3,6 mm | 4,9 mm | 2 | no | PASS |
| Smash | 4 | 32,8 mm | 25,7 mm | 78 % | 3,7 mm | 4,3 mm | 1 | no | PASS |
| Complements | 11 | 78,6 mm | 72,1 mm | 92 % | 3,7 mm | 4,3 mm | 1, alguna se parte | no | PASS |
| Amanides | 3 | 78,6 mm | 19,1 mm | 24 % | 3,7 mm | 4,3 mm | 1 | no | PASS |
| Postres | 0 | 11,5 mm | nota de sección | cabecera | 3,2 mm | 1,3 | 1 | no | PASS |
| Begudes | 0 | 11,5 mm | hueco «Per confirmar» | cabecera | 3,2 mm | 1,3 | 1 | no | PASS |

Crea la teva: carn cabe en 1 línea (8 nombres), vegetals en 2 (13), formatges en 1 (6). La base no tiene lista: el precio 12,00 va en la banda. El pie de la lámina termina en el margen de 16 mm. No hay categoría fuera de la página.

## V2

Medido el 2026-09-22 sobre la candidata B, arquitectura C, cuerpo de Crea la teva sin cambios (3,6 mm, interlínea 4,86 mm). Logo a 36 mm. Tratamiento de copy C.

| Categoría | Ítems | Alto disponible | Alto usado | Ocupación | Cuerpo | Desborde | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pizzes | 17 | 55,7 mm | 46,1 mm | 83 % | 4,2 mm | no | PASS |
| Crea la teva | 27 | 75,9 mm | lista en 2 líneas como máximo | banda | 3,6 mm | no | PASS |
| Smash | 4 | 32,8 mm | 25,7 mm | 78 % | 3,6 mm | no | PASS |
| Complements | 11 | 78,6 mm | 72,1 mm | 92 % | 3,7 mm | no | PASS |
| Amanides | 3 | 78,6 mm | 19,1 mm | 24 % | 3,7 mm | no | PASS |

La pizza ocupa más de su zona que en V1 porque el descriptor editorial usa el aire que antes quedaba dentro de esa zona. Sigue por encima de la smash. El pie cierra otra vez a 16 mm del borde. Ningún nombre de fila parte en dos líneas.

Complements ocupa el 92 % de su columna porque el alto incluye la cabecera y las filas. No hay recorte. Por eso es PASS y no TIGHT. Amanides, en la misma fila, deja aire.

La pizza sigue por delante: zona 60,9 mm frente a 32,8 mm de smash, cuerpo mayor, y 18 mm de aire dentro de su zona.

A3 de conjunto: PASS. 0 OVERFLOW.

`/carta` no es una lámina fija. En 320, 360, 390 y 430 px no hay scroll horizontal. La página crece en vertical. El pase físico del QR no está hecho.
