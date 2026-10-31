# Runbook — Phase 5 Internal NOC

## Scope

Consola interna `/noc` + APIs `/api/noc/*` cross-tenant de **solo lectura**, gated a `admin` | `super_admin`.

## Access

1. Cookie de sesión `argos_session=1` (proxy Next).
2. JWT válido (`authMiddleware`).
3. `requireNocAccess` → 403 `{ code: "NOC_FORBIDDEN" }` si no es admin global.
4. `GET /api/noc/me` → UI gate; denegación muestra página propia (no dashboard cliente).

`org_admin` y roles de cliente **nunca** ven NOC.

## APIs (read-only)

| Path | Uso |
|------|-----|
| `/api/noc/me` | Probe de rol |
| `/api/noc/summary` | KPIs + cola |
| `/api/noc/organizations` · `/:id` | Orgs + rollup salud |
| `/api/noc/assets` | Cross-tenant + `organizationName` |
| `/api/noc/monitoring` | Monitors |
| `/api/noc/health` | Distribución muestreada |
| `/api/noc/alerts` · `/:id` | Alertas + evidence sanitizada |
| `/api/noc/incidents` · `/:id` | Incidentes + events |
| `/api/noc/tls` | Certificados sin private key |
| `/api/noc/audit` | activity ∪ security (details redactados) |
| `/api/noc/support` | form_submissions |
| `/api/noc/platform-health` | DB connectivity (no health de clientes) |

Filtros: `organization_id`, `state`, `severity`, `type`, `limit`, `offset`. Sin SQL crudo del usuario.

## UI

- Shell: sidebar 224px `#0B1320`, top 48px, chip platform health.
- CSS solo en layout NOC (no reutiliza `ClientPortalShell`).
- Panel A/B/C: conceptual / disabled (L0–L4 badges).
- Placeholders Phase 6–9: Predicted Risks, Preventive, Backups, Agents, Runbooks, Remediations, Reports.

## Smoke checks

```bash
npm run verify:backend
npm run verify:frontend
# Con backend + admin JWT:
curl -s -b '…' "$BACKEND/api/noc/me"
curl -s -b '…' "$BACKEND/api/noc/summary"
```

Como cliente/org_admin: `/api/noc/me` → 403. `/api/client/*` sigue tenant-scoped.

## Rollback

`git revert` del commit Phase 5. Sin DDL. `/api/client` intacto.

## Out of scope

Remediación, force-check, agents, predicciones, informes, push/PR/deploy, Phase 6.
