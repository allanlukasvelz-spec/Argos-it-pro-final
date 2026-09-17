-- Phase 3 rollback — drops ONLY Phase 3 monitoring tables.
-- MANUAL: psql "$DATABASE_URL" -f database/migrations/003_monitoring_alerts_incidents_down.sql
-- Does NOT drop organizations, assets, tls_certificates, or Phase 0–2 data.
-- WARNING: destroys Phase 3 operational history (monitors, checks, observations, alerts, incidents).

BEGIN;

DROP TABLE IF EXISTS incident_events CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS observations CASCADE;
DROP TABLE IF EXISTS monitor_checks CASCADE;
DROP TABLE IF EXISTS monitors CASCADE;

COMMIT;
