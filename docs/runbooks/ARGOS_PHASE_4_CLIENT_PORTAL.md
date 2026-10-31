# ARGOS Phase 4 — Client Portal runbook

## Scope

Customer private experience on `/dashboard/*` using Phase 0–3 APIs and Design Contract shell.

## Routes

| Path | Data |
|------|------|
| `/dashboard` | `GET /api/client/monitoring` + `portal` |
| `/dashboard/activos…` | `GET /api/client/assets`, `/tls`, discover |
| `/dashboard/monitorizacion` | monitors + monitoring |
| `/dashboard/seguridad` | TLS + alerts + monitoring (no vuln scan) |
| `/dashboard/alertas` | alerts |
| `/dashboard/incidentes` | incidents + events |
| `/dashboard/prevencion` | NOT_AVAILABLE_YET |
| `/dashboard/auditorias` | portal audit + diagnostics |
| `/dashboard/informes` | NOT_AVAILABLE_YET |
| `/dashboard/soporte` | improvements/messages forms |
| `/dashboard/cuenta` | portal user/org |

## Local verify

```bash
node --experimental-strip-types --test frontend/lib/clientHealthSemantics.test.ts
npm --prefix frontend run lint
npm --prefix frontend run build
npm run verify:backend
npx playwright test e2e/client-portal.spec.ts e2e/auth-flow.spec.ts e2e/smoke.spec.ts
```

Phase 4 closure: semantics + lint + build + backend verify must PASS before commit.

## Red team checklist

1. Org A never sees Org B data (backend isolation remains authoritative).
2. Stale / no monitors never paints FULLY PROTECTED.
3. Zero alerts / zero incidents never force HEALTHY.
4. Runner failure maps to UNKNOWN, not target HEALTHY.
5. Mobile drawer does not expose NOC.
6. Loading/error do not leave stale green claims.
7. Public marketing pages do not load `client-portal.css`.
8. No DEMO 96 / 99.99 / ORG-DEMO in UI.

## Rollback

```bash
git revert <phase-4-commit>
```

No DB migrations in Phase 4.

## Out of scope

`/noc`, Phase 5 APIs, remediation A/B/C, prediction, push/PR/deploy.
