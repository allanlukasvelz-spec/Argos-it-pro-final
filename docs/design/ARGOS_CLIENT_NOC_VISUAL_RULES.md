# ARGOS Client vs NOC — Visual Rules

```
STATUS = SPEC_COMPLETE
SHARED_DNA = YES
SAME_APP_CHROME = NO
```

CLIENT and NOC are two private product languages on one platform. They share brand tokens and status semantics. They must not look like one SaaS admin with a swapped menu.

PUBLIC remains the third language (Quiet Authority editorial) and is **not** restyled here.

---

## 1. Shared DNA (must stay aligned)

| Element | Shared rule |
|---------|-------------|
| Palette | `#1F3A5F` `#2F7D6D` `#F7F7F5` `#0B1320` |
| UI typeface | Inter (Cormorant never in app chrome) |
| Status model | HEALTHY / WARNING / CRITICAL / UNKNOWN |
| UNKNOWN | dashed + gray + no check |
| Coverage language | MONITORED ≠ COVERED ≠ HEALTHY |
| Automation | L0–L4; L3 ApprovalGate; no silent auto-fix |
| Mock | MOCK/DEMO/PLACEHOLDER only when not real |
| Logo | official assets only |
| Motion | functional, reduced-motion safe |
| Focus | 2px ring, never outline:none |
| Quality | same craft; NOC is denser, not cheaper |

---

## 2. Divergence (must stay different)

| Axis | CLIENT | NOC |
|------|--------|-----|
| Purpose | Reassure and decide simply | Operate and investigate |
| Density | low–medium; generous `space-6` | high; `space-3`/`space-4`; min 13px type |
| Sidebar | `#1F3A5F`, 248px, 40px items | `#0B1320`, 224px, 32px items |
| Top bar | org + user | ARGOS NOC + **platform** health |
| Language | business Spanish, impact | technical tokens + evidence |
| Primary scan | banner + cards | queue + selected row |
| A/B/C | hidden; client sees impact / “ARGOS actúa / necesita aprobación” | full chain visible |
| Tables | rare; cards first | OperationalQueue is central |
| Reassurance | allowed **if true** | not the goal |
| Cross-tenant | never | org column + scoped fetch |
| Mobile | first-class status | severity drill-down only |
| Decorative quiet | more whitespace | more structure, still no neon |

If a screenshot of Client and NOC is indistinguishable at a glance, the implementation has **failed** this file.

---

## 3. Copy pairing (same event, two languages)

| Internal / NOC | Client |
|----------------|--------|
| TLS hostname mismatch | Se ha detectado una incompatibilidad en la protección HTTPS. |
| TLS EXPIRING | El certificado de seguridad caduca pronto. ARGOS lo está siguiendo. |
| HTTP 5xx confirmed | Su sitio web no está respondiendo correctamente. |
| Database connection refused | Uno de sus servicios de datos no está respondiendo correctamente. |
| UNKNOWN coverage | Todavía no hay información suficiente para confirmar que todo está protegido. |
| Incident MITIGATED | El impacto está contenido. Seguimos trabajando en el origen. |
| Action L3 pending | Se requiere su autorización para una intervención. |
| SIGNAL → EVIDENCE → A | Not shown; “ARGOS está actuando” / “necesita aprobación” |

Do not paste NOC hypothesis/commands into Client cards.

---

## 4. Shell don’ts

**Client must not include:** marketing hero, testimonials, FAQ, pricing, public footer, fake command center, developer console, 9-column ops table, Auto Fix.

**NOC must not include:** testimonial calm, oversized empty-state illustrations, hiding evidence, mixing two tenants, treating platform HEALTHY as “all customers healthy”.

**Neither may include:** cyberpunk glow, scanning animations as decoration, glass identity, `#18D4F7` as brand, Manrope, regenerated mascots in chrome.

---

## 5. Selected / active language

| Surface | Client | NOC |
|---------|--------|-----|
| Nav current | teal fill `#2F7D6D`, 8px radius | same fill, tighter item |
| Card selected | 1px navy border | 2px left bar + outline |
| Queue selected | n/a | left bar + EvidencePanel bound to `organizationId` |
| L3 | button “Se requiere autorización” when policy asks | badge + Request approval always visible on selected L3 signal |

---

## 6. Information hierarchy (frozen)

Do not redesign. Polish typography/spacing/radius only.

**Client Resumen:** Protection Summary → attention/status → coverage → control state → asset health → alerts → incidents → preventive → activity → quick access.

**NOC Command Center:** Global Platform Health → KPIs → operational queue → selected evidence → hypothesis → A → verify → failure evidence → B → C → safe stop/rollback/escalation → safety gates → preventive/predicted → agents/platform health.

---

## 7. Relume vs Framer vs this contract

| Topic | Winner |
|-------|--------|
| Sitemap / destinations | Relume frozen IA |
| Resumen / Command Center composition | Human-approved Framer masters (hierarchy) |
| Marketing patterns from Relume templates | **Removed** (heroes, FAQ, CTA footers) |
| Visual tokens / density refinements | This contract (PASS_WITH_REFINEMENTS) |
| Capabilities | Blueprint + repository |

Framer NOC omitted Support and Platform Health nav items — restore from Relume. Framer Client hierarchy is the Resumen freeze (coverage/control blocks are additive detail Relume did not wireframe at this fidelity).

---

## 8. Control Center naming

Product: **Control Center (marca) = SUPERSEDED por NOC.**

CAB-DS-07 (Control Center visual deferred) is not reopened for production paint. This file specifies **NOC** as the internal target experience for a future authorized UI phase.

`/dashboard` remains the **client portal**, never the NOC.

---

## 9. Mascots

`ASSISTANT_ONLY`. Not in Client or NOC headers. WALK rejected. Placement freeze 21.6B still governs production docks.
