# ARGOS Phase 8 — Data Model (proposed)

```
STATUS = PLANNING ONLY — NO MIGRATIONS AUTHORIZED
IMPLEMENTATION_AUTHORIZED = NO
```

---

## 1. Design rules

- All operational tables include `organization_id` where tenant-scoped
- FK to `organizations(id) ON DELETE CASCADE` for operational data
- Append-only where audit requires (deliveries, runs)
- Reuse `evidence_objects` — no parallel blob table
- Blueprint Phase 8 tables are **starting points**, not verbatim spec

---

## 2. Table inventory

| Table | MVP | Optional | Future |
|-------|-----|----------|--------|
| `reports` | YES | | |
| `report_runs` | YES | | |
| `report_templates` | | YES (hardcode OK for MVP) | |
| `report_evidence_links` | | YES (can use JSONB on run) | |
| `notification_events` | YES | | |
| `notifications` (in-app) | YES | | |
| `notification_deliveries` | YES | | |
| `notification_preferences` | YES | | |
| `notification_channels` | | | YES (multi-channel registry) |
| `platform_jobs` | YES | | |
| `dead_letter_records` | YES | | |
| `report_recipients` | | | YES (scheduled reports) |

---

## 3. `reports`

Logical report definition (on-demand or future scheduled).

```sql
-- PROPOSED — NOT MIGRATED
reports (
  id UUID PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  report_type TEXT NOT NULL,           -- INCIDENT_SUMMARY, ...
  title TEXT,
  schedule_cron TEXT NULL,             -- FUTURE scheduled
  config JSONB NOT NULL DEFAULT '{}',  -- scope: incident_id, period, etc.
  created_by INT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | ARCHIVED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

---

## 4. `report_runs`

Each generation attempt.

```sql
report_runs (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES reports(id),
  organization_id INT NOT NULL REFERENCES organizations(id),
  status TEXT NOT NULL,  -- REQUESTED|QUEUED|GENERATING|STORING|READY|FAILED|EXPIRED
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  template_version TEXT NOT NULL,
  evidence_object_id UUID REFERENCES evidence_objects(id),
  data_freshness TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,     -- operator-facing; sanitized for client
  idempotency_key TEXT NOT NULL,
  requested_by INT REFERENCES users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, idempotency_key)
)
```

Index: `(organization_id, status, created_at DESC)`

---

## 5. `platform_jobs`

PostgreSQL queue (ADR-004).

```sql
platform_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,     -- REPORT_GENERATE | NOTIFICATION_DELIVER
  organization_id INT REFERENCES organizations(id),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',  -- QUEUED|CLAIMED|DONE|FAILED
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Index: `(status, run_after) WHERE status = 'QUEUED'`

---

## 6. `notification_events`

Immutable domain event record (optional dedupe source).

```sql
notification_events (
  id UUID PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  scope_type TEXT,           -- incident | report_run | alert
  scope_id TEXT,
  payload JSONB NOT NULL,    -- sanitized snapshot
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dedupe_key)
)
```

---

## 7. `notifications` (in-app)

```sql
notifications (
  id UUID PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  user_id INT NOT NULL REFERENCES users(id),
  event_id UUID REFERENCES notification_events(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_target TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Index: `(user_id, read_at NULLS FIRST, created_at DESC)`

---

## 8. `notification_deliveries`

Per-recipient channel attempt.

```sql
notification_deliveries (
  id UUID PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  notification_id UUID REFERENCES notifications(id),
  event_id UUID REFERENCES notification_events(id),
  channel TEXT NOT NULL,       -- IN_APP | EMAIL | WEBHOOK
  recipient_user_id INT REFERENCES users(id),
  destination TEXT,            -- null for IN_APP
  status TEXT NOT NULL,        -- QUEUED|SENDING|DELIVERED|FAILED|RETRY_WAIT|CANCELLED|DEAD_LETTER
  attempts INT NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

---

## 9. `notification_preferences`

```sql
notification_preferences (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id),
  user_id INT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'IN_APP',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  severity_threshold TEXT DEFAULT 'INFO',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, event_type, channel)
)
```

---

## 10. `dead_letter_records`

```sql
dead_letter_records (
  id UUID PRIMARY KEY,
  delivery_id UUID REFERENCES notification_deliveries(id),
  job_id BIGINT REFERENCES platform_jobs(id),
  organization_id INT,
  record_type TEXT NOT NULL,
  payload_redacted JSONB,
  error TEXT NOT NULL,
  attempts INT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

---

## 11. Evidence linkage

Prefer `report_runs.evidence_object_id` FK.

Optional `report_evidence_links` for section-level refs (V1):

```sql
report_evidence_links (
  report_run_id UUID REFERENCES report_runs(id),
  evidence_object_id UUID REFERENCES evidence_objects(id),
  section_key TEXT,
  PRIMARY KEY (report_run_id, evidence_object_id, section_key)
)
```

---

## 12. Migration plan (design only)

| Migration | Content | When |
|-----------|---------|------|
| 007_reports.sql | reports, report_runs | 8B |
| 008_notifications.sql | notification_* tables | 8B |
| 009_platform_jobs.sql | platform_jobs, dead_letter | 8B |

**NOT AUTHORIZED in this gate.**

---

## 13. Avoid over-modeling

MVP can hardcode `INCIDENT_SUMMARY` template in code — `report_templates` table deferrable.

Do not create `report_recipients` until scheduled reports (V1.5).
