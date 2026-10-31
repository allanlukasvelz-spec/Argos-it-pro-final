# ARGOS reference agent (Phase 7)

Observation-only. No shell, SQL, exec, or remote remediation.

## Enroll

1. NOC: `POST /api/noc/agents/enrollments` with `organizationId` + `assetId`
2. Run:

```bash
ARGOS_API=http://127.0.0.1:4000 \
ARGOS_ENROLL_TOKEN='enr_...' \
node agents/argos-agent-ref/index.js
```

3. Persist `credential` from enroll response as `ARGOS_AGENT_CREDENTIAL` for restarts.

## Spool

Bounded offline queue at `ARGOS_SPOOL_PATH` (default tmp). Max items / age enforced. Idempotent keys prevent duplicate observations on replay.
