# ARGOS — Frontend Source-of-Truth Reconciliation

```
STATUS                              = DOCS_ONLY / READ_ONLY FORENSICS COMPLETE
DATE                                = 2026-08-26
BRANCH                              = feature/argos-multitenant-platform
RELATED_DESIGN_BRANCH               = design/21-7c-relume-framer-freeze
RUNTIME_CHANGED                     = NO
STAGING_CHANGED                     = NO
PRODUCTION_CHANGED                  = NO
DEPLOY                              = NO
PUSH                                = NO
G13_VISUAL_DESIGN_ALIGNMENT         = BLOCKED_SOURCE_OF_TRUTH_RECONCILIATION
```

## 0. Mission answer

`https://staging.argos-it.es` currently serves the **Next.js application frontend** built from `frontend/` via `Dockerfile.staging`. The **public Home** is the **legacy marketing shell** (nocturnal cyan/`#18D4F7` Command Center hero, floating side-nav, invented testimonials, diagnostic CTA). That presentation is **not** the Relume/Framer-approved Corporate direction (`LIGHT_PREMIUM_INSTITUTIONAL` / Quiet Authority, freeze 21.6B). Relume is documented as **IA/UX only**; Framer as **visual lab / composition reference**, never production SoT. Corporate chrome migration exists only for `/contacto`. Client Portal and NOC are **functional product shells** aligned to Relume IA routes, not Framer pixel ports.

Infrastructure (TLS, Traefik, API, PG, MinIO, worker) is **independent** and must remain frozen for this gate.

---

## 1. Currently deployed frontend (proven)

| Field | Evidence |
|-------|----------|
| Host | `argos-staging-frontend` on VPS `91.108.121.181` |
| Source directory | `/opt/argos-current/frontend` ← rsync of repo `frontend/` |
| Package | `argos-frontend` `2.0.0` (`frontend/package.json`) |
| Framework | Next.js (App Router) |
| Dockerfile | `frontend/Dockerfile.staging` → `npm ci` → `npm run build` → `npm start` |
| Build args | `NEXT_PUBLIC_BACKEND_URL=https://staging.argos-it.es` |
| Overlay | `docker/docker-compose.staging.external.yml` |
| Deployed SHA (VPS marker) | `77cae9d7ad340e1a3eec1319b24f04f74adb37ec` (at last deploy marker; local HEAD may be ahead with ops-only commits) |
| Image | `argos-staging-frontend:latest` |
| Entry | `CMD ["npm", "start"]` port 3000 → Traefik Host `staging.argos-it.es` |
| App layout | `frontend/app/layout.tsx` wraps `SiteShell` |

### Homepage / marketing element → file map

| Visible element | Primary files | Classification |
|-----------------|---------------|----------------|
| Dog logo / header | `frontend/components/layout/SiteHeader.tsx` + Image assets | **LEGACY** chrome |
| Nav Servicios / Método / Sobre / Contacto | `SiteHeader.tsx` `menuItems`; corporate twin `frontend/lib/corporateNav.ts` | **CURRENT** IA destinations; **LEGACY** chrome styling on Home |
| Pill nav Planes / Portal | `SiteHeader.tsx` `pillItems` (`/#planes`, `/auth/login`) | **LEGACY** chrome pattern |
| Language selector | `SiteHeader.tsx` + `frontend/i18n/*` | **CURRENT** i18n |
| Floating side nav | `HomeView.tsx` `.argos-side-nav` | **LEGACY** / rejected noise vs Relume handoff |
| ARGOS Command Center hero | `HomeView.tsx` `.argos-command-center` + `argos-marketing-chrome.css` | **LEGACY** — Relume handoff §2.6: discard fake command-center |
| Dog illustrations / mascots | `ClientAssistants`, diagnostic banner | **CURRENT** assistant policy 21.6B; **forbidden** in Corporate header |
| Diagnostic CTA | `HomeView` CTA + `DiagnosticPromoBanner` | **LEGACY** conversion pattern on legacy Home |
| Home page entry | `frontend/app/page.tsx` → `HomeView` | **LEGACY** painted UI |
| Corporate chrome (approved pilot) | `CorporateHeader` / `CorporateFooter` only when `getChromeOwner` = `corporate` | **CURRENT** for `/contacto` only |

