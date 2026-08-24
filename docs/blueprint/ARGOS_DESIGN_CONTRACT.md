# ARGOS Design Contract

```
STATUS = AWAITING_RELUME_AND_FRAMER
STAGE = 1_ARCHITECTURAL_PRODUCT_BLUEPRINT
AUTHORITY = LEVEL_4_WHEN_COMPLETE
IMPLEMENTATION_BINDING = NO
```

Este documento será el **contrato definitivo** que Cursor deberá obedecer durante la implementación visual (Nivel 5).

**No está completo.** Completarlo ahora con valores inventados violaría el flujo Cursor → Relume → Framer → Cursor.

---

## 1. Qué queda cerrado ya (Nivel 1–2 + marca existente)

Estas cláusulas **no esperan** a Relume/Framer. Relume y Framer no pueden contradecirlas.

| Cláusula | Valor | Fuente |
|----------|-------|--------|
| Tres experiencias, un núcleo | PUBLIC / CLIENT / NOC sobre el mismo ARGOS Core | Blueprint de producto |
| Aislamiento de tenant | ORG A no ve ORG B | Seguridad |
| UNKNOWN ≠ HEALTHY | Sin datos suficientes no se afirma protección | Producto |
| Números de demo | Etiqueta MOCK / DEMO / PLACEHOLDER | Producto |
| Automatización Level 3+ | Requiere aprobación humana en UI | Producto |
| Logo / Chico / Dumbo | PROTECTED; no regenerar | Design Director Brief |
| Paleta canónica Corporate | `#1F3A5F` `#2F7D6D` `#F7F7F5` `#0B1320` | CAB-DS-01 |
| Tipografía Corporate | Cormorant display + Inter body/UI; Manrope REJECTED | Brief |
| Dirección Corporate | QUIET_AUTHORITY / LIGHT_PREMIUM_INSTITUTIONAL | Visual Freeze 21.6B |
| Mascotas | ASSISTANT_ONLY; WALK REJECTED | Mascot freezes |
| Rutas públicas actuales | No se eliminan sin aprobación humana | IA actual + Relume handoff |
| Copy inventada | `AI_DRAFT_DO_NOT_SHIP` | Brief |

---

## 2. Qué queda expresamente abierto

| Decisión | Estado | Quién la cierra |
|----------|--------|-----------------|
| Sitemap TARGET (páginas públicas nuevas) | OPEN | Relume + humano |
| Jerarquía de navegación portal cliente | OPEN (estructura propuesta en blueprint) | Relume + humano |
| Jerarquía de navegación NOC | OPEN (estructura propuesta en blueprint) | Relume + humano |
| Composición visual definitiva | OPEN | Framer + humano |
| Tipografía definitiva del portal y del NOC | OPEN | Framer + humano (Corporate ya tiene freeze) |
| Spacing / tamaños exactos | OPEN | Framer + humano |
| Motion definitivo | OPEN | Framer + humano |
| Representación final de dashboards | OPEN | Framer + humano |
| Migración visual Home producción | NO autorizada | Freeze 21.6B + fase visual futura |

---

## 3. Plantilla que se rellenará después

Cuando Relume y Framer estén aprobados, este archivo deberá incluir:

1. Sitemap congelado (rutas + labels).
2. Componentes canónicos (nombre, propósito, estados).
3. Tokens visuales por experiencia (Public / Client / NOC).
4. Semántica de estados (PROTECTED … UNKNOWN) con color y forma **aprobados**.
5. Breakpoints y comportamiento responsive congelado.
6. Accesibilidad: contraste, foco, landmarks, reduced motion.
7. Lista de assets permitidos y prohibidos.
8. Criterio de aceptación visual por ruta.
9. Firma humana: `DESIGN_CONTRACT_STATUS = BINDING`.

Hasta entonces:

```
CURSOR_MAY_IMPLEMENT_FUNCTION = YES (solo fases autorizadas)
CURSOR_MAY_IMPLEMENT_FINAL_UI = NO
RELUME_REQUIRED = YES
FRAMER_REQUIRED = YES
```

---

## 4. Relación con documentos vivos

- Principios de marca vigentes: `docs/design/ARGOS_DESIGN_DIRECTOR_BRIEF.md`
- Freeze visual Corporate: `docs/design/ARGOS_VISUAL_FREEZE_21_6B.md`
- Entrada Relume: `docs/blueprint/handoff/ARGOS_RELUME_HANDOFF.md`
- Entrada Framer (borrador): `docs/blueprint/handoff/ARGOS_FRAMER_HANDOFF.md`
- Función de producto: `docs/blueprint/ARGOS_MASTER_PRODUCT_BLUEPRINT.md`
