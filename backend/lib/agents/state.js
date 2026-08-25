/**
 * Phase 7 — agent liveness states (≠ asset HEALTHY).
 * Server receive time is authoritative.
 */
const AGENT_STATUS = Object.freeze({
  ENROLLMENT_PENDING: "ENROLLMENT_PENDING",
  ONLINE: "ONLINE",
  STALE: "STALE",
  OFFLINE: "OFFLINE",
  UNKNOWN: "UNKNOWN",
  REVOKED: "REVOKED"
});

const STALE_AFTER_MS = Number(process.env.AGENT_STALE_AFTER_MS) || 3 * 60 * 1000;
const OFFLINE_AFTER_MS = Number(process.env.AGENT_OFFLINE_AFTER_MS) || 15 * 60 * 1000;

/**
 * Compute status from last_seen_at (server time). REVOKED stays REVOKED.
 */
function deriveAgentStatus({ status, lastSeenAt, now = new Date() }) {
  if (status === AGENT_STATUS.REVOKED) return AGENT_STATUS.REVOKED;
  if (status === AGENT_STATUS.ENROLLMENT_PENDING && !lastSeenAt) {
    return AGENT_STATUS.ENROLLMENT_PENDING;
  }
  if (!lastSeenAt) return AGENT_STATUS.UNKNOWN;
  const age = now.getTime() - new Date(lastSeenAt).getTime();
  if (Number.isNaN(age) || age < 0) return AGENT_STATUS.UNKNOWN;
  if (age <= STALE_AFTER_MS) return AGENT_STATUS.ONLINE;
  if (age <= OFFLINE_AFTER_MS) return AGENT_STATUS.STALE;
  return AGENT_STATUS.OFFLINE;
}

/** Agent ONLINE must never imply asset HEALTHY */
function agentOnlineImpliesHealthy() {
  return false;
}

module.exports = {
  AGENT_STATUS,
  STALE_AFTER_MS,
  OFFLINE_AFTER_MS,
  deriveAgentStatus,
  agentOnlineImpliesHealthy
};