**Overall classification of deployed public Home:** **LEGACY** (Level 3 in `docs/design/source-hierarchy.md`).

**Client / NOC:** **CURRENT** functional product UI (Phase 4–8 shells), not Framer export.

---

## 2. Relume / Framer artifacts found

### Relume

| Artifact | Path / location | Classification |
|----------|-----------------|----------------|
| Handoff (IA + sitemaps) | `docs/blueprint/handoff/ARGOS_RELUME_HANDOFF.md` | **APPROVED IA blueprint** (`STATUS = UX_ARCHITECTURE_APPROVED`, `SITEMAP = FROZEN`) |
| Director brief (roles) | `docs/design/ARGOS_DESIGN_DIRECTOR_BRIEF.md` §22 | Relume = IA + wireframes only |
| Design Contract | `docs/design/ARGOS_DESIGN_CONTRACT.md` | `RELUME_SOURCE_OF_TRUTH = IA / UX only` |
| Review 21.7C | branch `design/21-7c-relume-framer-freeze` → `docs/design/ARGOS_RELUME_REVIEW_21_7C.md` | External Relume project inspected; sitemap PASS; Home REFERENCE_ONLY; paywall on full pages |
| Local wireframes | same branch: `ARGOS_LOCAL_CANONICAL_WIREFRAMES_21_7C.md`, `ARGOS_LOCAL_VISUAL_WIREFRAMES_21_7C_1.md` | Local substitute after Relume paywall |
| Live Relume URL (historical) | `relume.ai/app/project/P3526103_…` (in review doc) | External; not in repo as code |

**No Relume React/Tailwind dump in `frontend/`.**

### Framer

| Artifact | Path / location | Classification |
|----------|-----------------|----------------|
| Handoff | `docs/blueprint/handoff/ARGOS_FRAMER_HANDOFF.md` | Visual lab; not production |
| Design Contract | `FRAMER_SOURCE_OF_TRUTH = NO`, `PIXEL_PERFECT = NO` | Binding policy |
| Source hierarchy L6 | `docs/design/source-hierarchy.md` | Framer masters `/dashboard` + `/noc` = composition **reference** |
| Product UI Master | Named in Contract (external Framer project) | Not exported into repo |
| Review 21.7C | branch docs `ARGOS_FRAMER_REVIEW_21_7C.md` | `FRAMER_EXECUTION = NOT_STARTED` / login blocked in that session |
| `framer-motion` npm | `MethodArgosShowcase.tsx` | Animation library only — **not** Framer site export |

**No Framer-exported site / components kit in repository.**

### Other evidence

- `docs/design/ARGOS_VISUAL_FREEZE_21_6B.md` — Corporate Quiet Authority; desktop Home freeze **direction**; production migration NO at freeze time.
- `docs/design/corporate-chrome-21-5.md` — Corporate chrome **parallel** to legacy; only `/contacto` migrated.
- `docs/architecture/ARGOS_VISUAL_IMPLEMENTATION_DRIFT_AUDIT.md` — Client/NOC vs Framer drift already audited.
- `wordpress-export/` — legacy WP content, not Relume/Framer SoT.

---

## 3. Intended frontend model (evidence-based)

```
INTENDED_FRONTEND_MODEL = C_WITH_QUALIFIERS
```

**Proven model:**

1. **Relume** = information architecture / sitemap / UX wireframes (not visual SoT).
2. **Framer** = unpublished visual lab + Client/NOC composition reference (not host, not export-to-prod).
3. **Next.js `frontend/`** = single deployable application that must eventually implement:
   - PUBLIC Corporate (Quiet Authority) after human visual freeze + migration phase
   - CLIENT Portal (`/dashboard/*`)
   - NOC (`/noc/*`)
