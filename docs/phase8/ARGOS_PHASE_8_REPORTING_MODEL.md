# ARGOS Phase 8 — Reporting Model

```
STATUS = PLANNING ONLY
IMPLEMENTATION_AUTHORIZED = NO
```

---

## 1. Report lifecycle states

```
REQUESTED → QUEUED → GENERATING → STORING → READY
                ↓         ↓          ↓
              FAILED    FAILED     FAILED
READY → EXPIRED (retention policy, configurable)
```

**No VERIFIED state in MVP** — integrity is proven by EvidenceService SHA-256 on artifact read, not a separate report status.

---

## 2. Report types (classified)

| Report type | MVP | V1 | V1.5 | FUTURE | Rationale |
|-------------|-----|----|----|--------|-----------|
| **Incident Summary Report** | **YES** | refine | | | Full chain: incidents + events + evidence refs |
| Security Summary | | YES | | | Alerts + TLS + assets aggregate |
| Health Summary | | YES | | | observations + health engine output |
| TLS Report | | YES | | | tls_certificates authoritative |
| Asset Status Report | | | YES | | assets + monitors linkage |
| Monitoring Coverage Report | | | YES | | monitors vs assets gap |
| Agent Status Report | | | YES | | agents + heartbeats |
| Remediation Report | | | YES | | remediation_executions + events |
| Monthly Executive Report | | | | YES | Needs mature aggregates |
| Technical Operations Report | | | | YES | NOC-oriented depth |
| Audit Evidence Report | | | | YES | Compliance pack |

---

## 3. MVP: Incident Summary Report

### Scope options (pick one at implementation)

| Variant | Description | Complexity |
|---------|-------------|------------|
| **A — Single incident** | One `incident_id`, full timeline | Lowest |
| B — Rolling window | Last 7 days open/resolved | Medium |

**Recommendation:** Variant A for first producer; add B in 8D+.

### Required report header fields

| Field | Source | Notes |
|-------|--------|-------|
| generated_at | `NOW()` at generation start | ISO8601 |
| organization_id | report request context | tenant bound |
| organization_name | `organizations.name` | |
| report_type | constant `INCIDENT_SUMMARY` | |
| report_template_version | semver in code | audit |
| period_start / period_end | incident bounds or request params | |
| data_freshness | max(`updated_at`) of queried rows | honest timestamp |
| generator_version | git/build id | optional |

### Body sections (traceable)

| Section | Fields | Source table(s) |
|---------|--------|-----------------|
| Incident overview | id, title, status, severity, opened_at, resolved_at | `incidents` |
| Timeline | kind, payload summary, created_at | `incident_events` |
| Related alerts | id, severity, status, title | `alerts` via incident link |
| Affected assets | hostname, type, status | `assets` |
| TLS context (if asset) | expiry, status enum | `tls_certificates` — UNKNOWN if missing |
| Evidence references | evidence_object_id, sha256, mime, created_at | `evidence_objects` + `incident_events` kind=EVIDENCE |
| Remediation summary | execution id, status, action | `remediation_executions` if linked |
| Unknown / incomplete | explicit list | derived when source NULL or stale |

### Forbidden in reports

- Invented security score / percentage protected
- "Fully protected" without evidence
- HEALTHY label when health engine says UNKNOWN/DEGRADED
- Private keys, agent secrets, raw tokens
- Cross-tenant data

---

## 4. Source-of-truth field map (all report types)

| Domain field | Authoritative source | NULL handling |
|--------------|---------------------|---------------|
| Org identity | `organizations` | fail generation |
| Asset inventory | `assets` WHERE org | empty section |
| TLS expiry/status | `tls_certificates` | UNKNOWN section |
| Monitor state | `monitors` + latest `observations` | UNKNOWN |
| Alert facts | `alerts` | empty if none |
| Incident facts | `incidents` | fail if single-incident report |
| Event timeline | `incident_events` append-only | empty timeline allowed |
| Evidence artifacts | `evidence_objects` status=AVAILABLE | list refs only |
| Agent liveness | `agents.last_seen_at` | UNKNOWN offline |
| Remediation state | `remediation_executions` | optional section |
| Audit trail excerpt | `activity_logs` filtered | optional V1 |
| User actions | never from client payload | — |

Every field in MVP report must appear in this map before implementation.

---

## 5. Artifact storage model

```
ReportGeneratorWorker
      ↓ render PDF/HTML buffer
EvidenceService.store({
  organizationId,
  incidentId,          // linkage
  mimeType: application/pdf,
  retentionClass: REPORT,
  idempotencyKey: report_run_id
})
      ↓
evidence_objects.id ──► report_runs.evidence_object_id
```

**No `file_uri` column as primary truth** (contradicts blueprint; evidence_object_id wins).

---

## 6. Metadata vs bytes

| Layer | Stores |
|-------|--------|
| `reports` | logical report entity (type, org, schedule config future) |
| `report_runs` | each generation attempt, status, period, template_version, evidence_object_id, error |
| `evidence_objects` | bytes, sha256, mime, retention |
| ObjectStore | physical bytes |

---

## 7. Idempotency

Stable key: `{organization_id}:{report_type}:{scope_id}:{period_hash}:{template_version}`

| Retry same key | Behavior |
|----------------|----------|
| READY exists | return existing run |
| FAILED | new run or retry policy (human decision) |
| GENERATING stale | reclaim job (worker crash) |

Dedupe window: 24h default for identical on-demand requests (configurable).

---

## 8. Client UX (`/dashboard/informes`)

| Element | Behavior |
|---------|----------|
| Reports list | type, period, generated_at, status |
| View | inline HTML preview or PDF download |
| Status badges | READY, GENERATING, FAILED, EXPIRED |
| Failed state | user-safe message, no stack trace |
| Freshness | show data_freshness timestamp |
| Empty | honest empty state (not fake sample PDF) |

---

## 9. NOC UX (`/noc/reports`)

| Element | Behavior |
|---------|----------|
| Cross-tenant list | org, type, status, times |
| Run detail | template_version, evidence_object_id, error code |
| Retry | POST retry (authorized roles only) |
| Delivery tab | link to notification_deliveries |
| Generate | POST on-behalf-of org (policy TBD) |

---

## 10. Retention (configurable, no legal claims)

| Object | Default policy | LEGAL_HOLD |
|--------|------------------|------------|
| report_runs metadata | STANDARD class | respect evidence flag |
| PDF artifact | via evidence retentionClass REPORT | extend on hold |
| FAILED run rows | 90d then archive | audit retain |

Values marked **CONFIGURABLE** — do not hardcode compliance periods in code docs.
