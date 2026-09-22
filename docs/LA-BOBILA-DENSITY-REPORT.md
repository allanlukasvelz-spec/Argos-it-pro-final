# La Bòbila — densidad

Fecha: 2026-09-22. Medido sobre el render regenerado `la-bobila/print/renders/carta-a3.png`, sin cambiar el cuerpo de letra. 1 mm ≈ 3,78 px en la lámina de 1145×1610 px.

La fila de la A3 (`MenuRow`) pinta nombre y precio. No pinta la línea de ingredientes. Esas líneas sí están en `/carta`. No se ha cambiado el componente para meterlas: caben en el hueco libre de pizzes, y meterlas sería otro diseño.

| Categoría | Ítems | Líneas medias en A3 | Líneas máx. | Alto usado | Alto disponible | Ocupación | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pizzes | 17 | 1 (nombre) | 1 | 42,6 mm | 125,7 mm de zona | 0,34 | PASS |
| Crea la teva | 27 nombres, 4 grupos | la columna de verdura pasa de 13 | la lista mide 85,7 mm | 85,7 mm | 37,9 mm | 2,26 | OVERFLOW |
| Smash | 4 | 2 filas | el bloque se pasa 0,8 mm | 30,2 mm | 29,3 mm | 1,03 | TIGHT |
| Complements | 11 | 1, alguna se parte | el bloque se pasa 1,3 mm | 66,2 mm | 64,8 mm | 1,02 | TIGHT |
| Amanides | 3 | 1 | 1 | 19,1 mm | 64,8 mm | 0,29 | PASS |
| Postres | 0 | nota de sección | 1 | cabe en 23,0 mm | 23,0 mm | cabecera | PASS |
| Begudes | 0 | hueco «Per confirmar» | 1 | cabe en 23,0 mm | 23,0 mm | cabecera | PASS |

Crea la teva recorta la columna de vegetals a partir de rúcula y deja formatges en la cabecera. El tipo no se ha bajado para que quepa. Smash y complements rozan el corte por unos píxeles: TIGHT, no un desbordado de bloque.

A3 de conjunto: OVERFLOW, por Crea la teva.

`/carta` no es una lámina fija. A 390 px y a 1280 px no hay scroll horizontal. La página crece en vertical con ingredientes. Eso no es overflow de impresión. El pase de dispositivo del QR no está hecho.