4. **Not** a separate Framer-hosted marketing site in production architecture docs for external staging.
5. **Not** “one fused dashboard pretending to be marketing” — Relume §0: three experiences, do not merge.

**Confidence:** **HIGH** for role split (docs consistent across Director Brief, Contract, handoffs, 21.7C).  
**Confidence:** **MEDIUM** for exact Relume TARGET public pages not yet in code (protección preventiva, etc.) — proposed in handoff, not all implemented.  
**Confidence:** **HIGH** that current Home paint is **legacy**, not freeze 21.6B Quiet Authority.

```
FROZEN_IA (public)     = YES (21.6B + Relume CURRENT sitemap)
FROZEN_VISUAL_HOME     = QUIET_AUTHORITY direction YES; painted migration NO on Home
DESIGN_FREEZE_21_7C_1  = CANDIDATE on branch design/21-7c-relume-framer-freeze; HUMAN_DESIGN_REVIEW unset
```

---

## 4. Approved sitemap (reconstructed from evidence)

### PUBLIC SITE — CURRENT (must preserve; Relume handoff §2.1 + corporateNav)

```
/
├── /servicios
│   ├── /servicios/consultoria-it
│   ├── /servicios/mantenimiento-informatico
│   ├── /servicios/seguridad-informatica
│   ├── /servicios/web-wordpress
│   ├── /servicios/automatizacion-ia
│   └── /servicios/auditoria-digital
├── /metodo
│   ├── /metodo/analizar
│   ├── /metodo/reforzar
│   ├── /metodo/guiar
│   ├── /metodo/optimizar
│   └── /metodo/supervisar
├── /sobre-argos-it
├── /contacto
├── /aviso-legal | /privacidad | /cookies
├── /auth/login | /auth/register
└── labs (out of marketing sitemap): /explainer, /mascot-motion-lab
```

**SOURCE_EVIDENCE:** `ARGOS_RELUME_HANDOFF.md` §2.1, `corporateNav.ts`, Relume review 21.7C.  
**CONFIDENCE:** HIGH

**Primary nav (Corporate IA):** Inicio · Servicios · Método · Sobre ARGOS-IT · Contacto  
**SOURCE_EVIDENCE:** `corporateNav.ts`, Relume §2.5. **CONFIDENCE:** HIGH

### PUBLIC TARGET (Relume may add; must not delete CURRENT)

New narrative pages proposed (protección preventiva, monitorización 24/7, casos de uso, …) — **TARGET only**.  
**CONFIDENCE:** MEDIUM (handoff proposal; not all frozen into code).

### CLIENT AREA

```
/dashboard                         Resumen
/dashboard/activos (+ children)
/dashboard/monitorizacion
/dashboard/seguridad
/dashboard/alertas
/dashboard/incidentes
/dashboard/prevencion
/dashboard/auditorias
/dashboard/informes
/dashboard/soporte
/dashboard/cuenta
```

**SOURCE_EVIDENCE:** Relume §3.1 + `ClientPortalShell.tsx` nav (implemented).  
**CONFIDENCE:** HIGH

### ARGOS PLATFORM / NOC

```
/noc                         Command Center
/noc/organizations | assets | health | monitoring | alerts | incidents
/noc/tls | servers | databases | dns | backups*
/noc/agents | runbooks | remediations | reports
/noc/predicted-risks* | preventive-actions*
/noc/audit | platform-health | support
```

\* placeholders exist in `NocShell.tsx`.  
**SOURCE_EVIDENCE:** Relume §4.1 + `NocShell.tsx`.  
**CONFIDENCE:** HIGH for IA; MEDIUM for full Framer Command Center composition (never ported).

---

## 5. Mental model (four layers)

Derived from Relume §0 + Design Contract §1 + Director Brief — **not** from current Home fusion.

