# ARGOS — Handoff Framer (DRAFT)

```
STATUS = DRAFT
COMPLETE_AFTER = RELUME_APPROVED
STAGE = 1_ARCHITECTURAL_PRODUCT_BLUEPRINT
PIXEL_PERFECT = NO
FINAL_UI_FREEZE = NO
```

Este documento **no congela** el diseño final. Define principios, restricciones y semántica que Framer deberá respetar cuando Relume haya aprobado la IA/UX.

Completar las secciones marcadas `TBD_AFTER_RELUME` solo después de ese gate.

No incluye secretos ni detalle de implementación backend.

---

## 1. Rol de Framer en el pipeline

```
CURSOR (arquitectura de producto)  →  RELUME (IA/UX)  →  FRAMER (alta fidelidad)  →  CURSOR (implementación)
```

Framer entrega:

- composición visual
- comportamiento responsive
- interacción
- componentes de alta fidelidad

Framer **no** entrega:

- nuevas rutas que Relume no haya aprobado
- acciones que el blueprint clasifique como inseguras
- métricas reales inventadas
- un «Auto Fix» automático si la acción es Level 3+

---

## 2. Tres experiencias, tres registros visuales

| Experiencia | Registro | Densidad | Tono |
|-------------|----------|----------|------|
| PUBLIC WEBSITE | premium, institucional, editorial | baja–media | vender confianza; no dashboard |
| CLIENT PORTAL | calm, claro, business-oriented | media | tranquilizar; no abrumar |
| INTERNAL NOC | técnico, operativo, denso | alta | evidencias, severidad, ownership |

No unificar las tres en un único look SaaS.

Corporate (web pública) ya tiene dirección congelada: **Quiet Authority / Light Premium Institutional**. El portal y el NOC **no** tienen freeze visual; Framer los explorará **después** de Relume.

---

## 3. Principios visuales existentes (obligatorios)

Fuente: `docs/design/ARGOS_DESIGN_DIRECTOR_BRIEF.md` + Visual Freeze 21.6B.

### Marca

| Token | Hex | Uso |
|-------|-----|-----|
| Primary | `#1F3A5F` | autoridad |
| Secondary | `#2F7D6D` | acento de sistema |
| Surface | `#F7F7F5` | superficie institucional |
| Dark | `#0B1320` | contraste estructural |
| `#072648` | — | **REJECTED** como primary |

### Tipografía Corporate (web pública)

| Rol | Familia |
|-----|---------|
| Display | Cormorant Garamond |
| Body / UI | Inter |
| Manrope | REJECTED |

Cormorant no va en botones, nav, inputs ni labels funcionales.

Portal y NOC: tipografía **TBD_AFTER_RELUME**. Pueden heredar Inter; no introducir Manrope.

### Dirección emocional

calm · trustworthy · competent · human · technologically precise · premium without luxury excess

La tecnología se siente controlada, comprensible, vigilada y estable. Nunca amenazante ni de espectáculo.

---

## 4. Brand constraints

**PROTECTED (no regenerar, recolorear ni sustituir):**

- Logo Argos-IT (`frontend/public/logo-argos-it.png` y variantes header/dark)
- Chico
- Dumbo
- Emblema de historia (`argos-history-emblem.png`)

**Mascotas:** `ASSISTANT_ONLY`. No hero, no header Corporate, no páginas Corporate animadas. `WALK = REJECTED`.

**Copy:** no inventar servicios, precios, SLAs, estadísticas, clientes nombrados, logos de terceros, certificaciones, testimonios ni partners. Placeholder social proof existente es deuda, no licencia.

**Assets permitidos (existentes):**

- `frontend/public/logo-argos-it.png`
- `frontend/public/logo-argos-it-header.png`
- `frontend/public/logo-argos-it-dark.png`
- `frontend/public/favicon.svg`
- `frontend/public/og-image.png`
- `frontend/public/mascots/chico|dumbo/*.png`
- Imágenes de secciones existentes: `continuidad.png`, `infraestructura.png`, `seguridad.png`, `sistemas.png` — solo si Relume las mantiene; no son identidad de marca

**Prohibido:** trabajo de clientes (UDIC, TusetCN, Flores Galí, landscaping) como estética ARGOS.

---

## 5. Interpretaciones visuales prohibidas

Relume/Framer no pueden introducir sin aprobación humana explícita:

- SaaS genérico / marketplace IT
- cyberpunk, hacker, crypto, gaming
- neon / cyan legacy (`#18D4F7`, `#39F4FF`) como identidad
- glassmorphism generalizado
- gradient overload
- huge pill UI
- fake dashboards en la web pública
- fake metrics / fake testimonials / fake logos
- HUD, shields, «AI brain», redes neón
- galaxy / meteors del método como marca (Level 7 experimental)
- un look único para Public + Client + NOC

