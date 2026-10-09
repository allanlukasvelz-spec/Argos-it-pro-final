# VERIFIED KNOWLEDGE — Notebook Forensic Audit

**Audit date:** 2026-08-31  
**Standard:** STRICT VERIFIED KNOWLEDGE GATE v1.0  
**Acceptance threshold:** ENTITY_MATCH = EXACT_ARGOS_IT, SUPPORT = DIRECT or STRONG only

Claims with PARTIAL support appear in NOTES as REVIEW_REQUIRED, not as verified facts.

---

## VK-001 — Método de cuatro fases (modelo notebook)

CLAIM:
El Método Argos-IT documentado en el cuaderno se articula en cuatro fases secuenciales: **Analizamos → Ordenamos → Protegemos → Acompañamos**.

CATEGORY:
METHOD

SOURCE:
El Método Argos-IT: Estrategia de Gestión Tecnológica Proactiva (S-03); corroborado en chat Notebook con citas a fuentes internas [19–27]

SOURCE_TIER:
TIER_B_INTERNAL (body not opened verbatim; STRONG via multi-citation chat grounded on S-03)

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
9

CAN_USE_PUBLICLY:
REVIEW_REQUIRED (contradice modelo 5 fases del repositorio actual)

IMPLEMENTATION_TARGET:
Método / Documentación

NOTES:
Normalizado desde variantes "Analizar/Ordenar/Proteger/Acompañar" en respuestas AI. Ver CONTRADICTIONS.md C-001.

---

## VK-002 — Cuatro pilares de servicio (modelo notebook)

CLAIM:
Los servicios principales en el cuaderno se agrupan en cuatro pilares: **Infraestructura, Seguridad, Sistemas, Continuidad**, gestionados como ecosistema interconectado (no departamentos aislados).

CATEGORY:
SERVICE_DEFINITION

SOURCE:
Argos-IT: Gestión Estratégica y Control Operativo Permanente (S-01); chat "Servicios Principales" con citas [1–2, 3–11]

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
8

CAN_USE_PUBLICLY:
REVIEW_REQUIRED (repo publica 6 slugs de servicio, no 4 pilares)

IMPLEMENTATION_TARGET:
Servicio / Home

NOTES:
Concepto colapsado desde "ecosistema interconectado" / "departamentos estancos". No equivale automáticamente a los 6 servicios actuales (`consultoria-it`, `mantenimiento-informatico`, etc.).

---

## VK-003 — Eslogan histórico del sitio (Texto pegado)

CLAIM:
El material "Texto pegado" incluye el eslogan **"Sistemas que no fallen cuando no deben"** como promesa de valor central.

CATEGORY:
BUSINESS_TRUTH / CONTENT_INSIGHT

SOURCE:
Texto pegado (S-05); chat implementación Fase 1

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
MEDIUM (snapshot histórico; no verificado en build actual)

IMPLEMENTATION_VALUE:
8

CAN_USE_PUBLICLY:
REVIEW_REQUIRED

IMPLEMENTATION_TARGET:
Home / SEO

NOTES:
**No presente** en `frontend/i18n/locales/es.json` actual (`"Tecnología serena para empresas que avanzan"`). Ver C-002.

---

## VK-004 — Dominio corporativo argos-it.com

CLAIM:
El cuaderno está anclado al dominio **argos-it.com** (nota del creador y plan de publicación).

CATEGORY:
BUSINESS_TRUTH

SOURCE:
Notas del creador (S-07); Texto pegado / chat Fase 4

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
DIRECT

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
6

CAN_USE_PUBLICLY:
YES

IMPLEMENTATION_TARGET:
Documentación / Operaciones

NOTES:
Coherente con repositorio y despliegues (.com / .es referenciados en infra docs).

---

## VK-005 — Filosofía: de reactivo a control proactivo permanente

