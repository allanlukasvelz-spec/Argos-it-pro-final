# ADR-002: Defer Kubernetes; keep Docker Compose

## CONTEXT

Three-service ARGOS stack runs on Compose/Coolify today.

## DECISION

`K8S_ADOPT_NOW = NO`. Remain on Docker Compose until explicit scale/ops triggers.

## ALTERNATIVES

- Adopt k8s now — rejected (ops cost > benefit at S0–S1)
- Nomad/other — not evaluated as primary

## WHY

Complexity and privilege surface must not grow without demonstrated need.

## SECURITY

Avoid cluster RBAC/network sprawl before platform team capacity exists.

## OPERATIONS

Harden Compose (limits, no docker.sock, pin digests) instead.

## ROLLBACK

N/A.

## STATUS

ACCEPTED