```
A. MARKETING / ACQUISITION (PUBLIC)
   VISITOR → Home (Quiet Authority) → Método / Servicios → Contacto / Diagnóstico
   Login is access, not a marketing chapter.

B. CLIENT EXPERIENCE (PORTAL)
   AUTH → /dashboard Resumen → Activos / Monitorización / Alertas / Incidentes
        → Informes / Prevención / Soporte / Cuenta
   Tone: calm, business; never NOC density.

C. ARGOS OPERATIONAL PLATFORM (NOC)
   ADMIN → /noc Command Center → tenant/assets/monitoring
        → incidents / evidence / remediations / reports / platform-health
   Tone: dense, evidence-driven; no public mascots.

D. TECHNICAL INFRASTRUCTURE (not a UI layer)
   Compose + Traefik + PG + MinIO + worker + scheduler
   Independent of which marketing chrome is painted.
```

**Journey graph (public → client):**

```
VISITOR
  → PUBLIC ARGOS EXPERIENCE
  → DIAGNOSIS / CONVERSION (contacto / diagnostic — honest)
  → AUTH BOUNDARY (/auth/*)
  → CLIENT PORTAL (/dashboard)
  → OBSERVABILITY / REPORTING / SUPPORT
```

**Journey graph (ops):**

```
ADMIN/NOC
  → COMMAND CENTER
  → TENANTS / ASSETS / AGENTS / MONITORING
  → INCIDENTS / EVIDENCE / REMEDIATIONS / REPORTS
```

**SOURCE_EVIDENCE:** Relume handoff journeys §2.4 / §3.7 / §4.6; Design Contract.  
**CONFIDENCE:** HIGH

---

## 6. Gap analysis matrix

| AREA | CURRENT (deployed) | INTENDED | MATCH | ACTION |
|------|--------------------|----------|-------|--------|
| header (Home) | Legacy SiteHeader cyan/blue chrome | Corporate Quiet Authority header | NO | **REPLACE** (paint) / keep destinations |
| navigation IA | Destinations largely match CURRENT sitemap | Corporate primary nav | PARTIAL | **KEEP** destinations; **REPLACE** chrome |
| pill Plans/Portal | Legacy floating pills | Login secondary; no dashboard chrome | NO | **ADAPT** / **REMOVE** pill pattern |
| hero | Nocturnal + fake Command Center | Editorial Quiet Authority Home | NO | **REPLACE** |
| information hierarchy | Tech stack / testimonials / CC metrics | problema → método → servicios → contacto | NO | **REPLACE** |
| services | Real 6 slugs | Same | YES | **KEEP** |
| ARGOS Method | 5 steps present; galaxy/legacy visuals | 5 steps; no cyber galaxy as brand | PARTIAL | **ADAPT** |
| diagnostic flow | Banner + CTA on legacy Home | Allowed conversion; no invented proof | PARTIAL | **ADAPT** |
| conversion CTA | Cyan diagnostic CTA | Single calm primary CTA | PARTIAL | **ADAPT** |
| pricing/plans | `/#planes` section | Plan cards without invented prices | PARTIAL | **ADAPT** |
| portal entry | Header Portal → `/auth/login` | Login visible, not dominant | PARTIAL | **KEEP** route; **ADAPT** chrome |
| authentication | Cookie auth, CSRF | Same (verified code wins) | YES | **KEEP** |
| client portal | Functional shell + Relume routes | Calm Client DNA; Framer hierarchy later | PARTIAL | **PRESERVE_LOGIC_REBUILD_UI** (optional polish phase) |
| NOC | Functional NocShell; reports cp-* reuse | Dense NOC DNA; chrome isolation | PARTIAL | **PRESERVE_LOGIC**; **ADAPT** visuals later |
| reports / PDF | Working API integration | Honest empty/real data | YES (functional) | **KEEP** |
| responsive | Exists; not Quiet Authority Home | Corporate responsive after freeze | PARTIAL | **ADAPT** |
| languages | es/en/ca in header | i18n preserved | YES | **KEEP** |
| footer | Legacy SiteFooter on Home | CorporateFooter pattern | PARTIAL | **REPLACE** on Corporate routes |
| visual system | Legacy `#2563EB` / `#18D4F7` painted | Canonical `#1F3A5F` / `#2F7D6D` / ivory | NO (Home) | **REPLACE** on authorized Corporate migration |
| component architecture | Dual chrome (legacy + corporate pilot) | Expand corporate via `chromeOwnership` | PARTIAL | **ADAPT** (21.5/21.6 plan) |
| floating side nav | Present on Home | Discard marketing noise | NO | **REMOVE** |
| invented testimonials | Present in `HomeView` | Forbidden invented social proof | NO | **REMOVE** |

