# ADR-001: ARGOS remains product truth; tools are engines

## CONTEXT

Platform expansion risks letting Prometheus/Grafana/scanners redefine customer health.

## DECISION

ARGOS owns tenancy, health semantics, incidents, CHICO, approvals, audit, and UX. External tools are subordinate engines.

## ALTERNATIVES

- Replace Client Portal with Grafana — rejected (tenant UX + truth dilution)
- Dual-write health to external systems as source of truth — rejected

## WHY

Consultancy platform needs consistent UNKNOWN≠HEALTHY semantics across customers.

## SECURITY / MULTI_TENANCY / OPERATIONS

External UIs stay private; tenant stamping owned by ARGOS.

## ROLLBACK

N/A (policy ADR).

## STATUS

ACCEPTED
