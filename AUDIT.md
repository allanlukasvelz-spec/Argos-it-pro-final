# AUDIT — ARGOS-IT platform (phase 1)

**Date:** 2026-10-09
**Scope:** Next.js public site, client portal, and internal surface in this repository. `wordpress-export/` is a static historical export, not the runtime. The `la-bobila-menu-system` branch was not touched. Nothing was deployed.

**Runtime of record:** `frontend/` (Next.js 16, App Router) + `backend/` (Express) + PostgreSQL (`database/schema.sql`).

## How to build and run

```bash
npm ci
npm ci --prefix frontend
npm ci --prefix backend
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
# Then set DATABASE_URL, JWT_SECRET and JWT_REFRESH_SECRET (each >= 32 chars, different).
sudo pg_ctlcluster 16 main start
psql "$DATABASE_URL" -f database/schema.sql
npm --prefix backend run dev    # http://127.0.0.1:4000
npm run dev                     # http://127.0.0.1:3000
npm run verify                  # frontend tsc + content tests + production build + backend syntax/tests
```

`OPENAI_API_KEY` is optional. Without it, assistant and mascot chat return 503 and the UI points to contact. `ENABLE_SOCKET_IO=false` is the current recommendation: there is no frontend socket client.

## Three areas

| Area | What exists | Status |
|------|-------------|--------|
| Public site | Corporate Quiet Authority routes under `frontend/app` | Working for navigation, copy, diagnostic, and contact form |
| Client panel | `/portal` (public door), `/auth/login`, `/auth/register`, `/dashboard` | Working when PostgreSQL and the API are up. Dashboard now shows contracted services, website URL, next step, and activity that the API already returned |
| Internal panel | Role `admin` / `super_admin` on `GET /api/security/stats` only. Chrome reserves `/noc`, but there is no page | **Missing** |

## Brand identity

| Element | State |
|---------|--------|
| Logo | Present and used. Official mark: `frontend/public/logo-argos-it.png`. Header: `logo-argos-it-header.png`. Footer: `logo-argos-it-footer.png`. Also `logo-argos-it-dark.png`, `favicon.svg`, `apple-touch-icon.svg`, `og-image.png` |
| Mascots | Chico and Dumbo sprites in `frontend/public/mascots/`. They are assistants, not the logo. History emblem: `argos-history-emblem.png` on `/sobre-argos-it`. Method mark: `chico-dumbo.png` |
| Colours | Public corporate chrome uses the canonical palette: navy `#1F3A5F`, teal `#2F7D6D`, ivory `#F7F7F5`, ink `#0B1320`, plus cream, mint, and mineral surfaces in `frontend/assets/css/argos-corporate.css`. Auth, dashboard, and legal pages still paint the older cyan `#18D4F7` / blue `#2563EB` / navy shell |
| Typography | Public pages: Cormorant Garamond (display) and Inter (body/UI) via `next/font`. Auth and dashboard stay on the system stack |
| Voice | Spanish professional, content freeze v1 on the hero: “Sistemas que no fallen cuando no deben.” Method is dual-layer: public phases Analizamos / Ordenamos / Protegemos / Acompañamos and operational ARGOS Analizar / Reforzar / Guiar / Optimizar / Supervisar |
| Proof | No prices on the Next site. No testimonials on the Next site. Phone is explicitly unpublished. Legal identity is a short placeholder (name, “Barcelona, España”, `info@argos-it.com`) |

`docs/design/tokens.md` still says brand tokens are not painted and fonts are deferred. The corporate stylesheet has since applied both on `.argos-corporate` only. Treat the CSS, not that older token note, as the public visual source.

## Public site — pages and blocks

Status key: **working** = rendered and the control does what it says. **placeholder** = honest gap, no invented data. **missing** = not in the Next app. **broken** = control that failed its own promise (fixed in this change where noted).

### `/` Home — working

| Block | Status |
|-------|--------|
| Header: logo, Chico/Dumbo banner, ES / EN / CAT, menu drawer | Working |
| Hero + “Iniciar diagnóstico ARGOS” + “Conocer cómo trabajamos” | Working. Diagnostic opens the 12-question survey |
| Client-reality cards (open a guided Dumbo reply) | Working. Reply is local copy, not a live model |
| Philosophy quote | Working |
| Principles | Working |
| Método ARGOS bar (A R G O S letters link to phase pages) + public phases | Working |
| Six service cards with expand + link to the service page | Working |
| Stability list | Working |
| Trust / how we work cards | Working. These are principles, not client testimonials |
| Final CTA to contact and portal | Working |
| Footer: nav, legal, seated mascots, logo | Working |
| Cookie banner | Working. Choice is stored in `localStorage` |
| Floating Chico / Dumbo chat | Working UI. Live answers need `OPENAI_API_KEY`; otherwise the panel links to contact |
| ARGOS assistant launcher | Same availability rule as mascot chat |

