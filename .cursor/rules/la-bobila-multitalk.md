---
description: Gobierno de La Bòbila — marca, carta y sistema digital. No altera Argos IT.
alwaysApply: true
---

# La Bòbila — gobierno MultiTalk

## Objetivo

Construir un sistema coherente de marca, carta y experiencia digital para La Bòbila. Identidad: mediterráneo artesanal contemporáneo. No se trata de hacer una carta bonita. Se trata de que el cliente reconozca: esto sigue siendo La Bòbila, pero ahora se ve como siempre debió verse. No se pierde la identidad real del negocio.

Esta regla gobierna el trabajo de La Bòbila. No autoriza a modificar, reformatear ni borrar el producto Argos IT (frontend, backend, base de datos, wordpress-export, e2e, docs existentes, README, workflows).

## Roles

Se activa un rol solo cuando tiene competencia real sobre la decisión. No se simula participación de Nivel IV.

### Nivel I

- **CEO** — visión, coherencia, identidad final. Pregunta: «¿Esto sigue siendo La Bòbila?»
- **COO** — operación, flujo real del restaurante, capacidad de actualización, viabilidad de la carta, implementación, mantenimiento, salida.
- **CFO** — precios, margen, food cost, combos. No se cambian precios sin datos o sin autorización.
- **CTO** — web, CMS, QR, integraciones, hosting, rendimiento, mantenibilidad.
- **CPO** — producto, carta, experiencia, coherencia físico / digital / web, categorías, catálogo.
- **CRO** — conversión, ticket medio, venta cruzada, destacados, packs, extras. Nunca convertir la carta en un catálogo agresivo de promociones.
- **CISO** — seguridad, accesos, formularios, integraciones, datos, riesgo.
- **CDAO** — catálogo maestro, normalización, IDs de producto, integridad, fuente única.
- **CLO** — alérgenos, privacidad, cookies, cumplimiento, textos legales, información obligatoria.
- **CHRO** — usabilidad interna, comprensión del equipo.
- **CSO** — posicionamiento, diferenciación, dirección de marca.
- **Chief of Staff** — coordinación, decisiones, contradicciones, gobierno.

### Nivel II

VP Engineering, VP Global Sales & Enterprise, VP Customer Success, VP Growth & Performance Marketing, VP Corporate Development, Head of Global Infrastructure & Cloud, Head of Government & Public Affairs.

### Nivel III

- **Principal Enterprise Architect** — arquitectura de información: catálogo → CMS → web → carta digital.
- **Director of AI Research** — la IA solo entra si aporta un valor verificable. Prohibida como decoración.
- **Head of Product Design / UX UI** — carta, retícula, tipo, jerarquía, experiencia, responsive, QR, sistema visual.
- **Lead DevSecOps** — cuando haya pipeline, entornos o secretos reales.
- **Head of Talent Acquisition Tech** — solo si de verdad hacen falta más personas.

### Nivel IV

Solo cuando el asunto lo exija: SRE, Security Operations, Backup & Recovery, Observability, FinOps, Data Engineering, Incident Command, Business Continuity, Disaster Recovery.

## Principios no negociables

- Nombre: La Bòbila. Tipo: pizzería artesana. Identidad: mediterráneo artesanal contemporáneo.
- «Des de 2005» es un activo de marca y se conserva.
- No convertirla en trattoria italiana tematizada, restaurante medieval, fast food ni identidad cuyo protagonista sea la smash burger.
- Prohibido: pergamino falso, dominio del negro, abuso del dorado, clichés italianos, fotos genéricas, productos, precios, horarios, dirección o alérgenos inventados.
- No se diseña primero para justificar después.
- Orden de trabajo: verdad de producto, luego arquitectura, luego jerarquía, luego diseño, luego implementación.
- Fuente única. Cada decisión tiene un dueño, la revisan los roles competentes y no puede contradecir diseño, producto, operación ni tecnología.

## Estados de dato

No se mezclan.

- `AVAILABLE_EXTERNALLY`: se sabe que existe fuera del repositorio.
- `FILE_NOT_INGESTED`: el archivo existe fuera y todavía no está físicamente en el repo. El manifiesto lo registra con `sha256` null y la ruta de entrega. No se finge un hash.
- `SOURCE_MISSING`: no hay documento fuente con el que contrastar el hecho.
- `CANDIDATE_MATCH`: nombre ya anotado, pendiente de cruce uno a uno con la carta vigente. No es `CONFIRMADO`.
- `REVIEW_REQUIRED`: el original y la normalización no coinciden, o el dato pide revisión. No se corrige en silencio.
- `SOURCE_CONFLICT`: el candidato no aparece en la fuente, o dos fuentes se contradicen.
- `POR_CONFIRMAR`: el documento existe, y el cliente todavía tiene que validar el dato.
- `CONFIRMADO`: contrastado y válido.
- `CONFIRMADO_SOURCE`: solo después de transcripción y de un segundo contraste contra el archivo. Prohibido sin carta vigente ingerida.
- `HISTORICO`: pertenece a una carta o un estado anterior. No entra solo en la carta vigente ni en `/carta`.
- `PROPUESTA_ARGOS`: texto nuestro, no un dato del negocio.
- `DESCARTADO`: se conserva la traza y no se muestra.

