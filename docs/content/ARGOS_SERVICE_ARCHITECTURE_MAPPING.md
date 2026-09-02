# ARGOS Service Architecture Mapping — 4 Pillars → 6 Services

**Resolution:** Decision Resolution 02 (analysis only)
**Date:** 2026-08-31
**Owner direction:** C-003 = APPROVE_WITH_CONDITION (four pillars over six services; no implementation until this mapping exists)
**Pillar source:** VK-002 (S-01) — Infraestructura, Seguridad, Sistemas, Continuidad
**Service source:** TIER_A — `frontend/lib/services.ts`, `es.json` services.* (baseline §4)

---

## Architectural distinction (tested)

| Level | Question it answers | Abstraction |
|-------|---------------------|-------------|
| **LEVEL 1 — Pillar** | *What part of the client's technological operation are we responsible for understanding, protecting, or maintaining?* | Operating model / responsibility zones |
| **LEVEL 2 — Service** | *What concrete type of help can the client receive?* | Commercial SKU / engagement type |

**Does the distinction hold for all six services?**

| Service | Holds? | Notes |
|---------|--------|-------|
| consultoria-it | **Partial** | SKU is "external judgment" — spans all pillars by design |
| mantenimiento-informatico | **Yes** | Clear Sistemas delivery |
| seguridad-informatica | **Yes** | Clear Seguridad delivery |
| web-wordpress | **Partial** | SKU is "web" — touches multiple pillars |
| automatizacion-ia | **Partial** | SKU is "automation" — process layer over Sistemas + Optimizar method |
| auditoria-digital | **Partial** | SKU is "periodic review" — Continuidad-shaped but audits all areas |

**Conclusion:** Distinction **holds structurally** if cross-cutting services are labeled honestly. It **fails** if every service is forced into a single pillar without nuance.

---

## Pillar definitions (verified — VK-002, VK-007, VK-008, VK-009, VK-006)

| Pillar | Scope (verified) |
|--------|------------------|
| **Infraestructura** | Diseño/revisión de conectividad; estabilidad, cobertura, rendimiento; arquitectura alineada a operativa (VK-007) |
| **Seguridad** | Accesos, cuentas, dispositivos, procedimientos; base operativa desde configuración raíz (VK-008) |
| **Sistemas** | Servidores, servicios críticos, puestos de trabajo; configuración, mantenimiento, supervisión proactiva (VK-009) |
| **Continuidad** | Copias verificadas vs "copias ciegas"; recuperación operativa; vigilancia del propio sistema de protección (VK-006) |

---

## Six public services (authoritative copy — `es.json`)

| Slug | Title | Description (first sentence) |
|------|-------|------------------------------|
| `consultoria-it` | Consultoría IT premium | Criterio tecnológico externo para ordenar infraestructura, riesgos, soporte, web, herramientas y prioridades… |
| `mantenimiento-informatico` | Mantenimiento informático para empresas | Soporte preventivo y correctivo para mantener equipos, usuarios, sistemas y documentación… |
| `seguridad-informatica` | Seguridad informática y protección digital | Revisión y refuerzo de accesos, copias, plataforma web, usuarios, sistemas críticos… |
| `web-wordpress` | Web y presencia digital | Diseño web profesional, mantenimiento, alojamiento, SEO técnico y mejoras de conversión… |
| `automatizacion-ia` | Automatización con IA | Automatización de tareas repetitivas, formularios, solicitudes, mensajes y procesos… |
| `auditoria-digital` | Auditoría digital continua | Revisión periódica de web, plataforma digital, seguridad, rendimiento, formularios, SEO… |

---

## Service mapping table

| SERVICE | CURRENT_DESCRIPTION (summary) | PRIMARY_PILLAR | SECONDARY_PILLARS | WHY | EVIDENCE | CONFIDENCE | MAPPING_RISK |
|---------|------------------------------|----------------|---------------------|-----|----------|------------|--------------|
| **consultoria-it** | Hoja de ruta externa: infraestructura, riesgos, soporte, web, prioridades | **Infraestructura** | Seguridad, Sistemas, Continuidad | Entry engagement maps dependencies and architecture before investment — notebook "diseño estratégico" (VK-007); related method Analizar slugs `consultoria-it`, `auditoria-digital` | `es.json`; `methodArgosSteps` Analizar relatedServiceSlugs; VK-007 | MEDIUM | **CROSS_CUTTING** — misread as "only networks" if pillar copy is too narrow |
| **mantenimiento-informatico** | Soporte preventivo/correctivo; equipos, usuarios, sistemas, documentación | **Sistemas** | Continuidad, Infraestructura | VK-009 servers/workstations; baseline problem text "continuidad del negocio"; Supervisar links this slug | VK-009; `es.json`; `methodArgosSteps` Supervisar relatedServiceSlugs | **HIGH** | Low |
| **seguridad-informatica** | Accesos, copias, web, usuarios, sistemas críticos | **Seguridad** | Continuidad | VK-008; includes backup/recovery evaluation — touches Continuidad without being Continuidad-primary | VK-008; `es.json`; Reforzar relatedServiceSlugs | **HIGH** | Medium if copias framed as vendor/SLA guarantee (Acronis BLOCKED) |
| **web-wordpress** | Web profesional, hosting, SEO, conversión, mantenimiento | **Sistemas** | Infraestructura, Seguridad, Continuidad | Public-facing **system** the business runs on; not purely network infra (VK-007). Hosting/coverage → Infraestructura secondary; forms/security → Seguridad | `es.json`; diagnostic areas Web, Rendimiento; Optimizar relatedServiceSlugs `web-wordpress` | MEDIUM | **CROSS_CUTTING** — pillar diagram may undersell web as "Sistemas" |
| **automatizacion-ia** | Flujos, formularios, IA controlada, integraciones | **Sistemas** | Seguridad, Continuidad | Automates **operational processes** on existing systems (VK-009 process layer); permissions/validation → Seguridad; documentation/validation → Continuidad | `es.json`; Optimizar relatedServiceSlugs `automatizacion-ia`; diagnostic `automation` | MEDIUM | **CROSS_CUTTING** — could be mistaken for separate "IA pillar" (do not invent) |
| **auditoria-digital** | Revisión periódica: web, seguridad, rendimiento, formularios, SEO | **Continuidad** | Seguridad, Sistemas, Infraestructura | Prevents "abandon until incident" (VK-006 framing); Supervisar-adjacent; periodic evidence | VK-006; `es.json` problem; Analizar/auditoria link | **HIGH** | Low — clear "ongoing verification" SKU |

