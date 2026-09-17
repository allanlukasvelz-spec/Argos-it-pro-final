# Runbook — Phase 6 Runbook Engine + Safe Remediation

## Scope

Motor de runbooks versionados + remediación tipada (A/B/C) con dry-run, precondiciones, niveles L0–L4, aprobación, verificación, rollback y SAFE_STOP.

## Safety default

**DEFAULT = NO MUTATION.** Toda acción empieza en dry-run. No hay `exec(command)`, shell, SSH ni SQL arbitrario.

## Schema

- Forward: `database/migrations/004_runbooks_remediation.sql`
- Rollback manual: `004_runbooks_remediation_down.sql`
- Boot: `ensureRemediationTables` (seed templates genéricos)

## APIs (NOC only)

| Method | Path |
|--------|------|
| GET | `/api/noc/runbooks` · `/:id` |
| GET | `/api/noc/actions` |
| GET | `/api/noc/remediations` · `/:id` · `/:id/events` |
| GET | `/api/noc/incidents/:id/remediation` |
| POST | `/api/noc/remediations/plan` |
| POST | `/api/noc/remediations/dry-run` |
| POST | `/api/noc/remediations/:id/request-approval` |
| POST | `/api/noc/remediations/:id/approve` |
| POST | `/api/noc/remediations/:id/execute` |
| POST | `/api/noc/remediations/:id/rollback` |
| POST | `/api/noc/remediations/:id/safe-stop` |

Todas: `authMiddleware` + `requireNocAccess`. CSRF Origin en mutaciones con cookie.

## Operator flow

1. Elegir runbook → **Planificar** (letter A/B/C + action allowlisted)
2. **Dry run** → precondiciones + plan (sin mutación)
3. Si L3 → **Request approval** → otro operador **Approve**
4. **Execute** → verify obligatorio
5. Fail → failure evidence → plan B/C o **Safe stop**
6. L2 → **Rollback** tipado si aplica

## Forbidden

DNS writes, cert renew, service restart, remote shell, DROP DB, client-triggered remediation.

## Tests

`backend/lib/remediation/*.test.js` · `nocRemediation.auth.test.js`