Not mounted (code exists, no route uses it): `HomeAutomationArgosSection`, `HomeWhyArgosSection`, `HomeBrandSlogan`, `HomePerimeterPanel`, `MethodArgosShowcase`. They are unused, not a second home.

### `/servicios` — working

Pillars Infraestructura, Sistemas, Seguridad, Continuidad. Six expandable service cards. Links to method, contact, and portal.

### `/servicios/[slug]` — working

Slugs: `consultoria-it`, `mantenimiento-informatico`, `seguridad-informatica`, `web-wordpress`, `automatizacion-ia`, `auditoria-digital`.

Each page has problem, audience, includes, benefits, process, and a consultation CTA to `/contacto?service=<slug>` (the contact form preselects that service). There is no separate form and no price on the page.

### `/metodo` — working

Method bar, dual-layer bridge, four public phases, five operational phase cards. Old hashes `#gestionar` and `#sostener` scroll to Guiar and Supervisar. CTAs go to services, contact, and the diagnostic.

### `/metodo/analizar|reforzar|guiar|optimizar|supervisar` — working

Meaning, problems, warning signs, ARGOS actions, expected results, diagnostic relation, related services, portal note, process, FAQ, previous/next phase, and CTAs (diagnostic, contact, register, or services depending on the phase). No per-phase Formspree form on the Next site (those forms exist only in `wordpress-export/`).

### `/sobre-argos-it` — working

Copy, history emblem, values, links to contact, method, and services.

### `/contacto` — working, with one owner gap

| Block | Status |
|-------|--------|
| Email `info@argos-it.com` | Working `mailto:` |
| Phone | **Placeholder.** Copy states the channel is confirmed after the request. No number is published. This pass only moved that sentence into i18n |
| Coverage | Working |
| Form | Working client validation. Submits to Formspree `https://formspree.io/f/xpqooedl` (override with `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT`). Privacy checkbox links to `/privacidad` |
| Backend `POST /api/contact` | Working code path, but the public form does not call it |

### `/portal` — working as a door, not as the app

Explains access and support. Buttons go to `/auth/login` and `/contacto`. Related links: services and method. It does not embed login.

### Legal — working copy, incomplete identity

| Route | Status |
|-------|--------|
| `/aviso-legal` | Working. Titular line is “ARGOS-IT. Domicilio: Barcelona, España. Contacto: info@argos-it.com.” **TODO:** legal name, NIF/CIF, full address, registry |
| `/privacidad` | Working outline. **TODO:** controller identity, processors, retention, international transfers |
| `/cookies` | Working. Banner accept/reject. **Fixed:** “cambiar tu decisión más adelante” now has a button that reopens the banner |
| `/legal/*` | Permanent redirects to the three routes above |

Legal pages use the older light header (cyan/blue), not the corporate header. That split is intentional in `chromeOwnership.ts`.

**Fixed dead link:** the legacy header pill “Planes” pointed at `/#planes`. The Next home has no such section. The pill was removed. Plan names still exist only in `wordpress-export/` and are not linked from the Next site.

### Labs (not product)

| Route | Status |
|-------|--------|
| `/explainer` | Working recording layout for Chico/Dumbo. `noindex`. Not in the menu |
| `/mascot-motion-lab` | Dev-only. Production returns 404 unless `ALLOW_MASCOT_MOTION_LAB=1` |

### Languages

Dictionaries: `es`, `en`, `ca`, `fr`, `de`, `it`, `pt`. Browser language is detected once and stored. The corporate header only offers ES / EN / CAT. FR / DE / IT / PT are reachable from the legacy header (legal pages, wide viewport) and from its language `<select>`. Content freeze marks non-Spanish hero copy as unresolved.

## Client panel

| Surface | Status |
|---------|--------|
| `/auth/register` | Working against `POST /api/auth/register`. Password rule: at least 10 characters with upper, lower, and a digit. **Fixed:** Spanish accents on the login button and success toast |
| `/auth/login` | Working. HttpOnly `argos_access` / `argos_refresh` plus readable `argos_session=1`. Proxy sends `/dashboard` to login when that flag is missing |
| `/dashboard` | Working when the API and database are up. Shows company, verification badge, operational score (`—` when there is no audit), audit checks, improvements, improvement form, direct message form, saved diagnostics with detail, and recent requests |
| Contracted services, website URL, company next step, activity | **Fixed.** The API already returned them; the page did not render them. Empty states stay empty. No sample clients, prices, or scores were added |
| Logout | Working. Revokes the refresh session, with a 5-second timeout, then clears local state |
| Locale on the dashboard | ES / EN / CA only, and it does not follow the public i18n cookie. Category and priority labels stay in Spanish even in EN/CA |

There is no client UI for attachments, notifications, or an admin reply thread. Messages are stored as `form_submissions` and listed back to the same user.

## Internal panel — missing

