# FASE 21.4 — Corporate foundation notes

**Pilot:** `/contacto`  
**Direction:** LIGHT_PREMIUM_INSTITUTIONAL  
**Fonts:** `next/font/google` → Inter (`--font-inter`) + Cormorant Garamond (`--font-cormorant`), self-hosted at build.

## Isolation

- Global `--font-body` / `--font-ui` / `--font-display` remain **system sans**.
- `.argos-corporate` remaps fonts + semantic colors to brand tokens.
- Portal (`/dashboard`), Auth, Home, Método, Servicios keep legacy shells/skins.

## Key files

| File | Role |
|------|------|
| `frontend/lib/fonts.ts` | next/font setup |
| `frontend/assets/css/argos-corporate.css` | Corporate scope foundation |
| `frontend/components/layout/CorporatePageShell.tsx` | Light shell (no galaxy) |
| `frontend/components/pages/ContactView.tsx` | Pilot route |

## Authorized visual change

Only `contacto-*.png` baselines may change in 21.4.
