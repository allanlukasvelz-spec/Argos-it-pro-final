# ARGOS Phase 7 — Execution Plan (7A–7J)

```
STATUS = PLANNING_ONLY
EVERY_STAGE_IMPLEMENTATION_AUTHORIZED = NO
```

Complexity is relative effort, not calendar time.

---

## 7A — Threat Model

| | |
|--|--|
| OBJECTIVE | Freeze adversarial model + acceptance criteria |
| FILES | `docs/phase7/*` (this package); no runtime |
| DB / API / UI | none |
| TESTS | review checklist |
| SECURITY GATE | Threats listed; P6 boundary explicit |
| A/B/C | Documented in Failure Matrix |
| ROLLBACK | N/A (docs) |
| HUMAN GATE | **YES** — approve threat assumptions |
| DEPENDENCIES | none |
| COMPLEXITY | LOW |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7B — Agent Identity / Data Model

| | |
|--|--|
| OBJECTIVE | Finalize tables/constraints; align with org/asset FKs |
| FILES LIKELY | `docs/phase7/ARGOS_PHASE_7_DATA_MODEL.md`; later `database/migrations/005_*` (**not now**) |
| DB | Proposed only |
| API / UI | none |
| TESTS | schema review |
| SECURITY GATE | secrets hashed; org isolation columns |
| ROLLBACK | future down SQL manual |
| HUMAN GATE | **YES** — approve 1:1 agent↔asset |
| DEPENDENCIES | 7A |
| COMPLEXITY | MEDIUM |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7C — Secure Enrollment

| | |
|--|--|
| OBJECTIVE | One-time token issue/consume design → later NOC create + agent enroll |
| FILES LIKELY | future `backend/routes/agent*.js`, `noc` enrollment routes |
| DB | enrollments table |
| API | `POST /api/noc/agents/enrollments`, `POST /api/agent/v1/enroll` |
| UI | NOC enrollment form |
| TESTS | atomic consume, replay, expiry, cross-tenant |
| SECURITY GATE | no plaintext token at rest; audit |
| A/B/C | Failure Matrix §Enrollment |
| ROLLBACK | disable enrollment flag; expire tokens |
| HUMAN GATE | **YES** before coding |
| DEPENDENCIES | 7B |
| COMPLEXITY | HIGH |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7D — Agent Authentication / API Foundation

| | |
|--|--|
| OBJECTIVE | mTLS-optional later; bearer/HMAC agent auth; rate limits |
| FILES LIKELY | `backend/middleware/agentAuth.js`, `routes/agentIngest.js` |
| DB | credentials |
| API | auth on all `/api/agent/v1/*` |
| UI | none |
| TESTS | bad cred, revoked, wrong org |
| SECURITY GATE | CSRF N/A for agent token auth; still origin rules for NOC cookie routes |
| ROLLBACK | feature flag off |
| HUMAN GATE | **YES** |
| DEPENDENCIES | 7C |
| COMPLEXITY | HIGH |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7E — Heartbeats / State Machine

| | |
|--|--|
| OBJECTIVE | ONLINE/STALE/OFFLINE/UNKNOWN/REVOKED; no HEALTHY coupling |
| FILES LIKELY | heartbeat handler; scheduler job mark stale |
| DB | `agent_heartbeats` |
| API | `POST /api/agent/v1/heartbeat` |
| UI | NOC status chips |
| TESTS | thresholds; clock skew; ONLINE≠HEALTHY |
| SECURITY GATE | anti-replay seq |
| ROLLBACK | stop stale job |
| HUMAN GATE | **YES** thresholds |
| DEPENDENCIES | 7D |
| COMPLEXITY | MEDIUM |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7F — Typed Observations

| | |
|--|--|
| OBJECTIVE | Schema-validated ingest → healthEngine adapter |
| FILES LIKELY | validators; projector to `observations` |
| DB | `agent_observations` and/or observations rows |
| API | `POST /api/agent/v1/observations` |
| UI | NOC observation history |
| TESTS | schema fail, oversized, idempotent, cross-tenant |
| SECURITY GATE | capability check per type |
| ROLLBACK | reject new types |
| HUMAN GATE | **YES** capability MVP set |
| DEPENDENCIES | 7D, Phase 3 healthEngine |
| COMPLEXITY | HIGH |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7G — Offline Spool / Retry / Idempotency

| | |
|--|--|
| OBJECTIVE | Agent-side + server idempotency keys |
| FILES LIKELY | agent spec doc; server dedupe indexes |
| DB | unique (agent_id, idempotency_key) |
| API | 409/200 idempotent semantics |
| UI | none required |
| TESTS | retry duplicate; spool bounds (spec tests / future agent binary tests) |
| SECURITY GATE | no infinite disk |
| ROLLBACK | N/A server |
| HUMAN GATE | YES |
| DEPENDENCIES | 7E, 7F |
| COMPLEXITY | MEDIUM |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7H — NOC Agents UI

| | |
|--|--|
| OBJECTIVE | Replace `/noc/agents` placeholder |
| FILES LIKELY | `frontend/app/noc/agents/**`, `nocApi.ts` |
| DB | none new beyond prior |
| API | NOC GETs |
| UI | list/detail/enrollment |
| TESTS | frontend lint; role gate already server-side |
| SECURITY GATE | no secrets in UI |
| ROLLBACK | revert to NotAvailable |
| HUMAN GATE | YES (visual) |
| DEPENDENCIES | 7C–7F |
| COMPLEXITY | MEDIUM |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7I — Audit / Rotation / Revocation

| | |
|--|--|
| OBJECTIVE | Rotate/revoke/security events complete |
| FILES LIKELY | rotate/revoke routes; audit writers |
| DB | credentials versions; security events |
| API | rotate/revoke |
| UI | NOC actions |
| TESTS | old cred after rotate; revoke mid-flight |
| SECURITY GATE | dual-window policy explicit |
| ROLLBACK | freeze rotate |
| HUMAN GATE | **YES** |
| DEPENDENCIES | 7D |
| COMPLEXITY | HIGH |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## 7J — Security Red Team / Verification / Freeze

| | |
|--|--|
| OBJECTIVE | ≥20 adversarial cases green; status freeze |
| FILES | tests + `ARGOS_PHASE_7_STATUS.md` (future) |
| DB | none |
| API | none new |
| UI | none |
| TESTS | full verify backend/frontend |
| SECURITY GATE | PASS required |
| ROLLBACK | hold release |
| HUMAN GATE | **YES — FINAL** before any “Phase 7 complete” |
| DEPENDENCIES | 7A–7I |
| COMPLEXITY | HIGH |
| IMPLEMENTATION_AUTHORIZED | **NO** |

---

## Explicit non-stages (out of Phase 7)

- Remote remediation transport
- Agent auto-update CA/binary trust system
- CHICO Security Guardian Client chrome runtime (`PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION=NO`; Design Contract TARGET amended — see `docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md`; still needs explicit UI auth)
- Client agent administration

Each requires separate authorization.
