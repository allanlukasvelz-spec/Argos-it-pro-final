/**
 * Phase 3 monitoring constants.
 * Health overall ≠ monitor lifecycle ≠ check execution status.
 */

const MONITOR_TYPES = Object.freeze(["HTTP", "TLS", "DNS"]);

const MONITOR_STATUS = Object.freeze(["ACTIVE", "PAUSED", "DISABLED", "ERROR"]);

const CHECK_STATUS = Object.freeze([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "TIMED_OUT",
  "CANCELLED"
]);

/** Visual / product overall health (Design Contract). */
const HEALTH_STATES = Object.freeze(["HEALTHY", "WARNING", "CRITICAL", "UNKNOWN"]);

const ALERT_SEVERITY = Object.freeze(["WARNING", "CRITICAL"]);
const ALERT_STATE = Object.freeze(["OPEN", "ACKNOWLEDGED", "RESOLVED"]);

const INCIDENT_STATE = Object.freeze(["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"]);

const ERROR_CLASS = Object.freeze({
  TIMEOUT: "TIMEOUT",
  CONN_REFUSED: "CONN_REFUSED",
  DNS_NXDOMAIN: "DNS_NXDOMAIN",
  DNS_FAILURE: "DNS_FAILURE",
  TLS_EXPIRED: "TLS_EXPIRED",
  TLS_EXPIRING: "TLS_EXPIRING",
  TLS_HOSTNAME_MISMATCH: "TLS_HOSTNAME_MISMATCH",
  TLS_CHAIN_ERROR: "TLS_CHAIN_ERROR",
  TLS_UNKNOWN: "TLS_UNKNOWN",
  HTTP_5XX: "HTTP_5XX",
  HTTP_4XX: "HTTP_4XX",
  HTTP_OTHER: "HTTP_OTHER",
  SSRF_BLOCKED: "SSRF_BLOCKED",
  RUNNER_ERROR: "RUNNER_ERROR",
  REDIRECT_BLOCKED: "REDIRECT_BLOCKED"
});

/** Default intervals (seconds). */
const DEFAULT_INTERVAL = Object.freeze({
  HTTP: 60,
  TLS: 86400,
  DNS: 86400
});

const DEFAULT_TIMEOUT_MS = Object.freeze({
  HTTP: 8000,
  TLS: 8000,
  DNS: 5000
});

/** Freshness floor in seconds when 2*interval is smaller. */
const FRESHNESS_FLOOR_SECONDS = Object.freeze({
  HTTP: 120,
  TLS: 86400,
  DNS: 86400
});

const EVIDENCE_MAX_BYTES = 8192;

/** Consecutive failing observations before CRITICAL for HTTP. */
const HTTP_CRITICAL_CONFIRM = 2;

module.exports = {
  MONITOR_TYPES,
  MONITOR_STATUS,
  CHECK_STATUS,
  HEALTH_STATES,
  ALERT_SEVERITY,
  ALERT_STATE,
  INCIDENT_STATE,
  ERROR_CLASS,
  DEFAULT_INTERVAL,
  DEFAULT_TIMEOUT_MS,
  FRESHNESS_FLOOR_SECONDS,
  EVIDENCE_MAX_BYTES,
  HTTP_CRITICAL_CONFIRM
};