| Piece | Status |
|-------|--------|
| `/noc` and children | **Missing.** `getChromeOwner` treats them as a product app so marketing chrome stays off, and tests lock that, but no page exists |
| Admin UI | **Missing.** Roadmap phase 6 still says “panel admin real” |
| `GET /api/security/stats` | Working API for `admin` and `super_admin` only. Promote a user with `database/seed_admin.sql` (edit the email first) |
| Client verification | Column `client_verified` exists. Nothing in the UI lets staff flip it |
| `services.price` | Column exists in SQL. The public site does not read it. **Do not fill it with invented prices** |

## API map (backend)

| Route | Who | Status |
|-------|-----|--------|
| `GET /api/health` | Public | Working. 503 `DEGRADED` if Postgres is down |
| `POST /api/auth/register`, `/login`, `/refresh`, `/logout` | Public / session | Working |
| `GET /api/client/portal` | Authenticated | Working |
| `POST /api/client/improvements`, `/messages` | Authenticated | Working. Also tries Formspree when `CONTACT_FORM_ENDPOINT` is set |
| `POST /api/client/diagnostics` and `GET /api/client/diagnostics/:id` | Authenticated | Working |
| `POST /api/contact` | Public, rate limited | Working, unused by the contact page |
| `POST /api/ai/public/mascot-chat`, `/dumbo-chat` | Public, rate limited | 503 without an AI key |
| `POST /api/assistant/chat` | Public assistant | Same |
| `POST /api/ai/dumbo`, `/chico` | Any valid session | Same key requirement. Not restricted by role |
| `GET /api/security/stats` | Admin | Working |
| Socket.IO | Off when `ENABLE_SOCKET_IO=false` | No frontend client |

## Assets

Public images referenced by the Next app are present under `frontend/public/` (logos, OG image, mascot PNGs/JPGs, history emblem, favicon). No missing `src` was found for those components.

`frontend/public/infraestructura.png`, `continuidad.png`, `sistemas.png`, and `seguridad.png` are not referenced by the current React pages.

## `wordpress-export/` (not the app)

Static HTML for an older Hostinger/WordPress cut. It still has:

- Home section `#planes` and pages Essential / Professional / Elite **without prices**
- Placeholder reviews marked as editable
- Method pages `gestionar.html` and `sostener.html`, while the Next method uses Guiar and Supervisar
- Its own Chico/Dumbo scripts and Formspree forms

Do not treat it as live, and do not copy its reviews into the Next site.

## What this pass changed

1. Removed the legacy header pill that linked to `/#planes`.
2. Added “Cambiar preferencias de cookies” on `/cookies`, which reopens the banner.
3. Moved the unpublished-phone sentence into the locale files.
4. Rendered contracted services, registered website URL, company next step, and activity on `/dashboard`, with empty states.
5. Corrected “Iniciar sesión” / “Sesión iniciada” on the login screen.

No client names, prices, testimonials, phone numbers, or legal identifiers were invented.

## Prioritised plan

### P0 — owner decisions before more public copy

1. Legal identity for aviso legal and privacy: legal name, NIF/CIF, full address, registry, retention.
2. Publish a phone number, or keep the current “confirmed after the request” line.
3. Confirm Formspree `xpqooedl` is the live inbox, or replace it. Decide whether `/contacto` should keep posting from the browser or go through `POST /api/contact`.
4. Set `OPENAI_API_KEY` if Chico, Dumbo, and the ARGOS assistant should answer. Until then they correctly fall back to contact.

### P1 — make the three areas complete without fake data

1. Internal panel: a real `/noc` or `/admin` for verification, audits, services, and messages. Staff-only. Empty until a human enters a client row.
2. Client verification workflow (who may set `client_verified`).
3. Show dashboard categories in the active locale, or lock the dashboard to Spanish.
4. One chrome for auth, dashboard, and legal so they share navy `#1F3A5F` and the same type, instead of the older cyan shell.
5. Expose FR/DE/IT/PT on the corporate header, or stop advertising seven languages.

### P2 — commercial surfaces the owner must approve

1. Bring Essential / Professional / Elite into the Next site **without prices**, using only the existing wordpress-export descriptions, or leave plans out.
2. Replace nothing with testimonials until the owner supplies real ones. Do not reuse the wordpress placeholders.
3. Per-service or per-phase forms, if the single contact form is not enough.
4. Retire or archive `wordpress-export/` once the Next site is the only public site, so the two method names stop drifting.

### P3 — later

Socket.IO client, role limits on authenticated AI, attachments, transactional email, and a cookie policy that names the actual analytics vendor if one is added. The banner currently stores a preference and does not load a third-party analytics script.

## Decisions the owner must make

- Legal name, tax id, and address.
- Public phone, or none.
- Whether plans are public, and that they stay unpriced until a real price list exists.
- Real testimonials, or none.
- Who the internal users are, and whether `/noc` should exist.
- AI on or off in production.
- Which Formspree inbox receives contact, portal messages, and improvement requests.
- Whether the corporate header should offer all seven languages.
- Whether auth, dashboard, and legal should adopt the public navy/teal identity.