CLAIM:
ARGOS-IT se posiciona frente al soporte reactivo ("apagar fuegos") hacia **gestión proactiva** y **control operativo permanente**, tratando incidencias recurrentes como resultado de decisiones técnicas inconexas y configuraciones heredadas.

CATEGORY:
BUSINESS_TRUTH / METHOD

SOURCE:
Argos-IT: Gestión Estratégica… (S-01); chat Filosofía de Negocio / Ecosistema interconectado

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
9

CAN_USE_PUBLICLY:
YES (sin absolutos tipo 24/7 o "garantizado")

IMPLEMENTATION_TARGET:
Home / Método / Sobre Argos-IT

NOTES:
Alineable con tono repo ("No esperamos a que algo falle" en export WordPress). Evitar "permanente/ininterrumpido" como hecho operativo sin SLA documentado.

---

## VK-006 — Concepto "copias ciegas"

CLAIM:
El cuaderno enmarca el riesgo de **copias de seguridad no verificadas** ("copias ciegas"): empresas que creen estar protegidas porque existe backup, sin comprobar integridad ni restauración.

CATEGORY:
CONTENT_INSIGHT / OPERATIONAL_PROCESS (framing)

SOURCE:
Gestión Estratégica / Continuidad (S-01); chat Continuidad [11]

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
9

CAN_USE_PUBLICLY:
YES

IMPLEMENTATION_TARGET:
Servicio (continuidad) / Diagnóstico

NOTES:
Repo diagnostic Q3 (`diagnosticQuestions.ts`, id `backups`) pregunta por restauración comprobada — **SOURCE_AND_REPO** temático, no textual idéntico.

---

## VK-007 — Infraestructura: diseño vs revisión; tres objetivos

CLAIM:
Infraestructura se define como **diseño estratégico** alineado a operativa (no solo revisión reactiva del caos heredado). Objetivos técnicos citados: **estabilidad, cobertura, rendimiento**.

CATEGORY:
SERVICE_DEFINITION / TECHNICAL_CAPABILITY (framing)

SOURCE:
Argos-IT: Optimización… infraestructura (Studio index); chat "Infraestructura tecnológica robusta" citando S-01 [1, 3, 8]

SOURCE_TIER:
TIER_B_INTERNAL (+ TIER_D index for Studio title)

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
MEDIUM-HIGH

IMPLEMENTATION_VALUE:
8

CAN_USE_PUBLICLY:
YES (evitar "garantizar estabilidad" como absoluto)

IMPLEMENTATION_TARGET:
Servicio / Método (fase Ordenamos)

NOTES:
"Garantizar" en chat AI = HIGH_RISK; no importado como hecho.

---

## VK-008 — Seguridad: accesos, cuentas, dispositivos, procedimientos

CLAIM:
Seguridad en el cuaderno se enfoca en **accesos, cuentas, dispositivos y procedimientos**, fortaleciendo la base operativa desde configuración raíz (no solo antivirus perimetral).

CATEGORY:
SERVICE_DEFINITION

SOURCE:
Gestión Estratégica (S-01); chat Servicios Principales [5–7]

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
8

CAN_USE_PUBLICLY:
YES

IMPLEMENTATION_TARGET:
Servicio (`seguridad-informatica`) / Diagnóstico

NOTES:
Solapa con áreas diagnóstico repo: `security-auth`, `access`.

---

## VK-009 — Sistemas: supervisión proactiva de servidores y puestos

CLAIM:
El pilar Sistemas aborda **servidores, servicios críticos y puestos de trabajo** con configuración, mantenimiento y supervisión proactiva, oponiéndose al modelo solo reactivo.

CATEGORY:
SERVICE_DEFINITION / OPERATIONAL_PROCESS (framing)

SOURCE:
Gestión Estratégica (S-01); chat Servicios Principales [8–9]

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
8

CAN_USE_PUBLICLY:
REVIEW_REQUIRED (no confundir con producto NOC implementado)

IMPLEMENTATION_TARGET:
Servicio (`mantenimiento-informatico`) / Portal

