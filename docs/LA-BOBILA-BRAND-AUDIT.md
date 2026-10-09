# La Bòbila — auditoría del logo

Fecha: 2026-09-22. Máster: `la-bobila/source/logo/la-bobila-logo-reference.png`.
sha256: `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`.
El muestreo se ha hecho sobre la copia de `la-bobila/processed/logo/`, mismo hash. El máster no se ha editado. Los tokens no se han sustituido.

## Archivo

PNG 1600×863, 8 bits, RGB, sin canal alfa. No es vectorial. No es un logo de Argos IT.

## Estructura visual

Wordmark en dos líneas: «LA» pequeño sobre «BOBILA» grande. El OCR, en dos recortes, no emite el acento grave de Ò. La marca del encargo sigue siendo La Bòbila. El acento del archivo queda en revisión: no se afirma que el píxel lo dibuje solo porque el encargo lo usa.

Encima, en dos pases de OCR: `• DESDE 2005 •`. No lee «Des de».
Debajo, en dos pases: `- PIZZERIA ARTIGIANALE -`. No lee «artesana» ni «Pizza artesana».

A los lados hay una rama botánica (hoja de olivo) y un tomate. El tomate es el acento cálido. No hay dorado ni campo negro.

## Color muestreado frente a provisional

Mediana de píxeles de la copia, sin sustituir `tokens.json`.

| Papel | Token provisional | Hex provisional | Mediana muestreada |
| --- | --- | --- | --- |
| Marfil de fondo | `--lb-ivory` | `#F3EEE4` | `#FAF0E7` |
| Tinta del wordmark | `--lb-green` | `#1E3A32` | `#202B17` |
| Tomate | `--lb-terracotta` | `#C15B3A` | `#8E4A30` |
| Oliva de la rama | `--lb-olive` | `#6E7A45` | `#6C7153` |

El fondo es marfil cálido, más claro que el provisional. La tinta es un verde casi negro, más oscuro que `#1E3A32`. El tomate es ladrillo oscuro, menos saturado que `#C15B3A`. La oliva se acerca, más gris. El contraste del wordmark sobre el marfil es alto. Negro y dorado no dominan.

## Tipografía aparente

El wordmark es una serif de contraste alto, no Fraunces. Fraunces sigue siendo la tipografía de la lámina, candidata, no la del archivo. El pie «PIZZERIA ARTIGIANALE» es una sans o una serif pequeña en versalitas. No se cambia la pareja tipográfica en esta fase.

## Uso

Impresión: el PNG a 1600 px se queda corto si se amplía a un frente de A3. Hace falta un máster vectorial o un PNG mayor. Móvil: a ancho de pantalla el archivo aguanta; por debajo se pierde la rama. El wordmark de la lámina y de `/carta` sigue en `PLACEHOLDER`. No se ha pegado este PNG en la cabecera.

## Decisión

CSO, Head of Product Design, CPO y CEO: no se reemplazan los hex ni el wordmark de forma automática. La diferencia «DESDE 2005» / «PIZZERIA ARTIGIANALE» frente a «Des de 2005» / «Pizzeria artesana» queda para el cliente. Ver ADR-018.

## Fase 4 — copia de presentación y contraste

El máster no se ha modificado. sha256 sigue `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`.

El fondo RGB (mediana 250, 241, 230, cerca del marfil muestreado `#FAF0E7`) dibuja un rectángulo si se coloca tal cual sobre otra base. La copia `la-bobila/processed/logo/la-bobila-logo-presentation.png` (sha256 `ba7b0648ac45efafd698510dc0d2c69782fcf41d320cadd6759e0bd77b918113`) añade alfa sin recortar ni redibujar: distancia euclídea al crema ≤ 14 transparente, ≥ 36 opaco, pluma en medio. Es trazable al máster. ADR-020. Esa copia es la que va en la A3 y en `/carta`. El texto del archivo no se reescribe.

Contraste relativo, texto pequeño (umbral 4,5:1) y texto grande (3:1). Prueba de pantalla sRGB, no separación de imprenta.

| Par | Candidata A | Candidata B |
| --- | --- | --- |
| Tinta o verde sobre marfil | 10,64 | 13,16 |
| Acento sobre marfil | 3,76 terracota | 5,89 tomate |
| Oliva o rama sobre marfil | 4,01 | 4,53 |
| Marfil sobre tinta o verde | 10,64 | 13,16 |

En papel no estucado la rama de B (4,53) tiene poco margen en el meta más pequeño. La terracota y la oliva de A no sirven para precio pequeño. No hay candidata C: B ya pasa el contraste y es la que coincide con el logo. No se declara ganadora. Los tokens no se sustituyen. El prototipo prueba B y lo rotula. `/carta` sigue en los tokens provisionales, así que el precio móvil en oliva queda en 4,01:1 hasta que haya decisión.
