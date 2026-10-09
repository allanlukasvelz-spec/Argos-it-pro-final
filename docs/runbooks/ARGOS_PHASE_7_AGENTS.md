# ARGOS Phase 7 — Agents Runbook

## Purpose

Operate the **technical agent** observation plane. Agents send authenticated heartbeats and typed read-only observations. They are **not** remote shells.

## Enrollment (NOC)

1. Confirm org + asset IDs.
2. `POST /api/noc/agents/enrollments` with `{ organizationId, assetId }` (staff `admin|super_admin`).
3. Copy the one-time `token` (never logged by ARGOS).
4. On the customer host:

```bash
ARGOS_API=https://<api> \
ARGOS_ENROLL_TOKEN='enr_...' \
node agents/argos-agent-ref/index.js
```

5. Persist returned `credential` as `ARGOS_AGENT_CREDENTIAL` for restarts.

## Heartbeat / status

| Status | Meaning |
|--------|---------|
| ONLINE | Recent server-received heartbeat |
| STALE | Missed short threshold |
| OFFLINE | Prolonged silence |
| REVOKED | Operator revoked |
| ENROLLMENT_PENDING | Created, no successful heartbeat yet |

**Do not** treat ONLINE as customer HEALTHY.

## Revoke / rotate

- Revoke: `POST /api/noc/agents/:id/revoke`
- Force rotate: `POST /api/noc/agents/:id/rotate` (new credential shown once)

## Incident response

| Symptom | Action |
|---------|--------|
| ENROLL_REPLAY in security events | Investigate stolen token; revoke related agents |
| TENANT_SPOOF / ASSET_SPOOF | Credential may be compromised — revoke |
| HEARTBEAT_REPLAY | Check clock/seq bugs or replay attack |
| Flood / rate limit | Confirm agent version; throttle; revoke if malicious |

## Forbidden

- No `POST /api/agent/v1/exec|shell|sql|remediate` (404)
- No Phase 6 execute → agent host command
- No production migration from this runbook without change control

## CHICO

Customer sees guardian state via `/api/client/guardian`. CHICO explains Core state; it does not invent HEALTHY.
