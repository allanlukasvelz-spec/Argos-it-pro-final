# ARGOS — Monitoring model

```
STATUS = TARGET DESIGN
IMPLEMENTATION = PHASE_3 (NOT AUTHORIZED)
HEAD = ec27eb9
NO TABLES CREATED IN THIS PHASE
```

---

## 1. Pipeline

```
ASSET
  → MONITOR (config)
  → SCHEDULER
  → CHECK (probe)
  → OBSERVATION (immutable fact)
  → HEALTH ENGINE (derivation)
  → RISK ENGINE (DETECTED | INFERRED | PREDICTED)
  → ALERT (attention signal)
  → INCIDENT (operational case)
  → ACTION PLAN (A/B/C)
  → VERIFY
  → RESOLVE | SAFE STOP
```

Reglas:

- El check **no** escribe “HEALTHY” directamente.
- La observation es un hecho (`ok`, latencia, error_class, evidencia).
- Health es **derivada** y puede ser `UNKNOWN`.
- Sin observation reciente + cobertura mínima → **no** PROTECTED.

---

## 2. Monitor types (V1)

| Type | Asset types | Check | Phase |
|------|-------------|-------|-------|
| HTTP | WEBSITE, API | GET/HEAD, status, TTFB, TLS optional | 3 |
| TLS | DOMAIN, WEBSITE, TLS_CERTIFICATE | cert observe (reuse `tlsStatus.js`) | 3 (observe already exists on discover) |
| DNS | DOMAIN | resolve A/AAAA/MX; detect unexpected change | 3 |
| TCP | SERVER, DATABASE, API | connect timeout | 3 |
| ICMP | SERVER | optional; may be blocked | FUTURE |
| AGENT | SERVER | heartbeat + local metrics | 7 |
| BACKUP | SERVICE/SERVER | last success timestamp (agent or API) | 7–8 |
| CUSTOM | — | JSON probe spec | FUTURE |

CURRENT: TLS observation **on-demand** en `POST /api/client/domains/discover`. No scheduler. No HTTP monitor.

---

## 3. Scheduler (PHASE_3)

- Un worker en backend (intervalo global + per-monitor `interval_seconds`).
- Jitter para evitar thundering herd.
- Concurrency cap por proceso y por org.
- Timeout duro por check (SSRF/hang).
- Reutilizar `hostnameSecurity.js` en **todo** target HTTP/TCP.
- Si el scheduler muere: Platform Health = DEGRADED; clientes no pasan a HEALTHY por ausencia de datos.

**Action A** si scheduler down: restart worker. **B:** run on second instance. **C:** page human; freeze auto-remediation.

---

## 4. Observation

Campos lógicos: `organization_id, monitor_id, asset_id, checked_at, ok, error_class, latency_ms, evidence JSONB, source`.

`error_class` ejemplos: `TIMEOUT`, `CONN_REFUSED`, `DNS_NXDOMAIN`, `TLS_EXPIRED`, `HTTP_5XX`, `SSRF_BLOCKED`.

Append-only. Retención: decidir en P8 (p.ej. raw 14d + rollup).

---

## 5. Health engine

Inputs: últimas N observations, age, monitor coverage vs protection profile, asset status.

| overall | Condición |
|---------|-----------|
| UNKNOWN | 0 monitors enabled **o** 0 observations in window **o** scheduler stale |
| HEALTHY | coverage mínima OK **y** recent observations ok **y** no open critical alerts |
| OBSERVE | anomalía no confirmada / 1 fallo aislado |
| WARNING | degradación (p.ej. TLS EXPIRING, latency trend) |
| HIGH | impacto alto sin incidente aún |
| CRITICAL | fallo confirmado o riesgo inminente (TLS EXPIRED, HTTP down repeated) |

**Coverage mínima (MVP — no declarar PROTECTED sin esto):**

1. Al menos un asset `DOMAIN` o `WEBSITE` activo.
2. Monitor HTTP **o** TLS activo sobre el hostname primario.
3. ≥1 observation en la ventana (p.ej. 15 min para HTTP 60s interval; 24h para TLS diario).
4. Ownership/validation at least `UNVERIFIED` documented — PROTECTED requiere verificación (PHASE_4 policy).

Hasta entonces el portal muestra **UNKNOWN** / «en incorporación», no verde.

---

## 6. Risk engine

| Class | Meaning | Example | Call it AI? |
|-------|---------|---------|-------------|
| DETECTED | hecho actual | cert `not_after` < 14d | NO |
| INFERRED | regla sobre hechos | HTTP down + TLS ok → app/origin más probable que cert | NO |
| PREDICTED | tendencia / modelo | disk growth ETA | only if methodology exists (P9) |

Confidence: `HIGH | MEDIUM | LOW | UNKNOWN`. **Prohibido** % inventado.

---

## 7. False states (tests)

| Failure | Prevention |
|---------|------------|
| False HEALTHY | health engine refuses HEALTHY on empty/stale |
| False positive | confirm window (N consecutive fails) before CRITICAL |
| False negative | catch-all UNKNOWN if runner stale |
| Alert storm | fingerprint + backoff + incident grouping |

---

## 8. APIs TARGET (not implemented)

Client (tenant): `GET /api/client/monitors`, `GET /api/client/health`, `GET /api/client/observations?asset_id=`  
NOC (staff): `GET /api/noc/monitors`, force-check Level 1, scheduler status.

---

## 9. CURRENT vs TARGET

| Capability | CURRENT |
|------------|---------|
| Asset registry | DONE |
| TLS snapshot on discover | DONE |
| Periodic HTTP/DNS/TCP | NOT_IMPLEMENTED |
| Health engine | NOT_IMPLEMENTED |
| Client “audit score” on dashboard | website_audits / diagnostics — **not** monitor health; do not relabel |
