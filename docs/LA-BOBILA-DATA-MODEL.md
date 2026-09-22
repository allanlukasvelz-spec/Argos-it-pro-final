# La Bòbila — modelo de datos

Fecha: 2026-09-22. Fuente ejecutable: `la-bobila/catalog/catalog.json`. El validador vive en `la-bobila/print/render.mjs` y rechaza el HTML si el catálogo miente.

## Fuente única

El renderer no copia nombres a mano. Toda cadena de cliente sale del JSON: marca, secciones, grupos, interfaz, alérgenos, QR, contacto y aviso. El HTML generado es salida. No se edita.

## Estados

| Estado | Significado |
| --- | --- |
| `CONFIRMADO` | Dato real, con fuente. Solo entonces se pinta como hecho. |
| `POR_CONFIRMAR` | Hueco. En la lámina se lee «Per confirmar». El precio se pinta como «—». |
| `HISTORICO` | Carta o precio antiguo, etiquetado como histórico. Hoy no hay filas. |
| `PROPUESTA_ARGOS` | Texto nuestro, no un dato del negocio. Hoy: el aviso de la lámina. |
| `DESCARTADO` | Se conserva la traza y no se muestra. Hoy no hay filas. |

`null` no significa «no lleva» (por ejemplo, alérgenos vacíos). Significa desconocido. Una lista de alérgenos vacía con estado `CONFIRMADO` sería una afirmación legal y esta versión no la usa.

## Marca

`marca.nombre`, `marca.tipo`, `marca.desde` están `CONFIRMADO` con fuente `encargo-2026-09-22`. No salen de un logo del repositorio. `moneda` está `POR_CONFIRMAR`: no se imprime símbolo.

## Secciones

Orden fijo en `secciones`:

| id | Título de cliente | Peso | Etiqueta | Contenido |
| --- | --- | --- | --- | --- |
| pizzes | Pizzes artesanes | protagonista | CONFIRMADO | POR_CONFIRMAR |
| crea | Crea la teva pizza | protagonista | CONFIRMADO | POR_CONFIRMAR |
| smash | Smash burgers | secundario | CONFIRMADO | POR_CONFIRMAR |
| complements | Per compartir / complements | terciario | CONFIRMADO | POR_CONFIRMAR |
| amanides | Amanides | terciario | CONFIRMADO | POR_CONFIRMAR |
| postres | Postres | pendiente | POR_CONFIRMAR | POR_CONFIRMAR |
| begudes | Begudes | pendiente | POR_CONFIRMAR | POR_CONFIRMAR |

La etiqueta confirmada es arquitectura del encargo, no un plato.

## Grupos de «Crea la teva pizza»

El id interno sigue el encargo. La etiqueta de cliente es catalán.

| id | Etiqueta |
| --- | --- |
| base | Base |
| carnes | Carns |
| vegetales | Vegetals |
| quesos | Formatges |
| extras | Extres |

Dos huecos por grupo. No son toppings reales.

## Producto

Campos obligatorios: `id`, `categoria`, `nombre`, `nombre_corto`, `descripcion`, `ingredientes`, `precio`, `precio_historico`, `alergenos`, `tipo`, `subcategoria`, `disponible`, `destacado`, `orden`, `foto`, `fuente`, `estado`, `observaciones`, `ultima_revision`.

En un hueco `POR_CONFIRMAR` estos campos factuales son `null`: nombre, nombre corto, descripción, ingredientes, precio, precio histórico, alérgenos, foto. `disponible` es `null`. `destacado` es `false`. `fuente` es `estructura-inicial`. `ultima_revision` es `2026-09-22`. `observaciones` explica que espera la carta real.

`tipo`: `slot` en las categorías de comida aún vacías; `esquema` en postres y begudes; `producto` solo cuando el estado pase a `CONFIRMADO`.

## Identificadores

| Categoría | Prefijo |
| --- | --- |
| pizzes | LB-PIZ |
| smash | LB-BUR |
| complements | LB-COM |
| amanides | LB-AMA |
| postres | LB-POS |
| begudes | LB-BEG |
| crea | LB-EXT |

Forma: `LB-XXX-000`. Únicos. El id se ve en la lámina mientras el estado no sea `CONFIRMADO`, para que equipo y datos hablen de la misma pieza. Cuando el producto se confirme, el id sale de la carta impresa y se queda en el dato.

Conteo actual: 6 pizzas, 10 toppings de esquema, 3 smash, 3 complements, 3 amanides, 2 postres de esquema, 2 begudes de esquema. Total 29. Cero filas `CONFIRMADO`, `HISTORICO` o `DESCARTADO`.

## Contacto, QR, alérgenos

- Contacto: `adreca`, `horari`, `telefon` en `null`. Etiquetas de interfaz en catalán.
- QR: `destino` en `null`. Sin URL y sin código de barras falso.
- Alérgenos: `items` en `null`. No hay iconos de gluten, lácteos ni nada parecido.

## Reglas del validador

- Rechaza un hecho relleno si el estado es `POR_CONFIRMAR`.
- Rechaza precio histórico fuera de `HISTORICO`.
- Rechaza `destacado: true` sin producto confirmado.
- Rechaza destino de QR, dirección, horario, teléfono o lista de alérgenos si su bloque no está `CONFIRMADO`.
- El renderer, además, no pinta un hecho si el estado no es `CONFIRMADO`, aunque alguien saltara el validador.

## Fuera del modelo, a propósito

No hay helados, combos, promociones, fotos, horario, dirección ni carta histórica. Si el helado existe, entrará bajo postres cuando la carta lo diga, con un id nuevo. No se abre una categoría por si acaso.

## Preguntas abiertas

Logo, carta vigente, carta histórica, dirección, horario, teléfono, bebidas, postres, helados, alérgenos, fotografías reales, combos, promociones, moneda, destino del QR, texto legal de publicación.
