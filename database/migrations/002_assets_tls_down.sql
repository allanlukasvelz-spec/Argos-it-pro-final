-- Phase 2 rollback (optional, destructive only to Phase 2 tables)
-- Apply only if intentionally reverting assets/TLS.
-- Does NOT drop organizations or Phase 0/1 columns.

BEGIN;
DROP TABLE IF EXISTS tls_certificates;
DROP TABLE IF EXISTS assets;
COMMIT;
