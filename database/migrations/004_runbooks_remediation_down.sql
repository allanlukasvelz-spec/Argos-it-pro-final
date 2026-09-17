-- Phase 6 rollback — drops ONLY Phase 6 remediation tables.
-- Manual only. Never via migrate.sh forward.

BEGIN;

DROP TABLE IF EXISTS remediation_events;
DROP TABLE IF EXISTS remediation_approvals;
DROP TABLE IF EXISTS remediation_executions;
DROP TABLE IF EXISTS remediation_test_flags;
DROP TABLE IF EXISTS runbook_versions;
DROP TABLE IF EXISTS runbooks;

COMMIT;
