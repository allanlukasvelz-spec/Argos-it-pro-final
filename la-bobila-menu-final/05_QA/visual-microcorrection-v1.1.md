# Microcorrección V1.1

Base: commit `e17d5e3` en `la-bobila-menu-system`. No se recompone, no se tocan datos, no se fusiona y no se publica.

Se devuelven solo los dos cuerpos horizontales que la corrección V1 había subido. El catálogo, el HTML, el logo, la paleta, las ilustraciones, la portada, el plec, la medida y el interior no se editan.

## Cuerpos restaurados

INGREDIENT_FONT: 5,00 mm → 2,85 mm.

El cuerpo calculado de `.ings` es 2,85 mm, peso 400, tinta. La regla `.zone--second .ings` también estaba en 5,00 mm y vuelve a 2,85 mm: es el mismo cuerpo de ingrediente. Si se dejara en 5,00 mm, Smash seguiría por encima de su nombre (4,25 mm). El interlineado se queda en 5,25 mm, como en `e17d5e3`. No se mueve el elemento y no se edita el texto.

PENDING_FONT: 5,00 mm → 2,15 mm.

El cuerpo calculado de `.pend` es 2,15 mm, peso 600, terracota. El interlineado se queda en 5,6 mm y la marca sigue visible, con la misma palabra. No se oculta ni se reescribe.

PRODUCT_NAME_FONT: 3,85 mm, sin cambio. Las variantes que ya existían tampoco cambian: ensalada 3,55 mm, Per compartir 3,45 mm, Smash 4,25 mm. Todas pesan 600.

Interior, sin tocar y sin igualar: ingrediente 3,15 mm, interlineado 3,95 mm. PENDIENTE 2,30 mm.

TYPOGRAPHIC_HIERARCHY: PASS. En la horizontal el nombre queda por encima del ingrediente y el ingrediente por encima de la marca, por cuerpo, peso, contraste y posición. El nombre es más grande y más pesado que el ingrediente, y va delante. El ingrediente (2,85 mm, peso 400, tinta) va debajo. La marca (2,15 mm, terracota) queda al lado de la lectura dudosa y es más pequeña. El interlineado ancho de 5,25 mm y 5,6 mm ya estaba en `e17d5e3` y no se ha usado para forzar la jerarquía.

## Huecos estructurales

STRUCTURAL_GAPS: UNCHANGED.

- Interior, Per compartir a Smash: 65,88 mm. Complements y 210,10–282,12 mm. Smash y 348,00–387,13 mm.
- Bajo Begudes: 8,00 mm. Zona y 453–481 mm. Archivo 489 mm.
- Horizontal, Per compartir a Smash: 3,00 mm. Complements bottom 128,19 mm. Smash top 131,19 mm.

El bloque de Smash horizontal acaba ahora en y 204,28 mm. En `e17d5e3` acababa en y 225,02 mm. El cuerpo menor ocupa menos líneas. El hueco de 3,00 mm entre los dos bloques no cambia. No se ha movido ningún margen.

## Puertas

DATA_INTEGRITY: PASS
NAME_DIFF: 0
PRICE_DIFF: 0
INGREDIENT_DIFF: 0
CATEGORY_DIFF: 0

Las 62 filas de las dos caras coinciden con el catálogo. El único cruce del cotejo en bruto era `Top fries cheddar &amp; bacon`, que es el mismo nombre con el `&` escapado en el HTML.

FOLD_SAFETY: PASS. Cruces 0. El sello sigue a 14,00 mm del plec.
OVERFLOW_COUNT: 0. Nada sale de la hoja y ningún texto entra en el retall.
LOGO_INTEGRITY: PASS. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`.
UNSUPPORTED_CLAIMS: 0.

EXPECTED_CHANGES: el cuerpo horizontal del ingrediente, en `.ings` y en `.zone--second .ings`, de 5,00 mm a 2,85 mm. El cuerpo horizontal de PENDIENTE, de 5,00 mm a 2,15 mm.
UNEXPECTED_CHANGES: 0.

## Vista

`la-bobila-menu-final/04_RENDERS/carta-horizontal-v1.1.png`

Copia: `/cursor/stores/bc-70d42429-279a-4600-b0fd-616ef926aa11/media/carta-horizontal-v1.1.png`

Los renders BEFORE y AFTER no se han sobrescrito. Los prototipos V2, V3 y V4 siguen aparte.

MICROCORRECTION_GATE: PASS
PRINT_SIZE_STATUS: PENDIENTE DE CONFIRMAR
NEXT ACTION: revisión visual humana de V1.1. No se abre otra fase.
