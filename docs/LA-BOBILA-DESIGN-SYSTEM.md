# La Bòbila — sistema de diseño

Fecha: 2026-09-22. Tokens: `la-bobila/tokens/tokens.json` y `tokens.css`.

## Dirección

Cálida, viva, sobria, actual. Marfil de fondo, verde profundo para la estructura, terracota solo en la marca («Des de 2005», el tick y el centro del filete), oliva para meta y precio, carbón cálido para ingredientes. El negro no manda. El dorado no se usa. No hay pergamino, bandera, script ni foto.

El wordmark es Fraunces, «La Bòbila», provisional. No hay un símbolo inventado haciéndose pasar por el logo. Cuando llegue el archivo real, sustituye este bloqueo; no se le pega encima.

## Color

Nombres aprobados. Hex aproximado, estado `POR_CONFIRMAR`, no muestreado de un archivo.

| Papel | Nombre | Hex |
| --- | --- | --- |
| Base | warm ivory | `#F3EEE4` |
| Lavado de módulo | warm wash | `#E9E2D4` |
| Estructura | deep green | `#1E3A32` |
| Acento | terracotta / tomato | `#C15B3A` |
| Secundario | olive | `#6E7A45` |
| Texto | warm charcoal | `#2C2825` |
| Filete | warm line | `#D4CBBC` |

Un velo radial muy bajo (terracota al 5 %, oliva al 7 %) evita el marfil plano. No es textura de foto.

## Tipo

Dos familias, ambas SIL Open Font License, archivos en `la-bobila/tokens/fonts/`. La impresión no llama a la red. El PDF incrusta subconjuntos (Fraunces Medium, Medium Italic, SemiBold; Source Sans 3 Regular, Medium, Italic).

| Uso | Familia | Fallback |
| --- | --- | --- |
| Marca y categorías | Fraunces | Iowan Old Style, Palatino, Georgia, serif |
| Producto, ingredientes, precios | Source Sans 3 | Source Sans Pro, Segoe UI, sans-serif |

Escala pensada para una A3 leída en mesa:

| Papel | Tamaño |
| --- | --- |
| Wordmark | 15,2 mm |
| Categoría protagonista | 7 mm |
| Categoría secundaria | 5,1 mm |
| Nombre de pizza | 5,4 mm |
| Hueco protagonista compositivo | 7,6 mm |
| Nombre de smash | 4,5 mm |
| Ingredientes | 3,85 mm, carbón, peso 400 |
| Precio | 3,05 mm, oliva, peso 400 |

Los ingredientes quedan más grandes y con más contraste que el precio. El precio desconocido es una raya, no un número. El hueco de nombre va en cursiva con subrayado de puntos para que «Per confirmar» no se lea como un plato.

No hay script ni display «italiano». Fraunces se eligió por ser editorial contemporánea y blanda. Source Sans 3, por la caja abierta a tamaño de ingrediente.

## Espacio, borde, radio

Espaciado: 1 / 2 / 3,2 / 4,5 / 6 mm. Filete fino 0,15 mm, regla 0,25 mm, regla fuerte 0,4 mm. Radio suave 1,6 mm, solo en el módulo de crear pizza. El resto de la lámina es recto.

## Impresión y retícula

| | |
| --- | --- |
| Formato | DIN A3 vertical |
| Corte | 297 × 420 mm |
| Sangre | 3 mm |
| Archivo | 303 × 426 mm |
| Margen desde el corte | 13 mm |
| Inserción desde el borde del archivo | 16 mm |
| Columnas | 6 |
| Calle | 4,2 mm |

La retícula admite 2 columnas, 3 columnas, 1 bloque, 4+2 y 3+3. En esta lámina:

- Bloque entero: cabecera, módulo de crear pizza, pie.
- 4+2: pizza protagonista (un hueco ancho y dos apilados).
- 3 columnas: resto de pizzas y la fila de smash.
- 3+3, que es también la variante de 2 columnas: complements junto a amanides; postres junto a begudes.

El módulo de crear pizza es un bloque con cinco columnas internas. Son cinco grupos aprobados; no se fuerzan a seis.

Marco: línea verde a 4,2 mm del borde del archivo y un filete interior de oliva. El contenido no invade la sangre.

PDF medido: 1 página, MediaBox 858,96 × 1207,92 pt (303,02 × 426,13 mm). La diferencia con 303 × 426 mm es el redondeo de Chrome, por debajo de 0,15 mm. PNG de revisión: 2290 × 3220 px (escala 2).

## Reparto de área medido

Altura de las zonas de producto, sin cabecera de marca ni pie. Medición sobre la lámina renderizada (2026-09-22):

| Zona | Alto | Parte |
| --- | --- | --- |
| Pizzes artesanes | 131,3 mm | |
| Crea la teva pizza | 42,5 mm | |
| Pizza, suma | 173,8 mm | 57,0 % |
| Smash burgers | 38,1 mm | 12,5 % |
| Per compartir + amanides | 57,2 mm | 18,7 % |
| Postres + begudes | 36,0 mm | 11,8 % |

La smash no comparte peso de marca: menos alto, sin tomate, sin hueco protagonista, título más pequeño y en oliva profundo. No hay destacado comercial (`destacado: false` en todo el catálogo). El hueco ancho de la pizza es compositivo, para juzgar `MenuItemFeatured`, no una promo.

## Componentes

Nombres estables, implementados en `la-bobila/print/components.mjs`, para carta impresa, web, móvil y carta digital.

| Componente | Qué hace ahora |
| --- | --- |
| BrandHeader | Wordmark, tipo y «Des de 2005». Olivo a la izquierda. |
| CategoryHeader | Título de sección. Badge «Per confirmar» si el peso es pendiente. |
| MenuItem | Id, nombre, ingredientes, precio. |
| MenuItemFeatured | El primer hueco de pizza. Contorno orgánico al fondo. |
| Price | Raya si el precio no está confirmado. |
| Description | Solo se pinta con descripción confirmada. No se duplica el aviso. |
| IngredientList | Línea de ingredientes, o «Per confirmar». |
| CreateYourPizzaModule | Cinco grupos, huecos sin SKU. |
| AllergenBadge | Un badge pendiente. Cero iconos inventados. |
| SectionDivider | Un filete con tick de terracota, bajo la marca. |
| FooterInfo | Cierra alérgenos, QR, contacto y la línea de marca. |
| QRBlock | Marco de esquinas. Sin código y sin enlace. |
| LegalInfo | Aviso de prueba, estado `PROPUESTA_ARGOS`. |
| ContactBlock | Adreça, horari, telèfon en pendiente. |

El id visible desaparece cuando el producto pase a `CONFIRMADO`.

## Ilustración

Dibujo de línea original, en SVG. Vocabulario: olivo, tomate, trigo, contorno de pizza. En la lámina hay tres piezas: rama de olivo en la marca, tomate junto a las pizzas, contorno en el hueco protagonista. El trigo existe en el módulo y no se coloca: una cuarta pieza empezaría a decorar. Cero fotografías. No hay material real; la regla es de cero a dos fotos fuertes, así que son cero.

## Lo provisional

Hex, wordmark, todos los productos, precios, alérgenos, QR, contacto y el aviso de la lámina (propuesta, no texto legal cerrado). La jerarquía y los nombres de sección del encargo no lo son.
