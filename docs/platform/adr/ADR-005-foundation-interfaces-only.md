# ADR-005: Foundation adopts interfaces only — no observability/object containers yet

## CONTEXT

Foundation gate must be reversible and low privilege.

## DECISION

ADOPT_NOW: telemetry/storage abstractions, port registry, schema completeness, platform-health honesty. Do **not** deploy Prometheus/Grafana/MinIO/Vault/Temporal in this gate.

## ALTERNATIVES

- Install full LGTM + MinIO now — rejected (resource + exposure risk)
- Docs-only with zero code — weaker (schema gap remains)

## WHY

Prove governance and completeness before adding services.

## SECURITY

No new public ports; remote exec unchanged.

## ROLLBACK

Revert foundation commit; IF NOT EXISTS DDL remains harmless.

## STATUS

ACCEPTED
