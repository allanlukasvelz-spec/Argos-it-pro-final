# ARGOS Design Contract

```
STATUS = SPEC_COMPLETE_POINTER
STAGE = 1_ARCHITECTURAL_PRODUCT_BLUEPRINT
AUTHORITY = LEVEL_4_SPEC (Client + NOC visual)
IMPLEMENTATION_BINDING = YES when a UI phase is authorized
CURSOR_MAY_IMPLEMENT_FINAL_UI = NO
PHASE_3_AUTHORIZED = NO
```

The visual specification for **Client Portal** and **Internal NOC** now lives in `docs/design/`, not in this placeholder.

**Canonical files:**

| File | Role |
|------|------|
| [docs/design/ARGOS_DESIGN_CONTRACT.md](../design/ARGOS_DESIGN_CONTRACT.md) | Tokens, type, spacing, shells, semantics |
| [docs/design/ARGOS_COMPONENT_SYSTEM.md](../design/ARGOS_COMPONENT_SYSTEM.md) | Reusable components (conceptual) |
| [docs/design/ARGOS_RESPONSIVE_BEHAVIOR.md](../design/ARGOS_RESPONSIVE_BEHAVIOR.md) | Desktop / tablet / mobile |
| [docs/design/ARGOS_UI_STATE_MATRIX.md](../design/ARGOS_UI_STATE_MATRIX.md) | Health, unknown, A/B/C, provenance |
| [docs/design/ARGOS_CLIENT_NOC_VISUAL_RULES.md](../design/ARGOS_CLIENT_NOC_VISUAL_RULES.md) | Two languages, one DNA |
| [docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](../design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md) | CHICO Security Guardian TARGET (runtime NO) |

Framer project **ARGOS — Product UI Master** (`/dashboard`, `/noc`) is a **visual reference** (`PIXEL_PERFECT = NO`, `FRAMER_SOURCE_OF_TRUTH = NO`). Relume is IA/UX. Product capabilities remain the Master Blueprint + verified repository.

PUBLIC Corporate freeze is unchanged: [docs/design/ARGOS_VISUAL_FREEZE_21_6B.md](../design/ARGOS_VISUAL_FREEZE_21_6B.md).

---

## 1. Clauses already closed (Nivel 1–2 + marca)

These still do not wait on tools. Relume/Framer/this spec cannot contradict them.

| Cláusula | Valor | Fuente |
|----------|-------|--------|
| Tres experiencias, un núcleo | PUBLIC / CLIENT / NOC | Blueprint |
| Aislamiento de tenant | ORG A no ve ORG B | Seguridad |
| UNKNOWN ≠ HEALTHY | Sin datos suficientes no se afirma protección | Producto |
| Números de demo | MOCK / DEMO / PLACEHOLDER | Producto |
| Automatización Level 3+ | Aprobación humana en UI | Producto |
| Logo / Chico / Dumbo | PROTECTED | Design Director Brief |
| Paleta canónica | `#1F3A5F` `#2F7D6D` `#F7F7F5` `#0B1320` | CAB-DS-01 |
| Tipografía Corporate | Cormorant display + Inter UI; Manrope REJECTED | Brief |
| Dirección Corporate | QUIET_AUTHORITY / LIGHT_PREMIUM_INSTITUTIONAL | Visual Freeze 21.6B |
| Mascotas | CURRENT: ASSISTANT_ONLY; WALK REJECTED. TARGET: CHICO Security Guardian allowed on Client security surfaces (docs only; runtime NO). DUMBO = guide preserved | Mascot freezes + CHICO Guardian contract |
| Rutas públicas actuales | No se eliminan sin aprobación humana | IA |
| Copy inventada | `AI_DRAFT_DO_NOT_SHIP` | Brief |

---

## 2. What this pointer no longer leaves open (Client + NOC masters)

| Decisión | Estado |
|----------|--------|
| Jerarquía Resumen `/dashboard` | FROZEN (human PASS_WITH_REFINEMENTS) |
| Jerarquía Command Center `/noc` | FROZEN |
| IA nav Relume | FROZEN (sitemap destinations) |
| Spacing / type / badges / responsive strategy | SPECIFIED in `docs/design/` |
| Composición pixel-perfect | NO — Framer is reference |
| PUBLIC restyle | NOT AUTHORIZED |
| Phase 3 / monitoring / NOC runtime | NOT AUTHORIZED |

---

## 3. Implementation gate

```
CURSOR_MAY_IMPLEMENT_FUNCTION = YES (only authorized engineering phases)
CURSOR_MAY_IMPLEMENT_FINAL_UI = NO
RELUME_REQUIRED = DONE (IA approved)
FRAMER_REQUIRED = MASTER_SCREENS_DONE (not exportable production)
DESIGN_CONTRACT_STATUS = SPEC_COMPLETE
```
