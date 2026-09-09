# ARGOS — Framer → Next.js Visual SoT Reconciliation

**Date:** 2026-08-26  
**Mode:** DESIGN_FORENSICS_AND_LOCAL_IMPLEMENTATION  
**Deploy:** NO  
**STOP_FOR_HUMAN_VISUAL_REVIEW:** YES

Human visual evidence supplied in-session:

1. Framer **ARGOS Corporate Visual Lab** (PUBLIC Home)
2. Framer **ARGOS — Product UI Master** (`/noc` Command Center mock)

---

## FRAMER_SOT_MAP

| Surface | Framer project | In repo? | Role |
|---------|----------------|----------|------|
| PUBLIC | ARGOS Corporate Visual Lab | **NO export**; human screenshot only; review doc on `design/21-7c-relume-framer-freeze` (`ARGOS_FRAMER_REVIEW_21_7C.md`, login-blocked historically) | Composition / visual language for Corporate |
| PRODUCT | ARGOS — Product UI Master | **NO export**; named in `ARGOS_FRAMER_HANDOFF.md`, `ARGOS_DESIGN_CONTRACT.md`; human `/noc` screenshot | Shell density / operational hierarchy for Client+NOC |
| Framer code / iframe | — | Forbidden | Never runtime SoT |

Observed Corporate Lab traits (from human screenshot):

- Compact nav: Servicios · Método · Sobre ARGOS · Contacto (outline)
- Hero split: Cormorant H1 «Tecnología serena…» + dark Perimeter module (not NOC)
- Numbered editorial sections (`01 / REALIDAD…`, `02 / FILOSOFÍA`)
- Hairline rule lists; sand philosophy band
- Warm ivory / white; navy type; restrained teal

Observed Product Master traits (from human screenshot):

- Dense navy sidebar «ARGOS NOC»
- Metric strip, operational queue table, selected signal, L0–L3 safety gates
- Sans-only UI; high density; MOCK labels in lab
- **Not** Corporate Home composition

---

## RELUME_SOT_MAP

| Artifact | Path | Role |
|----------|------|------|
| Relume handoff | `docs/blueprint/handoff/ARGOS_RELUME_HANDOFF.md` | IA / journeys / sitemap |
| Relume review 21.7C | branch `design/21-7c-relume-framer-freeze` | Sitemap PASS; Home REFERENCE_ONLY; paywall |
| Canonical wireframes | `docs/design/ARGOS_LOCAL_CANONICAL_WIREFRAMES_21_7C.md` | **Locked Home section order** |
| Visual wireframes 21.7C.1 | `docs/design/ARGOS_WIREFRAMES_21_7C_1.md` | Tokens, spacing, type scale candidate |

**Home order (LOCKED):**  
Hero → Reality → Philosophy → Principles → Method intro → Five phases → Services → Stability → Human trust (no testimonials) → Final CTA → Footer

---

## NEXTJS_CURRENT_MAP

| Area | Path / state |
|------|----------------|
| Home | `frontend/components/pages/HomeView.tsx` — Framer-lab composition WIP |
| Perimeter motif | `frontend/components/home/HomePerimeterPanel.tsx` |
| Corporate CSS | `frontend/assets/css/argos-corporate.css` |
| Chrome | `CorporateHeader` / `CorporateFooter` / `chromeOwnership` |
| Services/Method/About/Contact | Corporate shell (Quiet Authority tokens) |
| Client | `ClientPortalShell` — functional Phase shells; **not** Product UI Master pixel port |
| NOC | `NocShell` — functional; **not** Product UI Master pixel port |
| Mascots | `ClientAssistants` dock ASSISTANT_ONLY on public; hidden on auth/dashboard/noc |

---

## DIFFERENCE_MATRIX (PUBLIC)

| Element | Framer Corporate Lab | Next.js before this pass | Decision |
|---------|----------------------|--------------------------|----------|
| Header nav | Compact; Contacto outline CTA | Dense / Solicitar consulta solid; Inicio in nav | **ADAPT** → Framer compact + Portal KEEP |
| Hero copy | «Tecnología serena…» | Legacy marketing H1 | **REPLACE** |
| Hero layout | Split + dark Perimeter panel | Text-only / prior SaaS-ish | **REPLACE** |
| Reality | 01 + 3 hairline items | Chip cloud / different H2 | **REPLACE** |
| Philosophy | Sand band + large display | White italic quote | **ADAPT** |
| Principles→CTA | Editorial numbered journey | Card/chip heavy | **ADAPT** |
| Technical module | Perimeter observation (grammar) | Fake Command Center (legacy removed) | **KEEP** Perimeter / **REMOVE** NOC-on-Home |
| Mascots in hero | Absent | Dock overlay only (correct) | **KEEP** ASSISTANT_ONLY |
| Lang bar | Absent in Framer canvas | Present (i18n architecture) | **KEEP** (product requirement) |
| Portal link | Absent in Framer canvas | Present | **KEEP** (auth entry) |

## DIFFERENCE_MATRIX (PRODUCT)

