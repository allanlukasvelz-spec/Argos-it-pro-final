# ARGOS Phase 3 — Monitoring, health, alerts, incidents

**Branch:** `feature/argos-multitenant-platform`
**Scope:** Backend domain only (APIs GET tenant-scoped). Sin UI Client/NOC, sin Phase 4/5.

---

## Qué se entregó

Pipeline:

```
Asset → Monitor (HTTP|TLS|DNS) → MonitorCheck → Observation
  → HealthEngine → Alert → Incident (+ incident_events)
```

| Pieza | Ubicación |
|-------|-----------|
| Migración forward | `database/migrations/003_monitoring_alerts_incidents.sql` |
| Rollback manual | `database/migrations/003_monitoring_alerts_incidents_down.sql` |
| Schema canónico | `database/schema.sql` + `backend/lib/ensureMonitors.js` |
| Motores | `backend/lib/monitoring/*` |
| APIs | `GET /api/client/monitoring`, `/health`, `/monitors`, `/alerts`, `/incidents` |
| Scheduler | in-process en `server.js` (`ENABLE_MONITOR_SCHEDULER`) |

---

## Ejecución local

1. PostgreSQL en marcha; `DATABASE_URL` en `backend/.env`.
2. Aplicar migraciones: `./database/migrate.sh` (solo `^[0-9]+_.*\.sql`, **excluye** `*_down.sql`).
3. Backend: `npm --prefix backend run dev` — `ensureMonitorsTables` al boot.
4. Scheduler: activo por defecto; `ENABLE_MONITOR_SCHEDULER=false` en tests/CI si no se desea.
5. Provisión: al crear/discover asset `DOMAIN`/`WEBSITE`/`HOSTNAME` con hostname → upsert monitors HTTP, TLS, DNS (config sin secretos).

---

## Health (4 estados overall)

`HEALTHY | WARNING | CRITICAL | UNKNOWN`

Precedencia (asset, monitors enabled):

1. Cobertura insuficiente / sin observation fresca → **UNKNOWN**
2. Evidencia fresca CRITICAL confirmada (N fallos o TLS EXPIRED) → **CRITICAL**
3. Evidencia fresca WARNING → **WARNING**
4. Evidencia fresca OK y sin CRITICAL abiertas → **HEALTHY**
5. Else → **UNKNOWN**

Freshness: `fresh_until = checked_at + max(2 * interval_seconds, floor)`.
Defaults: HTTP ~60s → ventana 2–5 min; TLS/DNS diario → 24–36h.
HEALTHY expirado → UNKNOWN. Runner/SSRF/timeout → observation `ok=false` + contribución **UNKNOWN** (nunca HEALTHY).

`OBSERVE` / `HIGH` del blueprint = clasificación interna de observation, **no** `overall`.

---

## Alertas e incidentes

- Fingerprint alerta: `org + monitor_id + error_class` (dedupe; no storm).
- SSRF / runner errors: **no** abren alerta CRITICAL de target.
- Incident: alerta CRITICAL OPEN → correlaciona `org + asset_id + class` mientras no RESOLVED.
- Varias alertas mismo asset/clase → un incident abierto.

---

## Seguridad del runner

- Solo hostnames públicos; puertos **80/443**.
- Revalidación DNS post-resolve; redirects a privado/metadata bloqueados.
- Evidencia JSONB ~8KB; sin headers de auth / claves.
- TCP arbitrario = FUTURE (SSRF). Sin vault → cero monitors con credenciales.
- Lookups siempre `id AND organization_id`. Cross-tenant → 404.

---

## APIs (solo lectura)

Todas bajo `/api/client` con auth + `tenantContext`.
`organization_id` en body/query **ignorado** (solo membership + header validado).

| Método | Ruta |
|--------|------|
| GET | `/api/client/monitoring` |
| GET | `/api/client/health?asset_id=` |
| GET | `/api/client/monitors` · `/monitors/:id` |
| GET | `/api/client/alerts` · `/alerts/:id` |
| GET | `/api/client/incidents` · `/incidents/:id` |

Sin POST create monitor. Sin `/api/noc/*`.

---

## Tests

```bash
npm run verify:backend
npm run test:isolation
```

Cubren: health/freshness/UNKNOWN≠HEALTHY, dedupe alert/incident, IDOR 404, org spoof, SSRF, regresiones Phase 0–2.

---

## Rollback

1. Código: `git revert <commit-phase-3>` (o checkout previo).
2. Scheduler: `ENABLE_MONITOR_SCHEDULER=false`.
3. DDL **solo** tablas Phase 3 (manual):

```bash
psql "$DATABASE_URL" -f database/migrations/003_monitoring_alerts_incidents_down.sql
```

**No** aplica `_down` vía `migrate.sh`. **No** DROP de assets/TLS/orgs.

---

## Fuera de alcance (STOP)

- Phase 4 UI Client / Relume masters
- Phase 5 NOC / `/api/noc/*`
- Remediation A/B/C runtime, agents, notificaciones
- Push / PR / merge / deploy
