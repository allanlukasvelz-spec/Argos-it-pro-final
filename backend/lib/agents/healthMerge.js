/**
 * Phase 7 — merge agent observation contributions into asset health.
 * Never invents HEALTHY from agent ONLINE alone.
 */
const { classifyAgentMeasurement } = require("./schemas");
const { deriveAgentStatus, AGENT_STATUS } = require("./state");

const AGENT_OBS_FRESH_MS = Number(process.env.AGENT_OBS_FRESH_MS) || 10 * 60 * 1000;

/**
 * @param {{ overall: string, reasons: string[] }} health
 * @param {{ status?: string, lastSeenAt?: Date|string|null, observations?: Array<{type, measurement, received_at, observed_at}> }} agentCtx
 * @param {Date} [now]
 */
function mergeAgentIntoAssetHealth(health, agentCtx, now = new Date()) {
  const base = health || { overall: "UNKNOWN", reasons: [], basisObservationIds: [], coverage: {} };
  const reasons = [...(base.reasons || [])];
  let overall = base.overall || "UNKNOWN";

  if (!agentCtx) {
    return { ...base, overall, reasons };
  }

  const live = deriveAgentStatus({
    status: agentCtx.status,
    lastSeenAt: agentCtx.lastSeenAt,
    now
  });

  // Agent ONLINE ≠ HEALTHY — only annotate; never upgrade to HEALTHY
  if (live === AGENT_STATUS.ONLINE) {
    reasons.push("agent_online_observation_channel");
  } else if (live === AGENT_STATUS.STALE || live === AGENT_STATUS.OFFLINE) {
    reasons.push(`agent_${live.toLowerCase()}`);
    // Do not force CRITICAL; if we were HEALTHY solely without other evidence, prefer UNKNOWN when agent was the only freshness — but platform monitors own HEALTHY. Soften HEALTHY → keep; if no platform covered, UNKNOWN already.
  } else if (live === AGENT_STATUS.REVOKED) {
    reasons.push("agent_revoked");
  }

  const obs = Array.isArray(agentCtx.observations) ? agentCtx.observations : [];
  let sawCrit = false;
  let sawWarn = false;
  let sawUnknown = false;
  let sawOk = false;

  for (const o of obs) {
    const ts = o.received_at || o.observed_at;
    const age = ts ? now.getTime() - new Date(ts).getTime() : Infinity;
    if (age > AGENT_OBS_FRESH_MS) {
      sawUnknown = true;
      reasons.push(`agent_obs_stale:${o.type}`);
      continue;
    }
    const c = classifyAgentMeasurement(o.type, o.measurement);
    if (c === "CRITICAL") {
      sawCrit = true;
      reasons.push(`agent_metric_critical:${o.type}`);
    } else if (c === "WARNING") {
      sawWarn = true;
      reasons.push(`agent_metric_warning:${o.type}`);
    } else if (c === "UNKNOWN") {
      sawUnknown = true;
    } else if (c === "OK") {
      sawOk = true;
    }
  }

  // Rank: CRITICAL > WARNING > UNKNOWN > HEALTHY; never upgrade UNKNOWN→HEALTHY via agent OK alone
  if (sawCrit) overall = "CRITICAL";
  else if (sawWarn && overall !== "CRITICAL") {
    if (overall === "HEALTHY" || overall === "UNKNOWN" || overall === "WARNING") {
      overall = overall === "CRITICAL" ? "CRITICAL" : "WARNING";
    }
  } else if (sawUnknown && overall === "HEALTHY" && !sawOk) {
    // stale agent metrics should not keep false confidence if they were the only signal — leave platform HEALTHY
  }

  // Explicit: agent online + ok metrics must NOT flip UNKNOWN → HEALTHY
  if (base.overall === "UNKNOWN" && (sawOk || live === AGENT_STATUS.ONLINE)) {
    if (!sawCrit && !sawWarn) {
      overall = "UNKNOWN";
      reasons.push("agent_cannot_invent_healthy");
    }
  }

  return {
    ...base,
    overall,
    reasons,
    agentLiveness: live
  };
}

module.exports = { mergeAgentIntoAssetHealth, AGENT_OBS_FRESH_MS };
