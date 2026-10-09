# La Bòbila — sistema de diseño

Fecha: 2026-09-22. Tokens: `la-bobila/tokens/tokens.json` y `tokens.css`.

## Dirección

Cálida, viva, sobria, actual. Marfil de fondo, verde profundo para la estructura, terracota solo en la marca («Des de 2005», el tick y el centro del filete), oliva para meta y precio, carbón cálido para ingredientes. El negro no manda. El dorado no se usa. No hay pergamino, bandera, script ni foto.

El wordmark es Fraunces, «La Bòbila», estado `PLACEHOLDER`. No hay un símbolo inventado. Cuando llegue el archivo de logo: se conserva el máster, se trabaja sobre una copia optimizada, se muestrean los colores, se documenta el muestreo y se compara con esta paleta. Hasta entonces los hex siguen `POR_CONFIRMAR`.

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

Dos familias candidatas, no una decisión irreversible. Ambas SIL Open Font License, archivos en `la-bobila/tokens/fonts/`. La impresión no llama a la red. El PDF incrusta subconjuntos (Fraunces Medium, Medium Italic, SemiBold; Source Sans 3 Regular, Medium, Italic). Se evaluarán más adelante sobre una A3 real: carácter, catalán, números, precios, ingredientes, impresión y móvil. No se cambian en este pase.

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

- Bloque entero: cabecera, módulo de crear pizza, módulo QR, pie.
- 3 columnas: los 17 nombres de pizza.
- 2 columnas: las cuatro smash.
- 3+3: complements junto a amanides; postres junto a begudes.
- 4+2 sigue definido en el CSS para un destacado confirmado. Esta lámina no lo usa: no hay destacado.

El módulo de crear pizza es un bloque con cuatro etiquetas. No hay toppings.

Marco: línea verde a 4,2 mm del borde del archivo y un filete interior de oliva. El contenido no invade la sangre.

PDF medido: 1 página, MediaBox 858,96 × 1207,92 pt (303,02 × 426,13 mm). La diferencia con 303 × 426 mm es el redondeo de Chrome, por debajo de 0,15 mm. PNG de revisión: 2290 × 3220 px (escala 2).

## Reparto de área medido

Altura de las zonas de producto, sin cabecera de marca ni pie. Medición sobre la lámina renderizada (2026-09-22):

| Zona | Alto | Parte |
| --- | --- | --- |
| Pizzes artesanes | 125,6 mm | |
| Crea la teva pizza | 37,9 mm | |
| Pizza, suma | 163,5 mm | 58,2 % |
| Smash burgers | 29,3 mm | 10,4 % |
| Per compartir + amanides | 64,9 mm | 23,1 % |
| Postres + begudes | 23,0 mm | 8,2 % |

La smash no comparte peso de marca. No hay destacado comercial. `MenuItemFeatured` existe y no se usa: ningún producto está confirmado como destacado. El módulo QR queda fuera de ese reparto y no se agranda hasta dominar la lámina.

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
| FooterInfo | Alérgenos, contacto y línea de marca. |
| QRBlock | Módulo «La carta al teu mòbil» con QR_DEV. No es el código de producción. |
| LegalInfo | Aviso de prueba, estado `PROPUESTA_ARGOS`. |
| ContactBlock | Adreça, horari, telèfon en pendiente. |

El id visible desaparece cuando el producto pase a `CONFIRMADO`.

## Ilustración

Dibujo de línea original, en SVG. Vocabulario: olivo, tomate, trigo, contorno de pizza. En la lámina hay tres piezas: rama de olivo en la marca, tomate junto a las pizzas, contorno en el hueco protagonista. El trigo existe en el módulo y no se coloca: una cuarta pieza empezaría a decorar. Cero fotografías. No hay material real; la regla es de cero a dos fotos fuertes, así que son cero.

## Carta móvil

`/carta` no es la A3 encogida. Misma identidad y los mismos datos. Componentes: MobileMenuHeader, MobileCategoryNav, MobileCategorySection, MobileMenuItem, MobilePrice, MobileDescription, MobileIngredientList, MobileAllergenInfo, MobileFeaturedItem, MobileCreateYourPizza, MobileFooter, MobileContactActions.

Cabecera con hueco de logo en `PLACEHOLDER`, tipo y «Des de 2005». Navegación vertical, objetivos táctiles de 44 px, precio visible, ingredientes legibles, alérgenos alcanzables aunque estén bloqueados. Sin foto: no hay ninguna real. Sin JavaScript de interfaz. La analítica es un JSON inerte (`activo: false`); revisores previstos: CLO, CDAO y Growth. Sin cookies.

Banner visible: los datos no están contrastados y esto no es la carta publicada. Contacto, dirección, horario, redes, privacidad y legal salen vacíos o bloqueados. No hay enlaces rotos: si no hay teléfono, no hay `tel:`.

## QR

Módulo editorial, no un cuadrado suelto. Título y texto orientativo en estado `PROPUESTA_ARGOS`. El código es negro sobre blanco, corrección Q, zona muda de 4 módulos, sin deformar y fuera del velo de color. Lleva la etiqueta QR_DEV y la URL local. `QR_PRODUCTION` no se dibuja.

## Lo provisional

Hex, wordmark, tipografía candidata, precios, ingredientes, alérgenos, contacto y el aviso de la lámina. Los nombres de pizza de la extracción no son una carta confirmada. La jerarquía de secciones del encargo se mantiene.