| Element | Product UI Master | Next.js Client/NOC | Decision this mission |
|---------|-------------------|--------------------|------------------------|
| NOC sidebar density | High, navy, Command Center active | Functional `NocShell` nav | **KEEP** logic; visual port **DEFERRED** |
| Metric cards / queue / L3 gates | Lab composition with MOCK | Real data surfaces exist | **KEEP** functional; **NO** Framer mock rewrite |
| Client shell | Master `/dashboard` (not in screenshot set fully) | `ClientPortalShell` | **DEFERRED** visual |
| Auth / tenant / reports / agents | N/A visual | Intact APIs | **KEEP** — no rewrite |

---

## CHICO / MASCOT FORENSICS

| Role | Spec | Value |
|------|------|-------|
| CHICO_PUBLIC_ROLE | Placement freeze 21.6B | ASSISTANT_ONLY overlay; **not** hero/header/body |
| CHICO_CLIENT_ROLE | CURRENT ASSISTANT_ONLY; TARGET Guardian on security routes (runtime NO) | Dock / future guardian — **not** implemented as chrome |
| CHICO_NOC_ROLE | CHICO Guardian contract | **FORBIDDEN** |
| CHICO_AUTH_ROLE | Placement freeze | **NO** |

Dogs on Home viewport in prior screenshots = **ASSISTANT_ONLY dock** (canonical placement) + cookie chrome — **not** Framer hero decoration.  
About emblem (`argos-history-emblem.png`) = static brand asset, allowed on About only.

If Framer Corporate Lab shows no dogs in first viewport: current dock may still appear (product overlay). **Unresolved for human:** hide dock on Home first viewport vs keep ASSISTANT_ONLY — default **KEEP** dock until human decides.

---

## IMPLEMENTATION NOTES (local only)

Completed in this reconciliation pass:

- Home rewritten to Corporate Visual Lab composition (Relume order preserved)
- i18n ES/EN/CA Framer-lab hero/reality/philosophy indices
- Perimeter panel (grammar, not metrics)
- Header CTA outline Contacto; nav without Inicio/Contacto duplicates
- Corporate CSS editorial rules / sand band / phase rail
- **No** Client/NOC visual rewrite
- **No** staging/infra/DB/DNS/production changes

---

## FINAL REPORT

```
===== ARGOS FRAMER → NEXT.JS RECONCILIATION =====

PUBLIC_SOT= Relume IA + Corporate Visual Lab (human screenshot) + Quiet Authority tokens
PRODUCT_SOT= Functional Client/NOC + Product UI Master (reference only; no export)
RELUME_ROLE= Information architecture / hierarchy / routes
FRAMER_ROLE= Visual composition lab (NOT source code; NOT embed)
NEXTJS_ROLE= Authoritative runtime implementation

CURRENT_PUBLIC_MATCH= PARTIAL — local Home tracks Corporate Visual Lab; awaiting human approval
CURRENT_PRODUCT_MATCH= NOT_ALIGNED — Product UI Master port DEFERRED (shells preserved)

PUBLIC
header= ADAPTED
hero= REPLACED
typography= ALIGNED (Cormorant/Inter)
grid= ADAPTED editorial
sections= Relume order KEEP + Framer numbered indices
technical_modules= Perimeter KEEP (NOT NOC)
chico= ASSISTANT_ONLY KEEP (open: hide on Home?)
responsive= 1440/tablet/mobile captured

PRODUCT
client_shell= PRESERVED
noc_shell= PRESERVED
tables= PRESERVED
status_system= PRESERVED
operational_hierarchy= PRESERVED

FUNCTIONAL
auth_preserved= YES
tenant_security_preserved= YES
reports_preserved= YES
agents_preserved= YES
evidence_preserved= YES

LOCAL_VALIDATION
typescript= PASS
unit= 6 PASS
e2e= 9 PASS (:3016)
screenshots= framer-reconcile-*.png

STAGING_CHANGED=NO
INFRA_CHANGED=NO
DATABASE_CHANGED=NO
DNS_CHANGED=NO
PRODUCTION_CHANGED=NO

FINAL_STATUS=FRAMER_ALIGNED_LOCAL_BUILD_READY_FOR_HUMAN_REVIEW
STOP_FOR_HUMAN_VISUAL_REVIEW=YES
```

Review artifacts:

- `docs/architecture/phase8-validation-artifacts/framer-reconcile-home-1440.png`
- `docs/architecture/phase8-validation-artifacts/framer-reconcile-home-tablet.png`
- `docs/architecture/phase8-validation-artifacts/framer-reconcile-home-mobile.png`
- `docs/architecture/phase8-validation-artifacts/framer-reconcile-servicios-1440.png`
- `docs/architecture/phase8-validation-artifacts/framer-reconcile-metodo-1440.png`
- `docs/architecture/phase8-validation-artifacts/framer-reconcile-contacto-1440.png`
- `docs/architecture/phase8-validation-artifacts/framer-reconcile-auth-login-1440.png`
- Product baselines unchanged: `noc-command-center.png`

Full map: `docs/design/ARGOS_FRAMER_NEXTJS_RECONCILIATION.md`
