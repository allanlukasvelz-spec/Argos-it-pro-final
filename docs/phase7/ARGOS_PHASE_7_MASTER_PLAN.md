# ARGOS Phase 7 — Master Plan

```
STATUS = PLANNING_UPDATED_POST_IMPLEMENTATION
PHASE_7_IMPLEMENTATION_AUTHORIZED = YES
PHASE_7_REMOTE_OBSERVATION_AUTHORIZED = YES
PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION = YES
REMOTE_REMEDIATION_AUTHORIZED = NO
HEAD_BASELINE = 9a5e8cd
BRANCH = feature/argos-multitenant-platform
DATE = 2026-08-25
```

See **CURRENT implementation status:** [`docs/architecture/ARGOS_PHASE_7_STATUS.md`](../architecture/ARGOS_PHASE_7_STATUS.md).

---

## 0. Preflight

| Check | Expected | Actual | Impact |
|-------|----------|--------|--------|
| Branch | `feature/argos-multitenant-platform` | MATCH | — |
| HEAD | `9a5e8cd` | MATCH (`9a5e8cd671bafc…`) | — |
| Phase 6 message | `feat(remediation): add safe runbook and approval engine` | MATCH | — |
| Working tree | CLEAN | CLEAN | — |
| Stash | untouched | `stash@{0}` intact | DO NOT TOUCH |
| Tag | `argos-pre-multitenant-2026-08-24` | PRESENT | — |

**Recommendation:** Proceed with planning only. No runtime writes.

---

## 1. What exactly are we building?

**ARGOS Agent Foundation** — a customer-side observability channel that:

1. enrolls with a one-time scoped token,
2. authenticates with rotatable credentials,
3. sends heartbeats and **typed** read-only observations outbound over TLS,
4. feeds the **existing** Phase 3 observation → health → alert → incident pipeline,
5. is operated from NOC (`/noc/agents`, today a Phase 7 placeholder).

We are **not** building remote shell, SSH, arbitrary scripts, or remote remediation.

---

## 2. Why do we need an agent?

Phase 0–6 already cover:

- org/tenant isolation,
- assets + TLS,
- platform-side HTTP/TLS/DNS monitors,
- client portal + NOC,
- typed runbooks/remediation (control-plane / simulator only).

**Gap:** host-local signals ARGOS cannot see from outside (disk, memory, load, local service status) without an on-host sensor. Agents close that gap as an **additional observation source** (`observations.source` already allows `'AGENT'` in Phase 3 schema).

---

## 3–5. What can the agent see / not do / leave customer infra?

| See (candidate Phase 7) | Leave customer site | Must NOT do |
|-------------------------|---------------------|-------------|
| Heartbeat liveness | Agent id, seq, timestamps, capability set | Shell / SSH / SQL / scripts |
| Optional typed metrics | Schema-validated measurements only | Filesystem browse, credential harvest |
| Safe local probe results | Structured status enums | HTTP mutation, silent auto-fix |
| | Encrypted in transit TLS 1.2+ | Private keys, passwords, raw auth headers |

Default capability set for MVP should be **narrow**: `HEARTBEAT` + a minimal metrics subset. Anything not required for proving the trust model is **DEFERRED** (see Architecture §Capabilities).

---

## 6. How is it encrypted?

- **Transit:** HTTPS only, TLS 1.2+ outbound from customer → ARGOS agent ingest API.
- **At rest (ARGOS):** store credential **hashes** (or encrypted blobs with KMS-style secret), never plaintext agent secrets in logs/`activity_logs`.
- **Enrollment tokens:** high-entropy, hashed at rest, single-use, TTL.
- **No inbound** customer firewall hole for ARGOS-initiated control plane (agent calls out).

---

## 7–8. Identity and tenant isolation

- Agent bound to **exactly one** `organization_id` and **exactly one primary `asset_id`** at enrollment (see Architecture for multi-asset FUTURE).
- Every ingest path: authenticate agent → load binding → reject if body org/asset ≠ credential binding.
- NOC mutations: `requireNocAccess` (`admin|super_admin`); `org_admin` never.
- Client APIs: **no** agent admin; optional read-only “monitoring source” copy later.

---

## 9–10. Stolen credentials / compromised agent

| Event | Response |
|-------|----------|
| Stolen enrollment token | Single-use + TTL + atomic consume; replay → reject + audit |
| Stolen operational credential | Rotate + revoke; old cred rejected; clone detection via concurrent seq/device fingerprint (FUTURE hardening) |
| Compromised host/agent | Treat as hostile sensor: revoke, freeze trust in that source, do **not** auto-HEALTHY; escalate human |
| Flood / DoS | Rate limit per agent/org; 429 + backoff; discard overflow spool |

---

## 11–12. Offline ARGOS / offline customer

| Case | Behavior |
|------|----------|
| ARGOS down | Agent local spool (bounded); exponential backoff + jitter; no infinite disk growth |
| Customer offline | Agent → STALE → OFFLINE by thresholds; asset health may become **UNKNOWN**, never invent HEALTHY |
| Cred expired while offline | On reconnect: enroll/rotate failure → SAFE STOP send path until re-enrollment |

---

## 13–14. HEALTHY vs ONLINE / UNKNOWN

| Concept | Meaning |
|---------|---------|
| Agent **ONLINE** | Recent valid heartbeat |
| Agent **STALE/OFFLINE** | Heartbeat aged past thresholds |
| Asset **HEALTHY** | Derived by `healthEngine` from evidence + coverage |
| **UNKNOWN** | Insufficient evidence (first-class; never coerced to HEALTHY) |

