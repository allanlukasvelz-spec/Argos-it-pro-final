/**
 * Pure health/coverage semantics for Client Portal.
 * UNKNOWN ≠ HEALTHY; NO_ALERTS ≠ HEALTHY; NO_MONITORS ≠ PROTECTED.
 */

export const HEALTH = Object.freeze({
  HEALTHY: "HEALTHY",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
  UNKNOWN: "UNKNOWN"
});

export type ProtectionInput = {
  overall?: string | null;
  monitorsEnabled?: number;
  assetsWithFreshEvidence?: number;
  openAlerts?: number;
  openIncidents?: number;
};

export function normalizeHealth(value: unknown): string {
  const v = String(value || "").toUpperCase();
  if (
    v === HEALTH.HEALTHY ||
    v === HEALTH.WARNING ||
    v === HEALTH.CRITICAL ||
    v === HEALTH.UNKNOWN
  ) {
    return v;
  }
  return HEALTH.UNKNOWN;
}

export function deriveProtectionSummary(input: ProtectionInput) {
  const overall = normalizeHealth(input.overall);
  const monitorsEnabled = Number(input.monitorsEnabled) || 0;
  const fresh = Number(input.assetsWithFreshEvidence) || 0;
  const openAlerts = Number(input.openAlerts) || 0;
  const openIncidents = Number(input.openIncidents) || 0;

  const coverage =
    monitorsEnabled <= 0 ? "NONE" : fresh <= 0 ? "PARTIAL" : fresh < monitorsEnabled ? "PARTIAL" : "MONITORED";

  return {
    overall,
    coverage,
    monitorsEnabled,
    assetsWithFreshEvidence: fresh,
    openAlerts,
    openIncidents,
    fullyProtected: false,
    claimsHealthy: overall === HEALTH.HEALTHY,
    zeroAlertsImpliesHealthy: false as const,
    zeroIncidentsImpliesHealthy: false as const,
    noMonitorsImpliesProtected: false as const,
    canShowHealthy: overall === HEALTH.HEALTHY && monitorsEnabled > 0 && fresh > 0
  };
}

export function observationToDisplayHealth(obs: {
  ok?: boolean;
  errorClass?: string | null;
  fresh?: boolean;
  overall?: string;
}): string {
  if (!obs || obs.fresh === false) return HEALTH.UNKNOWN;
  const ec = String(obs.errorClass || "").toUpperCase();
  if (["SSRF_BLOCKED", "RUNNER_ERROR", "TIMEOUT", "REDIRECT_BLOCKED"].includes(ec)) {
    return HEALTH.UNKNOWN;
  }
  if (obs.overall) return normalizeHealth(obs.overall);
  if (obs.ok === true) return HEALTH.HEALTHY;
  if (obs.ok === false) return HEALTH.WARNING;
  return HEALTH.UNKNOWN;
}
