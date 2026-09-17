# ARGOS Public UI Reconciliation — Component Map (21.7C.1)

**Status:** PUBLIC_UI_RECONCILED (local)
**Date:** 2026-08-26
**Scope:** Public frontend only

## Home hierarchy (KEEP order)

1. Hero → 2. Reality/Problem → 3. Philosophy → 4. Principles → 5. Method intro → 6. Five phases → 7. Six services → 8. Stability → 9. Human trust (no testimonials) → 10. Final CTA → Corporate Footer

## Component disposition

| Component / surface | Decision | Notes |
|---------------------|----------|-------|
| `SiteShell` + `chromeOwnership` | ADAPT | `/`, `/servicios*`, `/metodo*`, `/sobre-argos-it`, `/contacto*` → `corporate` |
| `CorporateHeader` / `CorporateFooter` | KEEP | Now owns all Quiet Authority public chrome |
| Legacy `SiteHeader` / `SiteFooter` | KEEP (legal only) | No diagnostic promo on legal |
| `HomeView` | REPLACE | Quiet Authority sections; no Command Center / side-nav / testimonials |
| `HomeAutomationArgosSection`, `HomeBrandSlogan`, `HomeWhyArgosSection`, `MethodArgosShowcase` on Home | REMOVE (from Home) | Files may remain unused |
| `ServicesView`, `ServiceDetailView` | REPLACE | CorporatePageShell + Quiet Authority cards |
| `MethodView`, `MethodStepPageView` | REPLACE | No galaxy paint on public method routes |
| `AboutView` | REPLACE | Corporate Quiet Authority |
| `ContactView` | KEEP | Already corporate |
| `LegalPageView` | KEEP | Legacy shell, no promo |
| Client / NOC / Auth shells | KEEP | `chromeOwner=none`; no public leakage |
| Diagnostic promo banner | REMOVE from corporate | `shouldShowDiagnosticPromo` false on Quiet Authority routes |
| ClientAssistants on public | KEEP | Allowed overlay; hidden on product/legal |

## Validation notes

- `frontend/lib/chromeOwnership.test.ts` — PASS
- `frontend` `tsc --noEmit` — PASS
- Staging redeploy — NOT authorized in this mission
- Full G13 against staging — PENDING authorized FE deploy