La piel legacy de producción (`#2563EB` chrome + shell nocturno `#18D4F7`) es **referencia histórica**, no destino de marca.

---

## 6. Semántica de estados (obligatoria; color exacto TBD)

Toda UI de salud debe distinguir:

| Estado | Significado | Framer no puede |
|--------|-------------|-----------------|
| PROTECTED / HEALTHY | cobertura mínima + evidencias recientes OK | usarlo si faltan datos |
| OBSERVE | señal anómala no confirmada | ocultarlo como «todo bien» |
| WARNING | degradación o riesgo cercano | | 
| HIGH | impacto elevado, aún no incidente | |
| CRITICAL | fallo o riesgo inminente | suavizarlo visualmente hasta parecer OK |
| INCIDENT | incidente abierto | |
| MITIGATED | impacto contenido, causa no cerrada | |
| RESOLVED | cerrado con evidencia | |
| UNKNOWN | datos insuficientes | **igualarlo a HEALTHY** |

```
UNKNOWN != HEALTHY
```

Números de ejemplo en mockups: prefijo **MOCK** / **DEMO** / **PLACEHOLDER**.

---

## 7. Componentes requeridos (estructura; no pixel-perfect)

Framer debe diseñar variantes para:

**Public:** header, footer, hero editorial, service card, method step, plan card (sin precios inventados), formulario de contacto, legal article, CTA único por contexto.

**Client:** app shell (header + sidebar), Protection Status, Health Overview, Preventive Actions list, asset table, alert list, incident summary, status badge, empty / loading / unknown / warning / critical / error.

**NOC:** command shell denso, KPI strip, priority table, predicted-risk table, A/B/C panel, evidence stack, customer switcher, severity badges, ownership + SLA timers (si Relume los incluye; sin cifras reales).

Interacciones mínimas (no motion final):

- hover/focus visibles
- confirmación en acciones Level 2+
- approval gate visible en Level 3
- Level 4: no control «automático»
- reduced-motion: sin dependencia de animación para entender estado

---

## 8. Accesibilidad (no negociable)

- Un `h1` por página.
- Landmarks: banner, main, contentinfo (y navigation).
- Contraste WCAG AA sobre superficies reales (ivory y dark).
- Foco visible; no `outline: none` sin reemplazo.
- Color no es el único canal de severidad (texto + forma + icono).
- Imágenes decorativas: hidden from AT; informativas: `alt` real en el idioma de la página.
- Formularios con label asociado.
- Teclado completo en portal y NOC.

Valores exactos de contraste/spacing: **TBD_AFTER_RELUME**.

---

## 9. Responsive (prioridades estructurales)

| Experiencia | Prioridad |
|-------------|-----------|
| PUBLIC | desktop institucional primero; tablet/móvil deben conservar jerarquía editorial (Freeze 21.6B: tablet/móvil visual freeze = NO; Framer debe cerrarlos) |
| CLIENT | desktop trabajo; móvil = estado de protección + atención requerida, no tablas densas |
| NOC | desktop operativo primero; tablet = prioridades; móvil = cola de severidad, no Command Center completo |

Breakpoints exactos: **TBD_AFTER_RELUME**.

---

## 10. Requisitos de interacción

- Un CTA primary por contexto.
- Acciones destructivas o Level 3: diálogo de confirmación con evidencia visible.
- «Why this action?» accesible desde toda recomendación.
- Rollback visible cuando la acción sea reversible.
- Safe stop visible cuando A/B/C se agoten.
- No toasts como único registro de un incidente.

---

## 11. Relación con producción actual

| Superficie | Qué hacer |
|------------|-----------|
| `/contacto` Corporate chrome | control positivo; no regresar a legacy |
| Home / servicios / método producción | piel legacy; migración visual **no autorizada** por 21.6B |
| `/dashboard` actual | funcional; no es el layout TARGET; no es NOC |
| `/noc` | no existe |

Framer no publica. Cursor no implementa UI final hasta `ARGOS_DESIGN_CONTRACT.md = BINDING`.

---

## 12. Secciones a completar tras Relume

```
TBD_AFTER_RELUME:
- sitemap congelado por experiencia
- inventario de frames
- grid / spacing scale
- type scale portal + NOC
- color mapping de estados
- motion spec
- dark/light por experiencia
- componente-a-ruta
- QA visual checklist
```

Hasta entonces este archivo es **DRAFT** y no es Nivel 4.
