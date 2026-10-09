-- Phase 7 down — MANUAL ONLY. Do not auto-run in production.
-- Drops agent plane tables. Does not restore observations.monitor_id NOT NULL
-- if AGENT rows with NULL monitor_id exist — clean those first.

DROP TABLE IF EXISTS agent_security_events;
DROP TABLE IF EXISTS agent_observations;
DROP TABLE IF EXISTS agent_heartbeats;
DROP TABLE IF EXISTS agent_credentials;
DROP TABLE IF EXISTS agent_enrollments;
DROP TABLE IF EXISTS agents;

-- Optional (unsafe if AGENT observations remain):
-- ALTER TABLE observations ALTER COLUMN monitor_id SET NOT NULL;
