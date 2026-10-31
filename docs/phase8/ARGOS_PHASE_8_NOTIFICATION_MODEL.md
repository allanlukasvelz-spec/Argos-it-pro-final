# ARGOS Phase 8 — Notification Model

```
STATUS = PLANNING ONLY
IMPLEMENTATION_AUTHORIZED = NO
```

---

## 1. Pipeline

```
EVENT → NOTIFICATION POLICY → RECIPIENT RESOLUTION → DEDUPE
  → platform_jobs → notification_deliveries → CHANNEL → ACK/FAIL → AUDIT
```

---

## 2. Event types (evaluated)

| Event | MVP | V1 | Notes |
|-------|-----|-----|-------|
| REPORT_READY | **YES** | | Primary MVP driver |
| INCIDENT_OPENED | **YES** | | High value |
| INCIDENT_CRITICAL | **YES** | | Severity gating |
| INCIDENT_RESOLVED | | YES | Lower urgency |
| ALERT_CREATED | | YES | Anti-noise rules required |
| ALERT_ESCALATED | | YES | |
| TLS_EXPIRY_WARNING | | V1.5 | Needs scheduled job |
| AGENT_OFFLINE | | V1.5 | agent.last_seen threshold |
| REMEDIATION_APPROVAL_REQUIRED | | YES | ties Phase 6 |
| REMEDIATION_VERIFIED | | YES | |
| SECURITY_UNKNOWN | | YES | CHICO-adjacent copy |
| EVIDENCE_STALE | | V1.5 | reconciliation signal |

**Anti-noise MVP:** Max 1 IN_APP per (user, event_type, scope_id) per 15 minutes unless severity CRITICAL.

---

## 3. Channels

| Channel | MVP | Later | Defer |
|---------|-----|-------|-------|
| **IN_APP** | **YES** | | |
| EMAIL | | V1 (8I) | |
| WEBHOOK | | V1.5 | SSRF controls required |
| Slack / Teams | | | FUTURE |
| SMS / WhatsApp | | | REJECT unless explicit business case |

Do not add SMS/WhatsApp because infrastructure exists elsewhere.

---

## 4. Recipient model

### Resolution order

1. Event carries `organization_id` (required)
2. Load eligible members from `organization_members`
3. Filter by role threshold (e.g. org_admin + org_member for INCIDENT; org_admin only for REPORT_READY config)
4. Apply `notification_preferences` per user
5. Verify channel destination exists (IN_APP: user_id; EMAIL: verified email from `users.email`)
6. **Never** trust email/phone from event payload

### NOC recipients

Separate pool: users with NOC role (`admin`, `super_admin`) — not mixed with client member resolution for cross-tenant ops alerts (future NOC-only events).

---

## 5. Notification preferences (tenant-scoped)

| Dimension | MVP | Future |
|-----------|-----|--------|
| event_type enabled | YES | |
| channel enabled | IN_APP only | email |
| severity threshold | YES | |
| quiet hours | | V1 |
| digest vs immediate | | V1 |
| per-role defaults | | V1 |

MVP default: all org_members receive IN_APP for INCIDENT_* and REPORT_READY; opt-out via preference.

---

## 6. In-app notification model

```
notifications:
  id, organization_id, user_id,
  event_type, severity,
  title, body (sanitized),
  link_target (portal path),
  read_at NULL | timestamp,
  source_event_id (incident/report/run),
  created_at
```

CHICO may **read** notifications to explain; CHICO does **not** insert deliveries.

---

## 7. Delivery states

```
QUEUED → CLAIMED → SENDING → DELIVERED
                    ↓
                  FAILED → RETRY_WAIT → (retry) → DEAD_LETTER
                    ↓
                 CANCELLED
```

**SENT ≠ DELIVERED** unless provider confirms (EMAIL future: track provider message id).

---

## 8. Idempotency / deduplication

Dedupe key: `{event_type}:{organization_id}:{scope_id}:{channel}:{recipient_id}`

| Window | Default |
|--------|---------|
| INCIDENT_OPENED | 15 min |
| REPORT_READY | 24h per report_run_id |
| ALERT_CREATED | 1h per alert_id |

Store last_delivered_at on notification_deliveries or dedupe table.

---

## 9. Retry model

| Parameter | Default |
|-----------|---------|
| max_attempts | 5 |
| backoff | exponential + jitter |
| retry_wait cap | 1h |
| dead_letter | after max_attempts |

Report READY + notification FAILED = report stays READY; delivery retries independently.

---

## 10. Audit

| Action | Log target |
|--------|------------|
| notification created | activity_logs |
| delivery DELIVERED | activity_logs |
| delivery FAILED | activity_logs + security_logs if abuse |
| preference changed | activity_logs |
| NOC cross-tenant notify view | security_logs |

---

## 11. Dead letter

`dead_letter_records`: delivery_id, payload redacted, error, attempts, reviewed_at NULL.

Human review required before replay. No auto-replay of webhook payloads.

---

## 12. Formspree / Socket.IO (CURRENT partial)

| Mechanism | Phase 8 role |
|-----------|--------------|
| Formspree | Remains support-only; not notification engine |
| Socket.IO chico_alert | Do not revive as MVP; IN_APP inbox replaces pattern |

Contradiction noted: server.js emits socket events with no consumer — **do not depend on for Phase 8**.
