# ARGOS — Incident model

```
PHASE = 3 (design only)
ALERT ≠ INCIDENT
```

---

## 1. Alert

Señal de atención sobre un asset/monitor.

| Field | Notes |
|-------|--------|
| fingerprint | org + monitor + error_class (+ asset) para dedup |
| severity | OBSERVE / WARNING / HIGH / CRITICAL |
| state | OPEN / ACKNOWLEDGED / CLOSED |
| evidence | snapshot JSON (no secretos) |

**Open:** health/risk cruza umbral con confirmación (N fails).  
**Close:** N successes o cierre manual NOC con nota.  
No borrar: cerrar.

Storm: mismo fingerprint no crea 500 alerts; incrementa `count` / `last_seen`.

---

## 2. Incident

Caso operativo. Agrupa 1..N alerts + acciones + verificación.

States:

```
OPEN → INVESTIGATING → MITIGATING → MITIGATED → RESOLVED → CLOSED
                 ↘ ESCALATED
```

`MITIGATED` ≠ `RESOLVED`: impacto contenido, causa no cerrada.

---

## 3. Incident events (append-only)

`ALERT_LINKED` · `NOTE` · `HYPOTHESIS` · `ACTION_A|B|C` · `VERIFY` · `STATE_CHANGE` · `SAFE_STOP` · `ROLLBACK` · `CUSTOMER_VISIBLE_NOTE`

El cliente ve un **subset** traducido (no hipótesis internas crudas por defecto; sí estado, impacto, next step).

---

## 4. Alert → Incident policy (MVP)

| Rule | Action |
|------|--------|
| CRITICAL confirmado | auto-open incident |
| HIGH sostenido > umbral | auto-open o suggest |
| WARNING | alert only |
| Multiple alerts same asset/time | one incident, many links |
| Predicted (P9) | **predicted incident** record, not fake outage |

---

## 5. Visibility

| Actor | Sees |
|-------|------|
| Client org_member | own org incidents: state, customer language, ETA if set |
| org_viewer | read |
| NOC | all orgs **one at a time**, full evidence, A/B/C |
| Public | nothing |

---

## 6. CURRENT

`security_logs` + WS `chico_alert` = acciones de usuario / security log, **no** incidentes de activos. No reutilizar como producto de uptime.

---

## 7. APIs TARGET

Client: `GET /api/client/alerts`, `GET /api/client/incidents`, `GET /api/client/incidents/:id`  
NOC: list global filtered by org, ack, comment, state transition, link runbook.

IDOR: 404 cross-tenant (copy diagnostics pattern).
