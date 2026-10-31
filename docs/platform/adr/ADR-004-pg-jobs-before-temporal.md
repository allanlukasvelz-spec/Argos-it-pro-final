# ADR-004: PG-backed jobs before Temporal/Redis

## CONTEXT

Scheduler is in-process; remediation already uses PG state machine.

## DECISION

Next workflow step = PostgreSQL job queue + worker process. Defer Redis/BullMQ and Temporal until proven saturation or multi-day cross-service workflows.

## ALTERNATIVES

- Temporal now — rejected (ops + premature)
- Redis now — deferred

## WHY

Fits CURRENT stack; preserves tenant keys and audit in one transactional store.

## OPERATIONS

Extract worker when API event-loop contention appears.

## ROLLBACK

Keep in-process scheduler path until worker proven.

## STATUS

ACCEPTED
