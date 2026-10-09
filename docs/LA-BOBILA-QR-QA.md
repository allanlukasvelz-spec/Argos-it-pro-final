# La Bòbila — QA del QR antes de imprimir

Fecha: 2026-09-22. El QR de la lámina es `QR_DEV`. No es aprobable para imprenta.

Ninguna de estas pruebas de dispositivo se ha ejecutado. No se marca el QR como PASS.

| # | Prueba | Estado |
| --- | --- | --- |
| 1 | iPhone reciente | no ejecutada |
| 2 | Android reciente | no ejecutada |
| 3 | Gama media | no ejecutada |
| 4 | Escaneo a unos 30 cm | no ejecutada |
| 5 | Escaneo a unos 50 cm | no ejecutada |
| 6 | Luz interior normal | no ejecutada |
| 7 | Poca luz | no ejecutada |
| 8 | Impresión física real | no ejecutada |
| 9 | Cámara nativa, sin app especial | no ejecutada |
| 10 | Validación de la URL en el dispositivo | no ejecutada |

Hasta pasar las diez, `QR_PRODUCTION` sigue bloqueado y esta lámina no se imprime como carta.

## Comprobaciones automáticas ejecutadas

Corridas con `node la-bobila/mobile/check.mjs` el 2026-09-22. Resultado: pasaron.

- Un solo `catalog.json`. No hay catálogo móvil ni de impresión aparte.
- A3 y `/carta` contienen los mismos nombres extraídos (Prosciutto, Mallorquina) y salen del mismo archivo.
- `/carta` responde `text/html` y el cuerpo es HTML, no un PDF.
- No hay URL `https://` en el HTML generado.
- El único destino codificado es `http://127.0.0.1:4173/carta`, etiquetado `QR_DEV`.
- `QR_PRODUCTION.destino` es null y el estado es `BLOQUEADO`.
- No aparecen alérgenos inventados ni precios en euros.
- El CSS móvil pide objetivos de 44 px.
- Hay `h1` y `h2`.
- La costura de analítica está inactiva y no hay `<script src>`.
- `GET /` redirige a `/carta`. Las fuentes locales se sirven.

El redondeo del MediaBox de Chrome (menos de 0,15 mm sobre 303 × 426 mm) está documentado y no bloquea esta fase. La tolerancia final espera una prueba de máquina.
