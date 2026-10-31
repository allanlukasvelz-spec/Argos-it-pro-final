# ARGOS Phase 7 — Data Model (PROPOSED ONLY)

```
STATUS = PLANNING_ONLY
MIGRATIONS_AUTHORIZED = NO
```

Reuse existing: `organizations`, `assets`, `observations` (`source` already includes `AGENT`), `activity_logs` / `security_logs`, Phase 6 tables untouched.

Do **not** duplicate health/alert engines.

---

## agents

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| organization_id | INT FK CASCADE | isolation |
| asset_id | INT FK CASCADE | Phase 7: 1 primary asset |
| name | TEXT | |
| status | TEXT | ENROLLMENT_PENDING\|ONLINE\|STALE\|OFFLINE\|UNKNOWN\|REVOKED |
| capabilities | JSONB | allowlist subset |
| last_seen_at | TIMESTAMPTZ | from server receive |
| metadata | JSONB | safe only |
| created_at / updated_at | TIMESTAMPTZ | |

Indexes: `(organization_id)`, `(asset_id)`, `(status)`, `(last_seen_at)`.  
Sensitive: none in row (creds separate).  
Delete: with asset/org cascade; revoke first preferred.

---

## agent_enrollments

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| organization_id | INT FK | |
| asset_id | INT FK | |
| token_hash | TEXT UNIQUE | never plaintext |
| capabilities | JSONB | |
| status | TEXT | PENDING\|CONSUMED\|EXPIRED\|REVOKED |
| expires_at | TIMESTAMPTZ | |
| consumed_at | TIMESTAMPTZ NULL | |
| created_by | INT FK users | NOC actor |
| agent_id | INT FK NULL | set on consume |

Unique partial: one PENDING per asset (policy choice — HUMAN confirm).

---

## agent_credentials

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| agent_id | INT FK | |
| organization_id | INT FK | denormalized isolation |
| secret_hash | TEXT | |
| version | INT | |
| status | TEXT | ACTIVE\|ROTATING\|REVOKED |
| created_at | TIMESTAMPTZ | |
| revoked_at | TIMESTAMPTZ NULL | |

Never select secret_hash into API responses.

---

## agent_heartbeats

| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| agent_id | INT FK | |
| organization_id | INT FK | |
| seq | BIGINT | anti-replay |
| agent_reported_at | TIMESTAMPTZ | |
| received_at | TIMESTAMPTZ | server |
| payload | JSONB | size-capped redacted |

Index `(agent_id, received_at DESC)`; unique `(agent_id, seq)`.  
Retention: short (days–weeks) then aggregate.

---

## agent_observations

| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| agent_id | INT FK | |
| organization_id | INT FK | |
| asset_id | INT FK | must match agent |
| type | TEXT | capability-bound |
| schema_version | INT | |
| idempotency_key | TEXT | |
| observed_at / received_at | TIMESTAMPTZ | |
| status | TEXT | ACCEPTED\|REJECTED |
| measurement | JSONB | validated |
| projected_observation_id | INT NULL FK observations | if projected |

Unique `(agent_id, idempotency_key)`.

**Alternative:** write directly to `observations` with `source='AGENT'` and skip separate table — HUMAN decision. Projection preferred if raw agent audit needed.

---

## agent_security_events

| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| organization_id | INT FK | |
| agent_id | INT NULL | |
| kind | TEXT | ENROLL_REPLAY, TENANT_SPOOF, … |
| severity | TEXT | |
| details | JSONB | redacted |
| created_at | TIMESTAMPTZ | |

---

## Blueprint delta

Frozen DB model listed only `agents` + `agent_heartbeats`. Phase 7 **requires** enrollments, credentials, security events, and typed observations for a safe design. Update blueprint CURRENT at implementation time — do not pretend CURRENT already has them.