`null` es un valor desconocido (precio, ingredientes, alérgenos, foto). No sustituye a estos estados.

Un dato no confirmado no se presenta como real. Si no hay nombre, el hueco dice «Per confirmar». Un nombre `SOURCE_MISSING` o `CANDIDATE_MATCH` puede mostrarse como no contrastado. El precio desconocido es una raya (—), nunca un número inventado. No se infiere un alérgeno legal a partir de un ingrediente.

## Ingesta

Orden único: archivos fuente → extracción → normalización → `catalog.json` → validación → A3 → `/carta`. No se invierte. Los hechos de producto no viven en HTML, CSS ni componentes.

`la-bobila/source/` es inmutable. El máster no se edita. Las copias van a `la-bobila/processed/`. Sin el archivo físico no hay auditoría de marca, ni transcripción, ni diff histórico. El andamiaje no es una ingesta terminada.

Los 17 nombres de pizza ya anotados permanecen en `CANDIDATE_MATCH` hasta cruzarlos con la carta vigente. No pasan a `CONFIRMADO` por estar escritos en el JSON.

## P0: QR y carta móvil

QR + `/carta` es producto central, no un accesorio, no un PDF ni una foto de la lámina, no un shrink de escritorio, no un iframe, no una descarga, no un login y no una app.

```
catalog.json
  ├── print → A3
  ├── mobile → /carta
  ├── QR_DEV ahora, QR_PRODUCTION bloqueado
  └── web futura
```

- Prohibido un segundo catálogo (`catalog-mobile.json`, `catalog-print.json`, `menu-data.json` o equivalente).
- `QR_PRODUCTION` bloqueado hasta un dominio y una ruta confirmados. No se genera. No se codifica una URL temporal o de proveedor como destino definitivo.
- `QR_DEV` solo puede codificar `http://127.0.0.1:<puerto>/carta`. La lámina debe decir que no es el QR de producción y que no se imprime como carta final. Corrección de error mínima Q, zona muda, alto contraste, sin deformar.
- La ruta estable es `/carta`. El QR físico futuro se conserva con una redirección controlada si cambia la implementación. No se inventa un dominio.
- El wordmark actual es `PLACEHOLDER`. La paleta hex sigue `POR_CONFIRMAR` hasta muestrear el logo real, sin modificar el máster. Fraunces + Source Sans 3 son tipografía candidata, no una decisión irreversible.
- QR no puede declararse PASS sin las pruebas de dispositivo de `docs/LA-BOBILA-QR-QA.md` y sin dominio. `/carta` no puede declararse PASS sin esas pruebas y sin los documentos fuente contrastados.

## Idioma

La carta de cara al cliente usa el catalán de las etiquetas aprobadas. La documentación interna va en español.

## Cuándo el diseño no es válido

No es válido si parece una plantilla, podría ser de cualquier pizzería, el negro domina, la smash burger domina la identidad, el logo parece pegado y sin sistema, la pizza pierde protagonismo, el tipo es demasiado pequeño, hay sobredecoración, clichés italianos, demasiadas fotos, el precio domina al producto, los ingredientes se leen peor que el precio, no funciona en impresión, no hay una sola fuente de datos, hay datos inventados, o la carta y la web se contradicen.

## Cuándo el diseño es válido

Es válido cuando se reconoce La Bòbila de inmediato, hay sentimiento mediterráneo real, oficio, actualidad, elegancia cálida, claridad, legibilidad, personalidad, escalabilidad y coherencia entre papel y digital.

Hay un logo visual fuera del repositorio. No está ingerido. Hasta entonces el wordmark tipográfico es `PLACEHOLDER`: no se diseña como si fuera el logo final y no se fabrica un símbolo para ocupar su lugar. Sin ese archivo colocado, no hay reconocimiento inmediato y el conjunto sigue parcial aunque la infraestructura sea sólida.

## Cierre de fase

Antes de cerrar cada fase, revisión solo con roles competentes: CEO, CPO, COO, CSO, CRO, CDAO, Head of Product Design, CTO, CLO si aplica, y síntesis de Chief of Staff.

No declarar PASS si queda una contradicción estructural importante. PASS exige cumplir los criterios, incluido el reconocimiento inmediato de La Bòbila y la ausencia de datos inventados.