**Forbidden:** Agent online ⇒ HEALTHY; heartbeat ⇒ protected; no telemetry ⇒ HEALTHY.

---

## 15. How Phase 3 consumes agent observations

**One truth model:** append agent measurements as observations (or a tightly coupled `agent_observations` table that **projects** into the same evaluation inputs). Prefer:

1. Validate/normalize agent payload,
2. write append-only observation(s) with `source='AGENT'`,
3. reuse `healthEngine` / `alertEngine` / `incidentEngine`.

Do **not** create a second health engine for agents.

---

## 16–17. NOC and Client

**NOC:** list/detail, enrollment create, rotate, revoke, heartbeats, observations, security events, audit. Technical truth visible.

**Client:** optional honest status (“fuente de monitorización conectada / sin confirmación reciente”). CHICO persona may **explain** state; no agent admin, no remote controls.

---

## 18. Phase 6 boundary (CRITICAL)

```
AGENT  = OBSERVATION CHANNEL
Phase 6 = CONTROLLED REMEDIATION ENGINE (typed, approved, verified)
```

Phase 7 must **not** wire agent as an execution transport for runbooks. Label any future remote execute:

`FUTURE / NOT AUTHORIZED / SEPARATE THREAT MODEL + HUMAN GATE`

---

## 19. Explicitly forbidden (Phase 7)

Arbitrary shell/SSH/SQL/scripts/filesystem, generic command execution, unrestricted HTTP mutation, silent auto-fix, autonomous production remediation, hidden privilege, credential/private-key collection, remote auto-update without separate security model, inbound management that requires opening customer firewall for ARGOS control, client remediation controls.

---

## 20. Built in 7A–7J

See `ARGOS_PHASE_7_EXECUTION_PLAN.md`. All stages: `IMPLEMENTATION_AUTHORIZED=NO`.

---

## 21. Tests that prove it

Enrollment atomicity, replay, cross-tenant reject, revoke enforcement, rate limit, schema validation, idempotent observations, clock skew handling, spool bounds, NOC role gate, org_admin denied, secret redaction, HEALTHY≠ONLINE semantics tests, red-team suite (≥20 cases).

---

## 22. Rollback per stage

Prefer additive migrations + feature flags; down SQL manual (same pattern as 003/004). Kill ingest routes; revoke all agents; NOC page back to placeholder. No DROP of Phase 0–6 data.

---

## 23. Human approval gates

After each of 7A–7J docs/security review; explicit gate before any migration; explicit gate before any `/api/agent` merge; **never** auto-start remote remediation.

---

## 24. Remains FUTURE

Agent multi-asset, remote execute channel, auto-update, ML prediction, marketplace, CHICO LLM “security copilot” beyond existing mascot chat, WinRM/k8s connectors.

---

## CHICO — ARGOS SECURITY GUARDIAN (planning)

Canonical TARGET design contract:  
[`docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md`](../design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md)

Planning addendum: [`ARGOS_PHASE_7_CHICO_GUARDIAN.md`](./ARGOS_PHASE_7_CHICO_GUARDIAN.md).

- **CHICO** = Security Guardian (primary customer security face).
- **DUMBO** = guide / UX role **preserved**; not security guardian.
- **ARGOS Agent** = technical component (not CHICO).
- Cardinality: one org → one CHICO → many assets → N agents.
- Design Contract **TARGET** amended (ASSISTANT_ONLY conflict resolved for Client security surfaces).
- Runtime Client UI still **NO**.

`PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION=NO`

| File | Role |
|------|------|
| [../design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](../design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md) | Canonical Guardian TARGET contract |
| [ARGOS_PHASE_7_CHICO_GUARDIAN.md](./ARGOS_PHASE_7_CHICO_GUARDIAN.md) | Phase 7 planning addendum |
| [ARGOS_PHASE_7_ARCHITECTURE.md](./ARGOS_PHASE_7_ARCHITECTURE.md) | System design + CHICO |
| [ARGOS_PHASE_7_MENTAL_MAP.md](./ARGOS_PHASE_7_MENTAL_MAP.md) | Mermaid maps |
| [ARGOS_PHASE_7_EXECUTION_PLAN.md](./ARGOS_PHASE_7_EXECUTION_PLAN.md) | 7A–7J |
| [ARGOS_PHASE_7_FAILURE_MATRIX.md](./ARGOS_PHASE_7_FAILURE_MATRIX.md) | A/B/C ops |
| [ARGOS_PHASE_7_SECURITY_MODEL.md](./ARGOS_PHASE_7_SECURITY_MODEL.md) | Controls + threats summary |
| [ARGOS_PHASE_7_THREAT_MODEL.md](./ARGOS_PHASE_7_THREAT_MODEL.md) | Full threat table |
| [ARGOS_PHASE_7_DATA_MODEL.md](./ARGOS_PHASE_7_DATA_MODEL.md) | Proposed tables |
| [ARGOS_PHASE_7_API_CONTRACT.md](./ARGOS_PHASE_7_API_CONTRACT.md) | Proposed APIs |
| [ARGOS_PHASE_7_IMPLEMENTATION_MAP.html](./ARGOS_PHASE_7_IMPLEMENTATION_MAP.html) | Visual owner map |

---

## STOP

This package is for **human review**. It does not authorize implementation.
