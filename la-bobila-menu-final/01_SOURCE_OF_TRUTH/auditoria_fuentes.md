# La Bòbila — auditoría de fuentes (fase 1)

No es una maquetación. No se ha diseñado, exportado ni fusionado nada. La imagen conceptual no se ha transcrito.

Los prototipos V2, V3 y V4 siguen en `la-bobila/print/renders/` y no son este documento de producción.

## Inventario

Fuente significa que un hecho de nombre, ingrediente o precio puede citar ese archivo. Derivado significa que sale de esas fuentes o de un prototipo y no puede crear platos ni precios.

| Ruta | Papel | Clase |
| --- | --- | --- |
| `la-bobila/catalog/catalog.json` | Catálogo maestro 0.4.1, revisión 2026-09-22. Fuente primaria de nombres, ingredientes y precios. | fuente |
| `la-bobila/source/menu-current/la-bobila-carta-vigente.jpeg` | Foto de la carta vigente. sha256 `3484610b4d455e837d8c77568a155073894427d1ef06b424bcd1e2412bb54755`. Asset `LB-ASSET-MENU-CURRENT-001`. | fuente |
| `la-bobila/processed/menu-current/la-bobila-carta-vigente.jpeg` | Copia byte a byte de la vigente. Mismo sha256. | fuente (copia) |
| `la-bobila/source/menu-historical/la-bobila-carta-historica.jpeg` | Foto de una carta anterior. sha256 `a19f86d39c9471e2517a9d9f3e1bb279538b5535bc608998874b5575e5f59193`. Asset `LB-ASSET-MENU-HISTORICAL-001`. | fuente histórica |
| `la-bobila/processed/menu-historical/la-bobila-carta-historica.jpeg` | Copia byte a byte de la histórica. Mismo sha256. | fuente histórica (copia) |
| `la-bobila/source/logo/la-bobila-logo-reference.png` | Único máster de logo. sha256 `6b82915752bd3bd3b0f9a698feb36b7b4897357555bd462af7c89164b49bc9fc`. | fuente de marca |
| `la-bobila/processed/logo/la-bobila-logo-reference.png` | Copia byte a byte del máster. Mismo sha256. | fuente de marca (copia) |
| `la-bobila/processed/logo/la-bobila-logo-presentation.png` | Variante de colocación con alfa. sha256 `ba7b0648ac45efafd698510dc0d2c69782fcf41d320cadd6759e0bd77b918113`. No es otro logo. | derivado |
| `la-bobila/source/manifest/assets.json` | Manifiesto de ingesta. Declara que no hay fotos de producto. | registro |
| `la-bobila/source/photos/` | Vacío. Solo `.gitkeep`. | ausencia |
| `docs/LA-BOBILA-MENU-CURRENT-TRANSCRIPTION.md` | Transcripción de contraste de la foto vigente. | derivado de contraste |
| `docs/LA-BOBILA-MENU-HISTORICAL-TRANSCRIPTION.md` | Transcripción de contraste de la foto histórica. | derivado de contraste |
| `docs/LA-BOBILA-MENU-DIFF.md` | Diferencias ya separadas entre periodos. | derivado de contraste |
| `docs/LA-BOBILA-DECISIONS.md` | Decisiones del proyecto. No crea platos. | registro |
| `docs/LA-BOBILA-DATA-MODEL.md`, `docs/LA-BOBILA-MASTER-SPEC.md`, `docs/LA-BOBILA-BRAND-AUDIT.md`, `docs/LA-BOBILA-CLIENT-REVIEW.md`, `docs/LA-BOBILA-DESIGN-SYSTEM.md`, `docs/LA-BOBILA-TYPOGRAPHY.md`, `docs/LA-BOBILA-DENSITY-REPORT.md`, `docs/LA-BOBILA-EDITORIAL-V2-REVIEW.md`, `docs/LA-BOBILA-CREATE-YOUR-PIZZA-STUDY.md`, `docs/LA-BOBILA-QR-QA.md` | Estudios y prototipo. | derivado |
| `la-bobila/print/renders/carta-a3-editorial-v1.png` y `.pdf`, `carta-a3.png` y `.pdf` | Prototipo V1. | render |
| `la-bobila/print/renders/carta-a3-editorial-v2-clean.png` y `.pdf` | Prototipo V2 limpio. | render |
| `la-bobila/print/renders/carta-a3-editorial-v2-illustrated.png` y `.pdf` | Prototipo V2 ilustrado. | render |
| `la-bobila/print/renders/carta-a3-editorial-v3.png` y `.pdf` | Prototipo V3. | render |
| `la-bobila/print/renders/carta-a3-editorial-v4.png` y `.pdf` | Prototipo V4. | render |
| `la-bobila/print/renders/palette-comparison-a.png`, `palette-comparison-b.png` | Estudio de paleta. | render |
| `la-bobila/print/carta-a3.html`, `la-bobila/mobile/carta.html` | HTML generado desde el catálogo. | derivado |
| `la-bobila/tokens/` | Candidatos de tipo y color. No son hechos de carta. | derivado |
| `/cursor/stores/bc-70d42429-279a-4600-b0fd-616ef926aa11/internal/referencia-conceptual-carta.png` | Imagen conceptual de estructura. No es fuente de platos ni de precios. No se ha transcrito. | no es fuente |

No hay docx, xlsx ni pdf de carta en el repositorio. La segunda ruta citada de la imagen conceptual (`assets/7b18527f-08d3-4a1c-9ccb-e3254a38bd2c.png`) no está en esta máquina.

## Catálogo normalizado

`catalogo_normalizado.json` copia hechos de `catalog.json`. 62 filas: 50 `CONFIRMADO`, 11 `PENDIENTE DE CONFIRMAR`, 1 `SOURCE_CONFLICT` (Cansalada). En las no confirmadas el nombre, los ingredientes y el precio quedan `null`; la lectura del catálogo se guarda aparte y no se reescribe.

Postres y begudes no tienen filas de producto. Lo histórico vive en `historico` y cita solo `LB-ASSET-MENU-HISTORICAL-001`. Ningún producto vigente cita a la vez la carta vigente y la histórica.

## Hechos que no entran

`Risotto ai quattro formaggi`, Plats del dia y «25 años» no están en el catálogo: `NO_EN_CATALOGO`. Free gluten, massa mare, forn y 48 h no están afirmados por una fuente: `PENDIENTE DE CONFIRMAR`. No se añaden.

La presentación de precio sigue `EUR_PENDING_PRESENTATION`: el valor guardado no cambia; más adelante el número va sin símbolo de euro. La medida de trabajo A3+ 329 × 483 mm, cara horizontal 483 × 329 mm, archivo con sangre 489 × 335 mm, página vertical 329 × 483 mm, archivo con sangre 335 × 489 mm, sangre 3 mm, queda `PENDIENTE DE CONFIRMAR` con la imprenta.
