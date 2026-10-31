# ARGOS Phase 7 — API Contract (PROPOSED ONLY)

```
STATUS = PLANNING_ONLY
RUNTIME_API_AUTHORIZED = NO
```

Do not weaken `/api/client/*`. Agent namespace is separate from NOC and client.

---

## Agent-facing

### POST `/api/agent/v1/enroll`

| | |
|--|--|
| AUTH | enrollment token (header/body once) |
| ROLE | none (pre-agent) |
| INPUT | token, agent name, optional device meta |
| VALIDATION | entropy/format; size cap |
| TENANT | from enrollment row only |
| IDEMPOTENCY | token single-use |
| RATE LIMIT | strict per IP + token |
| OUTPUT | agent_id, credential **once**, capabilities |
| ERRORS | 400/401/409/429 |
| AUDIT | ENROLL_OK / FAIL |
| REDACTION | never log token/secret |

### POST `/api/agent/v1/heartbeat`

| | |
|--|--|
| AUTH | agent credential |
| INPUT | seq, agent_reported_at, optional load stub |
| TENANT | from credential |
| IDEMPOTENCY | (agent_id, seq) |
| RATE LIMIT | per agent |
| OUTPUT | server_time, status |
| ERRORS | 401 revoked; 429 |
| AUDIT | optional sample; always on anomaly |

### POST `/api/agent/v1/observations`

| | |
|--|--|
| AUTH | agent credential |
| INPUT | batch ≤N typed items + idempotency keys |
| VALIDATION | schema per type; capability; size |
| TENANT | cred org; asset must match agent.asset_id |
| IDEMPOTENCY | per item key |
| RATE LIMIT | tighter than heartbeat |
| OUTPUT | accepted/rejected counts |
| ERRORS | 400 schema; 403 spoof; 413 |
| AUDIT | rejects + spoof |

### POST `/api/agent/v1/rotate`

| | |
|--|--|
| AUTH | current credential |
| INPUT | proof of possession |
| OUTPUT | new secret once; dual window policy |
| ERRORS | 401 |
| AUDIT | ROTATE |

---

## NOC-facing

All: `authMiddleware` + `requireNocAccess`. Cookie CSRF Origin applies to mutations.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/noc/agents` | list + filters |
| GET | `/api/noc/agents/:id` | detail |
| POST | `/api/noc/agents/enrollments` | create token (return once) |
| POST | `/api/noc/agents/:id/revoke` | revoke |
| POST | `/api/noc/agents/:id/rotate` | force rotate / invalidate |
| GET | `/api/noc/agents/:id/heartbeats` | history |
| GET | `/api/noc/agents/:id/observations` | history |
| GET | `/api/noc/agents/:id/security-events` | security |

### Common NOC rules

- INPUT validated ints; no raw SQL  
- TENANT: row org visible cross-tenant to NOC but never mixed in one agent  
- IDEMPOTENCY: revoke/rotate keys  
- OUTPUT: no hashes/secrets  
- ERRORS: 403 NOC_FORBIDDEN for cliente/org_admin  
- AUDIT: every mutation  

### Client

**No** agent admin endpoints in Phase 7. Optional later read-only fields on existing monitoring summary — separate decision.

---

## Explicitly rejected endpoints

`POST /api/agent/v1/exec` · `POST /api/agent/v1/shell` · any remediation-via-agent path.
