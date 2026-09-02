# FASE 21.5 — Corporate Chrome Foundation

**Pilot:** `/contacto`  
**Direction:** LIGHT_PREMIUM_INSTITUTIONAL  
**Visual change in 21.5:** YES — chrome (header/footer) on `/contacto` only

## Decision

Corporate chrome is a **parallel** header/footer, not a `variant` on legacy `SiteHeader`/`SiteFooter`.

`SiteShell` is the only composer. Ownership comes from a single registry (`getChromeOwner(pathname)`). `CorporatePageShell` remains the page **canvas**, not the chrome owner.

## Route ownership

| `getChromeOwner` | Routes | Chrome |
|------------------|--------|--------|
| `none` | `/auth/*`, `/dashboard`, `/explainer` | none (unchanged) |
| `corporate` | `/contacto` (+ subpaths) | `CorporateHeader` + `CorporateFooter` |
| `legacy` | everything else | `SiteHeader` + `SiteFooter` (untouched) |

**21.6 contract:** add the next route to `frontend/lib/chromeOwnership.ts` and swap that page’s canvas to `CorporatePageShell`. Do not copy header/footer per page.

## Key files

| File | Role |
|------|------|
| `frontend/lib/chromeOwnership.ts` | Single ownership registry |
| `frontend/lib/corporateNav.ts` | Shared IA (desktop + mobile) |
| `frontend/components/corporate/CorporateHeader.tsx` | Corporate header |
| `frontend/components/corporate/CorporateFooter.tsx` | Corporate footer |
| `frontend/components/layout/SiteShell.tsx` | Composes chrome by owner |
| `frontend/assets/css/argos-corporate.css` | Chrome CSS under `.argos-corporate` |

## Isolation

- `SiteHeader.tsx` / `SiteFooter.tsx` are **not** modified.
- Home, Método, Servicios, Auth, Dashboard stay pixel-identical (`maxDiffPixels = 0`).
- Only `contacto-chromium-darwin.png` and `contacto-chromium-linux.png` may change.

## Residuals (accepted)

- `CookieBanner` remains legacy (`#2563EB`) on `/contacto` (shared overlay; visual e2e masks/hides it).
- `ClientAssistants` remain on `/contacto` (not chrome).
- Corporate header is shorter than legacy (no Dumbo slot).
- `SiteShell` remains a client component.

## Forbidden in Corporate chrome files

Hex `#18D4F7`, `#2563EB`, `#38BDF8`. No Dumbo/`DiagnosticPromoBanner` slot, no 2xl pills, no cyan diagnostic CTA, no `#planes`.
