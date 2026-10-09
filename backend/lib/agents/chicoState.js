/**
 * Phase 7 — CHICO Security Guardian presentation state (from Core truth only).
 * Presentation states authorized for runtime MVP:
 * NORMAL | ATTENTION | CRITICAL | UNKNOWN | VERIFYING | RESOLVED
 */
const CHICO_STATES = Object.freeze({
  NORMAL: "NORMAL",
  ATTENTION: "ATTENTION",
  CRITICAL: "CRITICAL",
  UNKNOWN: "UNKNOWN",
  VERIFYING: "VERIFYING",
  RESOLVED: "RESOLVED"
});

const COPY = Object.freeze({
  NORMAL: "Las comprobaciones disponibles no muestran incidencias críticas.",
  ATTENTION: "Hay una comprobación que necesita tu atención.",
  CRITICAL: "ARGOS ha confirmado un problema que requiere revisión.",
  UNKNOWN: "No dispongo de evidencia reciente suficiente para confirmar el estado.",
  VERIFYING: "Estoy verificando de nuevo el estado.",
  RESOLVED: "La incidencia figura como resuelta y la verificación posterior es correcta."
});

/**
 * @param {{
 *   overall?: string,
 *   openAlerts?: number,
 *   openCriticalAlerts?: number,
 *   openIncidents?: number,
 *   monitorsEnabled?: number,
 *   assetsWithFreshEvidence?: number,
 *   agentStatuses?: string[],
 *   remediationVerifying?: boolean,
 *   recentlyResolvedVerified?: boolean
 * }} input
 */
function deriveChicoState(input = {}) {
  const overall = String(input.overall || "UNKNOWN").toUpperCase();
  const openCritical = Number(input.openCriticalAlerts) || 0;
  const openIncidents = Number(input.openIncidents) || 0;
  const openAlerts = Number(input.openAlerts) || 0;
  const monitorsEnabled = Number(input.monitorsEnabled) || 0;
  const fresh = Number(input.assetsWithFreshEvidence) || 0;
  const agents = Array.isArray(input.agentStatuses) ? input.agentStatuses : [];

  if (input.remediationVerifying === true) {
    return pack(CHICO_STATES.VERIFYING, {
      why: "remediation_verifying",
      overall
    });
  }

  if (openCritical > 0 || openIncidents > 0 || overall === "CRITICAL") {
    return pack(CHICO_STATES.CRITICAL, {
      why: openIncidents > 0 ? "open_incident" : "critical_alert_or_health",
      overall,
      openIncidents,
      openCritical
    });
  }

  if (input.recentlyResolvedVerified === true && openIncidents === 0 && openCritical === 0) {
    return pack(CHICO_STATES.RESOLVED, { why: "verified_resolution", overall });
  }

  if (monitorsEnabled <= 0 || fresh <= 0 || overall === "UNKNOWN") {
    return pack(CHICO_STATES.UNKNOWN, {
      why: monitorsEnabled <= 0 ? "no_monitors" : "insufficient_fresh_evidence",
      overall,
      agentNote: agents.some((s) => s === "OFFLINE" || s === "STALE")
        ? "agent_liveness_degraded"
        : null
    });
  }

  if (overall === "WARNING" || openAlerts > 0) {
    return pack(CHICO_STATES.ATTENTION, {
      why: overall === "WARNING" ? "health_warning" : "open_alerts",
      overall,
      openAlerts
    });
  }

  // Agents offline alone do NOT force CRITICAL; may annotate NORMAL/ATTENTION
  const agentDegraded = agents.some((s) => s === "OFFLINE" || s === "STALE");
  if (overall === "HEALTHY" && monitorsEnabled > 0 && fresh > 0 && openAlerts === 0 && openIncidents === 0) {
    if (agentDegraded) {
      return pack(CHICO_STATES.ATTENTION, {
        why: "agent_connectivity",
        overall,
        note: "Agent liveness degraded; asset health still evidence-based"
      });
    }
    return pack(CHICO_STATES.NORMAL, { why: "healthy_with_evidence", overall });
  }

  return pack(CHICO_STATES.UNKNOWN, { why: "fallback_unknown", overall });
}

function pack(state, meta) {
  return {
    state,
    label: state,
    message: COPY[state] || COPY.UNKNOWN,
    meta: meta || {},
    invariants: {
      agentOnlineImpliesHealthy: false,
      zeroAlertsImpliesHealthy: false,
      zeroIncidentsImpliesHealthy: false,
      unknownImpliesHealthy: false
    }
  };
}

module.exports = { CHICO_STATES, COPY, deriveChicoState };