NOTES:
"Command Center" en repo es copy/marketing; no prueba supervisión 24/7 real.

---

## VK-010 — Paleta histórica crema / azul marino (Texto pegado)

CLAIM:
Texto pegado documenta paleta: fondo crema **#f6f4ef**, texto/cuerpo azul marino **#0b1830 / #13233e**.

CATEGORY:
UX_INSIGHT

SOURCE:
Texto pegado (S-05); chat Fase 2 Ordenamos

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG (for historical snapshot)

CONFIDENCE:
MEDIUM

IMPLEMENTATION_VALUE:
5

CAN_USE_PUBLICLY:
N/A (design tokens)

IMPLEMENTATION_TARGET:
Design system

NOTES:
Repo actual (`argos-corporate.css`): `--argos-ivory: #f7f7f5`, `--argos-navy: #1f3a5f`, `--argos-ink: #0b1320` — **drift documentado**, no contradicción de identidad.

---

## VK-011 — Navegación principal de cinco entradas

CLAIM:
Texto pegado describe menú: **Inicio, Servicios, Método, Sobre Argos-IT, Contacto**.

CATEGORY:
UX_INSIGHT

SOURCE:
Texto pegado (S-05)

SOURCE_TIER:
TIER_B_INTERNAL

ENTITY_MATCH:
EXACT_ARGOS_IT

SUPPORT:
STRONG

CONFIDENCE:
HIGH

IMPLEMENTATION_VALUE:
7

CAN_USE_PUBLICLY:
YES

IMPLEMENTATION_TARGET:
Chrome global

NOTES:
**SOURCE_AND_REPO:** `frontend/lib/corporateNav.ts` incluye estructura equivalente (+ `/portal` en worktree actual).

---

## VK-012 — Roles mascotas Dumbo/Chico (solo repo; notebook sin origen)

CLAIM:
**No verificado en notebook:** historia o significado de Chico/Dumbo. **Verificado en repositorio:** Dumbo = guía/acompañamiento; Chico = protección/vigilancia (`"Dumbo te guía. Chico te protege."`).

CATEGORY:
MASCOT_CONTEXT

SOURCE:
Notebook chat (negativa explícita) + `frontend/i18n/locales/es.json` mascots/home.explainer

SOURCE_TIER:
TIER_B_INTERNAL (repo) / TIER_D (notebook negation)

ENTITY_MATCH:
EXACT_ARGOS_IT (repo); UNKNOWN origin story

SUPPORT:
STRONG (roles actuales); DIRECT (notebook lacks origin)

CONFIDENCE:
HIGH (roles); NONE (origin)

IMPLEMENTATION_VALUE:
7

CAN_USE_PUBLICLY:
YES (roles only)

IMPLEMENTATION_TARGET:
Mascotas / Home explainer

NOTES:
PNG filenames in chat match `frontend/sprites/spriteManifest.ts` paths. Origin myth from Disney/Wikipedia **rejected**.

---

## REVIEW_REQUIRED (not promoted to verified facts)

| Topic | Support | Reason |
|-------|---------|--------|
| Acronis como motor de backup ARGOS | INFERRED / TIER_D | Zero repo evidence; HIGH_RISK claims |
| Tres puntos de dolor (urgencia, fallos, copias ciegas) | PARTIAL | Synthesis in AI plan; conceptually aligned |
| Cuestionario notebook vs 12 preguntas repo | PARTIAL | Studio "Argos-IT Cuestionario" not opened |
| 24/7, recuperación inmediata, nunca fallar | UNSUPPORTED | Marketing absolutes |

---

## Summary counts

| Metric | Value |
|--------|------:|
| VERIFIED_CLAIMS (VK entries) | 12 |
| STRONG_CLAIMS | 11 |
| DIRECT_CLAIMS | 1 |
| INFERRED (documented, not accepted) | 4+ |
| HIGH_RISK_CLAIMS flagged | 6 |
