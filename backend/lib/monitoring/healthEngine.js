/**
 * Deterministic health engine.
 * overall ∈ HEALTHY | WARNING | CRITICAL | UNKNOWN
 * NEVER maps missing/stale/runner-failure evidence to HEALTHY.
 */
const {
  HEALTH_STATES,
  ERROR_CLASS,
  FRESHNESS_FLOOR_SECONDS,
  HTTP_CRITICAL_CONFIRM
} = require("./constants");

/**
 * @param {number} intervalSeconds
 * @param {string} monitorType
 */
function freshnessWindowSeconds(intervalSeconds, monitorType) {
  const interval = Number(intervalSeconds) || 60;
  const floor = FRESHNESS_FLOOR_SECONDS[monitorType] || 120;
  return Math.max(2 * interval, floor);
}

/**
 * @param {Date|string|number} observedAt
 * @param {number} windowSeconds
 * @param {Date} [now]
 */
function isFresh(observedAt, windowSeconds, now = new Date()) {
  if (!observedAt) return false;
  const t = new Date(observedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= windowSeconds * 1000;
}

/**
 * Classify a single observation into health contribution.
 * @returns {'CRITICAL'|'WARNING'|'OK'|'UNKNOWN'|'IGNORE'}
 */
function classifyObservation(obs, monitorType) {
  if (!obs) return "UNKNOWN";
  const ec = obs.error_class || obs.errorClass || null;

  // Execution / security failures → UNKNOWN contribution (never HEALTHY)
  if (
    ec === ERROR_CLASS.SSRF_BLOCKED ||
    ec === ERROR_CLASS.RUNNER_ERROR ||
    ec === ERROR_CLASS.TIMEOUT ||
    ec === ERROR_CLASS.REDIRECT_BLOCKED
  ) {
    return "UNKNOWN";
  }

  if (monitorType === "TLS" || ec === ERROR_CLASS.TLS_EXPIRED) {
    if (ec === ERROR_CLASS.TLS_EXPIRED) return "CRITICAL";
    if (ec === ERROR_CLASS.TLS_EXPIRING) return "WARNING";
    if (ec === ERROR_CLASS.TLS_HOSTNAME_MISMATCH || ec === ERROR_CLASS.TLS_CHAIN_ERROR) {
      return "WARNING";
    }
    if (ec === ERROR_CLASS.TLS_UNKNOWN) return "UNKNOWN";
  }

  if (ec === ERROR_CLASS.HTTP_5XX) return "CRITICAL_CANDIDATE";
  if (ec === ERROR_CLASS.HTTP_4XX) return "WARNING";
  if (ec === ERROR_CLASS.CONN_REFUSED) return "CRITICAL_CANDIDATE";
  if (ec === ERROR_CLASS.DNS_NXDOMAIN) return "CRITICAL_CANDIDATE";
  if (ec === ERROR_CLASS.DNS_FAILURE) {
    // may be drift warning
    if (obs.ok === true || obs.warningOnly) return "WARNING";
    return "CRITICAL_CANDIDATE";
  }

  if (obs.ok === true && !ec) return "OK";
  if (obs.ok === true && ec === ERROR_CLASS.TLS_EXPIRING) return "WARNING";
  if (obs.ok === false) return "WARNING";
  return "UNKNOWN";
}

/**
 * Evaluate health for one asset.
 *
 * @param {{
 *   asset: { id: number, status?: string },
 *   monitors: Array<{ id: number, type: string, enabled: boolean, status: string, interval_seconds: number }>,
 *   observationsByMonitor: Record<number, Array<object>>,
 *   openCriticalAlerts?: boolean,
 *   now?: Date
 * }} input
 */
function evaluateAssetHealth(input) {
  const now = input.now || new Date();
  const monitors = (input.monitors || []).filter(
    (m) => m.enabled && m.status === "ACTIVE"
  );
  const reasons = [];
  const basisObservationIds = [];

  if (monitors.length === 0) {
    return {
      overall: "UNKNOWN",
      reasons: ["no_active_monitors"],
      basisObservationIds: [],
      coverage: { monitored: 0, coveredFresh: 0 }
    };
  }

  let coveredFresh = 0;
  let sawCritical = false;
  let sawWarning = false;
  let sawUnknown = false;
  let sawOk = false;

  for (const mon of monitors) {
    const windowSec = freshnessWindowSeconds(mon.interval_seconds, mon.type);
    const list = (input.observationsByMonitor[mon.id] || []).slice().sort((a, b) => {
      return new Date(b.observed_at || b.observedAt).getTime() - new Date(a.observed_at || a.observedAt).getTime();
    });
    const latest = list[0];
    if (!latest || !isFresh(latest.observed_at || latest.observedAt, windowSec, now)) {
      sawUnknown = true;
      reasons.push(`stale_or_missing:${mon.type}:${mon.id}`);
      continue;
    }

    coveredFresh += 1;
    if (latest.id) basisObservationIds.push(latest.id);

    const cls = classifyObservation(latest, mon.type);

    if (cls === "CRITICAL") {
      sawCritical = true;
      reasons.push(`critical:${mon.type}:${latest.error_class || latest.errorClass}`);
      continue;
    }

    if (cls === "CRITICAL_CANDIDATE") {
      // Confirm window for HTTP-like failures
      const need = mon.type === "HTTP" ? HTTP_CRITICAL_CONFIRM : 1;
      const recent = list.slice(0, need);
      const allFail = recent.length >= need && recent.every((o) => {
        const c = classifyObservation(o, mon.type);
        return c === "CRITICAL_CANDIDATE" || c === "CRITICAL";
      });
      if (allFail) {
        sawCritical = true;
        reasons.push(`critical_confirmed:${mon.type}:${latest.error_class || latest.errorClass}`);
      } else {
        sawWarning = true;
        reasons.push(`unconfirmed_failure:${mon.type}`);
      }
      continue;
    }

    if (cls === "WARNING") {
      sawWarning = true;
      reasons.push(`warning:${mon.type}:${latest.error_class || latest.errorClass || "degraded"}`);
      continue;
    }

    if (cls === "UNKNOWN") {
      sawUnknown = true;
      reasons.push(`unknown_evidence:${mon.type}:${latest.error_class || latest.errorClass || "runner"}`);
      continue;
    }

    if (cls === "OK") {
      sawOk = true;
    }
  }

  const coverage = { monitored: monitors.length, coveredFresh };

  // Insufficient coverage → UNKNOWN (never HEALTHY)
  if (coveredFresh === 0) {
    return {
      overall: "UNKNOWN",
      reasons: reasons.length ? reasons : ["no_fresh_observations"],
      basisObservationIds,
      coverage
    };
  }

  if (sawCritical || input.openCriticalAlerts) {
    return {
      overall: "CRITICAL",
      reasons: input.openCriticalAlerts
        ? [...reasons, "open_critical_alert"]
        : reasons,
      basisObservationIds,
      coverage
    };
  }

  if (sawWarning) {
    return {
      overall: "WARNING",
      reasons,
      basisObservationIds,
      coverage
    };
  }

  // Mix of OK + UNKNOWN (e.g. one runner failure) → UNKNOWN, not HEALTHY
  if (sawUnknown) {
    return {
      overall: "UNKNOWN",
      reasons,
      basisObservationIds,
      coverage
    };
  }

  if (sawOk && coveredFresh === monitors.length) {
    return {
      overall: "HEALTHY",
      reasons: ["fresh_ok_all_monitors"],
      basisObservationIds,
      coverage
    };
  }

  return {
    overall: "UNKNOWN",
    reasons: reasons.length ? reasons : ["insufficient_evidence"],
    basisObservationIds,
    coverage
  };
}

/**
 * Org rollup: worst wins. Never invent HEALTHY from empty.
 * @param {Array<{ overall: string }>} assetHealths
 */
function rollupOrganizationHealth(assetHealths) {
  if (!assetHealths || assetHealths.length === 0) {
    return { overall: "UNKNOWN", reasons: ["no_assets_evaluated"] };
  }
  const ranks = { CRITICAL: 4, WARNING: 3, UNKNOWN: 2, HEALTHY: 1 };
  let worst = "HEALTHY";
  let worstRank = 0;
  for (const h of assetHealths) {
    const o = HEALTH_STATES.includes(h.overall) ? h.overall : "UNKNOWN";
    const r = ranks[o] || 2;
    if (r > worstRank) {
      worstRank = r;
      worst = o;
    }
  }
  return { overall: worst, reasons: [`rollup:${assetHealths.length}_assets`] };
}

module.exports = {
  freshnessWindowSeconds,
  isFresh,
  classifyObservation,
  evaluateAssetHealth,
  rollupOrganizationHealth
};