---

## Cross-cutting services

| Service | Flag | Primary still required? |
|---------|------|-------------------------|
| consultoria-it | **CROSS_CUTTING** | Yes — **Infraestructura** as strategic entry (roadmap/diagram anchor) |
| web-wordpress | **CROSS_CUTTING** | Yes — **Sistemas** as owned digital asset |
| automatizacion-ia | **CROSS_CUTTING** | Yes — **Sistemas** as process layer |
| mantenimiento-informatico | — | Single-pillar dominant |
| seguridad-informatica | — | Single-pillar dominant |
| auditoria-digital | — | Single-pillar dominant (with natural secondaries) |

**CROSS_CUTTING_SERVICES =** `consultoria-it`, `web-wordpress`, `automatizacion-ia`

---

## Pillar → services (reverse index)

| Pillar | Primary services | Secondary touch |
|--------|------------------|-----------------|
| Infraestructura | consultoria-it | web-wordpress (hosting), mantenimiento-informatico |
| Seguridad | seguridad-informatica | consultoria-it, web-wordpress, automatizacion-ia, auditoria-digital |
| Sistemas | mantenimiento-informatico, web-wordpress, automatizacion-ia | consultoria-it, auditoria-digital |
| Continuidad | auditoria-digital | mantenimiento-informatico, seguridad-informatica, consultoria-it |

Every pillar has ≥1 primary or strong secondary attachment. **No orphan pillar.**

---

## Special cases (requested)

### Consultoría IT

- **Not** Infraestructura-only in delivery — it is the **strategic front door** (Analizar-aligned).
- Maps to notebook "Analizamos" + Infraestructura "diseño estratégico" (VK-007).
- **Risk:** Selling as "solo redes" contradicts `es.json` (web, herramientas, prioridades).

### WordPress / Web

- Notebook Infraestructura emphasizes **network** stability/coverage/performance — web is a **business system**, not cabling.
- PRIMARY **Sistemas** avoids inventing a "Presencia digital" fifth pillar.
- **Risk:** Client expects "Web" under a visible marketing category — solved at LEVEL 2 (service card), not by forcing LEVEL 1 rename.

### Automatización / IA

- Method home: Optimizar phase owns automation narrative (`methodArgosSteps` Optimizar).
- Pillar: **Sistemas** (how work flows through tools people use).
- **Risk:** "IA" hype language — stay with repo copy "enfoque seguro y controlado" (VERIFIED).

---

## Failure condition evaluation

| Test | Result |
|------|--------|
| Artificial categorization? | **No** — if cross-cutting disclosed |
| Duplicated meaning? | **Low risk** — pillars = zones; services = SKUs; overlap is explicit |
| User confusion? | **Medium** without UI hierarchy (pillar intro → six cards) |
| Unsupported service claims? | **No** — mappings derive from existing `es.json` + VK |

---

## Recommended public structure (analysis only)

```
Nivel 1 — Cómo organizamos la responsabilidad
  Infraestructura · Seguridad · Sistemas · Continuidad

Nivel 2 — Cómo puedes contratar ayuda concreta
  [6 service cards unchanged]
```

Optional one-line bridge: *"Los cuatro pilares describen el terreno; los seis servicios son las formas en que entramos a trabajar contigo."*

---

## Stop-gate (services)

| Field | Value |
|-------|-------|
| **SERVICE_4_TO_6_MAPPING** | **VALID** (with 3 cross-cutting flags) |
| **FOUR_OVER_SIX_VALID** | **YES** — conditional on two-level UI/copy |
| **CROSS_CUTTING_SERVICES** | `consultoria-it`, `web-wordpress`, `automatizacion-ia` |
| **PRIMARY_PILLAR impossible cases** | **0** |

**Implementation blocked** until owner confirms PRIMARY assignments (especially web-wordpress = Sistemas vs split marketing).
