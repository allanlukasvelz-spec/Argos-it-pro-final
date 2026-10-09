# ARGOS Phase 8 — API Contract (design only)

```
STATUS = PLANNING ONLY — NO ROUTES IMPLEMENTED
IMPLEMENTATION_AUTHORIZED = NO
AUTH = existing JWT + tenant middleware + requireNocAccess
```

---

## 1. Client — Reports

### `GET /api/client/reports`

List reports for authenticated user's organization.

Query: `?status=READY&type=INCIDENT_SUMMARY&limit=50&offset=0`

Response 200:
```json
{
  "reports": [
    {
      "id": "uuid",
      "reportType": "INCIDENT_SUMMARY",
      "title": "Incident #123 Summary",
      "status": "READY",
      "periodStart": "2026-08-01T00:00:00Z",
      "periodEnd": "2026-08-07T23:59:59Z",
      "generatedAt": "2026-08-26T10:00:00Z",
      "dataFreshness": "2026-08-26T09:55:00Z",
      "latestRunId": "uuid",
      "templateVersion": "1.0.0"
    }
  ],
  "pagination": { "limit": 50, "offset": 0 }
}
```

Errors: 401 unauthenticated, 403 wrong org

---

### `GET /api/client/reports/:id`

Report detail + latest run summary. No cross-tenant.

Response includes `runs[]` with status; FAILED runs show `errorCode` (sanitized `errorMessage`).

---

### `GET /api/client/reports/:id/content`

Stream artifact of latest READY run.

- Content-Type from evidence mime (application/pdf or text/html)
- Content-Disposition: attachment or inline
- Bytes via EvidenceService.getContent (authenticated backend streaming)
- **No presigned URLs in MVP**

Errors: 404 not found, 403 forbidden, 503 STORAGE_MISSING / CHECKSUM_MISMATCH

---

### `POST /api/client/reports` (MVP optional)

Request on-demand generation.

Body:
```json
{
  "reportType": "INCIDENT_SUMMARY",
  "incidentId": "uuid",
  "idempotencyKey": "client-supplied-optional"
}
```

Response 202: `{ "reportId", "runId", "status": "QUEUED" }`

Policy: org_member+ allowed for own org incidents only.

---

## 2. Client — Notifications

### `GET /api/client/notifications`

Query: `?unread=1&limit=50`

Response: list with `id`, `eventType`, `severity`, `title`, `body`, `linkTarget`, `readAt`, `createdAt`

---

### `PATCH /api/client/notifications/:id/read`

Mark read. 404 if not user's notification or wrong org.

---

### `GET /api/client/notification-preferences`

List preferences for current user + org.

### `PATCH /api/client/notification-preferences`

Update enabled/threshold for event types. Validate event_type enum server-side.

---

## 3. NOC — Reports

### `GET /api/noc/reports`

Cross-tenant list. Query: `?organizationId=&status=&type=`

Requires `requireNocAccess`. Audit cross-tenant read.

---

### `GET /api/noc/reports/:id`

Full detail including operator `errorMessage`, `evidenceObjectId`, delivery links.

---

### `POST /api/noc/reports`

Generate on behalf of org.

Body: `{ organizationId, reportType, incidentId, ... }`

Audit: security_logs cross-tenant action.

---

### `POST /api/noc/reports/:id/retry`

Retry FAILED or stale GENERATING run. Idempotent retry key.

---

## 4. NOC — Notifications / Deliveries

### `GET /api/noc/notifications`

Cross-tenant notification events (operator view).

### `GET /api/noc/deliveries`

Query deliveries by status FAILED / DEAD_LETTER.

### `POST /api/noc/deliveries/:id/retry`

Replay delivery (human-reviewed for dead letters).

---

## 5. Common error codes

| Code | HTTP | Meaning |
|------|------|---------|
| REPORT_NOT_FOUND | 404 | |
| REPORT_FORBIDDEN | 403 | tenant |
| REPORT_GENERATION_FAILED | 503 | failed run |
| REPORT_NOT_READY | 409 | content requested before READY |
| NOTIFICATION_NOT_FOUND | 404 | |
| DELIVERY_DEAD_LETTER | 409 | requires review |
| IDEMPOTENCY_REPLAY | 200 | existing resource |

---

## 6. Not in MVP API

- Public unsigned report URLs
- Webhook subscription management (V1.5)
- Batch export CSV
- Client-accessible evidence_object keys

---

## 7. Middleware stack (reuse)

Client routes: `auth` → `resolveTenantContext` → `requireTenant`

NOC routes: `auth` → `requireNocAccess`

Report content: EvidenceService access context with `organizationId`, audit on read.
