# ARGOS Phase 7 — Security Model

```
STATUS = PLANNING_ONLY
IMPLEMENTATION_AUTHORIZED = NO
```

Companion: [ARGOS_PHASE_7_THREAT_MODEL.md](./ARGOS_PHASE_7_THREAT_MODEL.md)

---

## Principles

1. Observe > Validate > Evaluate > Decide > Act  
2. Agent ONLINE ≠ asset HEALTHY  
3. Least privilege capabilities  
4. Outbound-only agent connectivity  
5. Never log secrets  
6. Phase 6 remediation ≠ agent remote execution  

---

## Controls (TARGET)

| Control | Design |
|---------|--------|
| Enrollment token | ≥128-bit, hashed, TTL, single-use, atomic consume |
| Agent credential | Hash at rest; rotatable; revocable |
| Transport | TLS 1.2+ HTTPS |
| AuthZ | Binding org+asset from credential record, not body |
| Anti-replay | seq / idempotency key + watermark |
| Rate limit | per agent + per org |
| Payload | schema + size cap + redact |
| Audit | enroll, reject, rotate, revoke, flood |
| NOC | `requireNocAccess` only |
| Client | no agent admin APIs |

---

## Secret handling

Never store/log: raw enrollment tokens after display, agent secrets, customer passwords, private keys, Authorization headers from customer apps.

Redact in `agent_security_events` / activity details like Phase 6 `sanitizeRemediationPayload`.

---

## CSRF / browser vs agent

- **NOC cookie mutations:** existing Origin allowlist (`csrfOriginGuard`) remains mandatory.  
- **Agent token APIs:** not browser-cookie session; use agent credential auth. Still validate content-type/size; no `approved=true` style spoof vectors.

---

## Relationship to Phase 6 safety levels

| Level | Agent role in P7 |
|-------|------------------|
| L0 | Agent may *observe*; NOC/platform may recheck |
| L1 | ARGOS-internal recompute only |
| L2+ host mutation via agent | **NOT AUTHORIZED** |
| L4 | Never |

---

## Compromised agent playbook (summary)

Detect → Revoke credential → Mark REVOKED → Treat recent agent obs as untrusted → Prefer PLATFORM evidence → Human escalate → Re-enroll only on clean host.

---

## Explicit non-goals

SSH, WinRM, arbitrary exec, silent auto-fix, credential harvesting, inbound ARGOS→customer shell channel.
