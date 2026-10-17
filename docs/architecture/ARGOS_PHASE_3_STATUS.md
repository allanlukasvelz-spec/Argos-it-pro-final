# ARGOS Phase 3 — Status (CURRENT)

**Date:** 2026-08-25
**Branch:** `feature/argos-multitenant-platform`
**Checkpoint tag (pre-multitenant):** `argos-pre-multitenant-2026-08-24`
**Prior:** Phases 0–2 + Design Contract freeze (`eb3d4e0`)

> El audit `docs/architecture/ARGOS_MULTITENANT_AUDIT_2026_08_24.md` queda **STALE** respecto a Phase 3. No reescribirlo como fresco; este documento es el status CURRENT de monitoring.

---

## CURRENT (tras Phase 3)

| Área | Estado |
|------|--------|
| Migraciones | `migrate.sh` solo forward `^[0-9]+_.*\.sql` (excluye `*_down.sql`) |
| Tablas | `monitors`, `monitor_checks`, `observations`, `alerts`, `incidents`, `incident_events` |
| ensure | `ensureMonitors.js` al boot (tras assets) |
| Runners | HTTP / TLS / DNS con SSRF guards (80/443) |
| Scheduler | in-process; `ENABLE_MONITOR_SCHEDULER` (off en tests si se setea false) |
| Health | 4 estados: HEALTHY \| WARNING \| CRITICAL \| UNKNOWN (derivado en lectura) |
| Alertas / incidentes | Dedupe por fingerprint / correlation_key |
| APIs Client | GET monitoring, health, monitors, alerts, incidents (tenant-scoped) |
| Provisión | Upsert monitors al create/discover DOMAIN/WEBSITE/HOSTNAME |
| UI Client / NOC | **NO** implementada (Phase 4/5) |
| TCP / ICMP / AGENT / vault secrets | **FUTURE** |

---

## Health contract (implementado)

- Sin evidencia fresca → UNKNOWN (nunca HEALTHY).
- Runner crash / timeout / SSRF_BLOCKED → UNKNOWN contribution.
- Check SUCCEEDED + HTTP 5xx confirmado → WARNING/CRITICAL según reglas.
- `NO_INCIDENTS` ≠ HEALTHY.

---

## Verificación

- `npm run verify:backend`
- `npm run test:isolation`
- Runbook: `docs/runbooks/ARGOS_PHASE_3_MONITORING.md`

---

## Next (no autorizado aquí)

1. Phase 4 — Client private experience (UI honesta sobre estas APIs)
2. Phase 5 — Internal NOC
3. No push/PR/deploy desde este status
