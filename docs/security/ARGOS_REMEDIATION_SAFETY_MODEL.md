# ARGOS — Remediation Safety Model (Phase 6)

## Principle

ARGOS must never become “something failed → run commands until it works.”

Observe → evidence → deterministic hypothesis → typed action → preconditions → risk class → dry-run → approval if required → execute → verify → failure evidence → next justified action → rollback → safe stop.

## Levels

| Level | Name | Phase 6 |
|-------|------|---------|
| L0 | READ ONLY | HTTP/TLS/DNS/MONITOR recheck (control-plane observations) |
| L1 | SAFE AUTOMATION | Health recompute, incident evidence append |
| L2 | REVERSIBLE | Simulator flags only (`remediation_test_flags`) |
| L3 | HUMAN APPROVAL | Simulator L3 demo; server-validated approval required |
| L4 | NEVER AUTO | Registered denials; engine throws `L4_FORBIDDEN` |

## Controls

- Allowlisted registry (code, not DB-executable)
- No user-supplied action names as dynamic imports
- Reject input keys: `command`, `shell`, `sql`, `path`
- Dry-run must set `mutation: false`
- L2 requires rollback handler
- L3: scoped `scope_hash`, expiry, single consume, no body `approved=true`
- Self-approval denied unless `ALLOW_NOC_SELF_APPROVAL=1`
- State machine + `SELECT FOR UPDATE` claim
- `execution_key` uniqueness per organization
- Audit via `remediation_events` (redacted)
- CSRF: Origin allowlist for cookie-authenticated mutations

## Explicit non-goals (Phase 6)

SSH, WinRM, k8s/docker exec, remote SQL, DNS provider writes, TLS renewal, firewall, agents.
