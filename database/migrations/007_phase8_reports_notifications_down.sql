-- Manual rollback Phase 8 tables (does not remove evidence artifacts)
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_events;
DROP TABLE IF EXISTS platform_jobs;
DROP TABLE IF EXISTS report_runs;
DROP TABLE IF EXISTS reports;