**overall_match:** **LOW** for public Home visuals; **MEDIUM–HIGH** for Client/NOC **routes/function**; **HIGH** for backend/security integrations.

---

## 7. Functional integrations inventory

| Integration | Classification |
|-------------|----------------|
| auth (HttpOnly cookies, CSRF Origin) | **PRESERVE_AS_IS** |
| API client (`frontend/lib/api.ts`, `clientApi`, `nocApi`) | **PRESERVE_AS_IS** |
| tenant context / isolation | **PRESERVE_AS_IS** |
| client portal pages + nav | **PRESERVE_LOGIC_REBUILD_UI** (if Framer polish authorized later) |
| NOC shell + ops pages | **PRESERVE_LOGIC_REBUILD_UI** |
| reports / PDF retrieval | **PRESERVE_AS_IS** |
| notifications | **PRESERVE_AS_IS** |
| assets / monitoring / alerts / incidents | **PRESERVE_AS_IS** |
| agents | **PRESERVE_AS_IS** |
| diagnostic survey persistence | **PRESERVE_LOGIC_REBUILD_UI** |
| localization i18n | **PRESERVE_AS_IS** |
| security chrome ownership (`chromeOwnership.ts`) | **PRESERVE_AS_IS** (extend Corporate routes carefully) |
| legacy HomeView paint | **REPLACE** (when visual migration authorized) |
| SiteHeader/SiteFooter on Home | **REPLACE** with Corporate chrome when authorized |

---

## 8. Infrastructure

```
change_required_for_design_reconciliation = NO
current_external_staging_preserved        = YES (policy for this gate)
```

Do **not** roll back Compose/Traefik/TLS/API because Home chrome is legacy.

---

## 9. G13 status

| Axis | Status |
|------|--------|
| Functional / security E2E | May remain valid independently of design SoT |
| Visual design alignment | **BLOCKED_SOURCE_OF_TRUTH_RECONCILIATION** |

Do not claim visual G13 complete until an authorized Corporate Home migration (or explicit human acceptance of legacy Home on staging) is recorded.

---

## 10. Recommended next human decision (not executed)

1. Confirm SoT: Relume IA + local 21.7C.1 wireframes + Quiet Authority freeze as Corporate target; Framer optional lab.
2. Authorize a **Corporate Home visual migration** phase (expand `getChromeOwner` + replace `HomeView` paint) **or** accept temporary legacy Home on staging with labeled disclaimer.
3. Keep Client/NOC functional shells; Framer hierarchy polish = separate optional phase.
4. Cherry-pick or merge docs from `design/21-7c-relume-framer-freeze` into working branch for discoverability (docs-only).
5. Only after freeze authorization: implement UI; then re-run visual G13.

---

## Related authority docs

- `docs/blueprint/handoff/ARGOS_RELUME_HANDOFF.md`
- `docs/blueprint/handoff/ARGOS_FRAMER_HANDOFF.md`
- `docs/design/ARGOS_DESIGN_CONTRACT.md`
- `docs/design/ARGOS_DESIGN_DIRECTOR_BRIEF.md`
- `docs/design/ARGOS_VISUAL_FREEZE_21_6B.md`
- `docs/design/corporate-chrome-21-5.md`
- `docs/design/source-hierarchy.md`
- Branch `design/21-7c-relume-framer-freeze` (21.7C Relume/Framer reviews + local wireframes)
