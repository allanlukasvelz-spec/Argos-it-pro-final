/**
 * Phase 3 — health engine unit tests.
 * Run: node --test backend/lib/monitoring/healthEngine.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  evaluateAssetHealth,
  rollupOrganizationHealth,
  isFresh,
  freshnessWindowSeconds
} = require("./healthEngine");
const { ERROR_CLASS } = require("./constants");

const now = new Date("2026-08-25T12:00:00.000Z");

function mon(id, type, interval = 60) {
  return {
    id,
    type,
    enabled: true,
    status: "ACTIVE",
    interval_seconds: interval
  };
}

describe("healthEngine freshness", () => {
  it("treats missing observation as not fresh", () => {
    assert.equal(isFresh(null, 120, now), false);
  });

  it("HTTP window is at least 2*interval", () => {
    assert.equal(freshnessWindowSeconds(60, "HTTP"), 120);
  });
});

describe("healthEngine evaluateAssetHealth", () => {
  it("UNKNOWN when no active monitors", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [],
      observationsByMonitor: {},
      now
    });
    assert.equal(r.overall, "UNKNOWN");
    assert.ok(r.reasons.includes("no_active_monitors"));
  });

  it("UNKNOWN when observations missing/stale — never HEALTHY", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "HTTP")],
      observationsByMonitor: {
        10: [
          {
            id: 1,
            ok: true,
            observed_at: "2026-08-01T00:00:00.000Z",
            error_class: null
          }
        ]
      },
      now
    });
    assert.equal(r.overall, "UNKNOWN");
  });

  it("HEALTHY only with fresh OK evidence on all monitors", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "HTTP"), mon(11, "TLS", 86400)],
      observationsByMonitor: {
        10: [{ id: 1, ok: true, observed_at: now.toISOString(), error_class: null }],
        11: [{ id: 2, ok: true, observed_at: now.toISOString(), error_class: null }]
      },
      now
    });
    assert.equal(r.overall, "HEALTHY");
  });

  it("runner/SSRF failure contributes UNKNOWN not HEALTHY", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "HTTP")],
      observationsByMonitor: {
        10: [
          {
            id: 1,
            ok: false,
            observed_at: now.toISOString(),
            error_class: ERROR_CLASS.RUNNER_ERROR
          }
        ]
      },
      now
    });
    assert.equal(r.overall, "UNKNOWN");
  });

  it("TLS EXPIRING → WARNING", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "TLS", 86400)],
      observationsByMonitor: {
        10: [
          {
            id: 1,
            ok: true,
            observed_at: now.toISOString(),
            error_class: ERROR_CLASS.TLS_EXPIRING
          }
        ]
      },
      now
    });
    assert.equal(r.overall, "WARNING");
  });

  it("TLS EXPIRED → CRITICAL", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "TLS", 86400)],
      observationsByMonitor: {
        10: [
          {
            id: 1,
            ok: false,
            observed_at: now.toISOString(),
            error_class: ERROR_CLASS.TLS_EXPIRED
          }
        ]
      },
      now
    });
    assert.equal(r.overall, "CRITICAL");
  });

  it("single HTTP 5xx is WARNING until confirmed", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "HTTP")],
      observationsByMonitor: {
        10: [
          {
            id: 1,
            ok: false,
            observed_at: now.toISOString(),
            error_class: ERROR_CLASS.HTTP_5XX
          }
        ]
      },
      now
    });
    assert.equal(r.overall, "WARNING");
  });

  it("two consecutive HTTP 5xx → CRITICAL", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "HTTP")],
      observationsByMonitor: {
        10: [
          {
            id: 2,
            ok: false,
            observed_at: now.toISOString(),
            error_class: ERROR_CLASS.HTTP_5XX
          },
          {
            id: 1,
            ok: false,
            observed_at: new Date(now.getTime() - 30000).toISOString(),
            error_class: ERROR_CLASS.HTTP_5XX
          }
        ]
      },
      now
    });
    assert.equal(r.overall, "CRITICAL");
  });

  it("open critical alert forces CRITICAL", () => {
    const r = evaluateAssetHealth({
      asset: { id: 1 },
      monitors: [mon(10, "HTTP")],
      observationsByMonitor: {
        10: [{ id: 1, ok: true, observed_at: now.toISOString(), error_class: null }]
      },
      openCriticalAlerts: true,
      now
    });
    assert.equal(r.overall, "CRITICAL");
  });
});

describe("healthEngine rollup", () => {
  it("empty assets → UNKNOWN", () => {
    assert.equal(rollupOrganizationHealth([]).overall, "UNKNOWN");
  });

  it("worst wins", () => {
    assert.equal(
      rollupOrganizationHealth([{ overall: "HEALTHY" }, { overall: "WARNING" }]).overall,
      "WARNING"
    );
    assert.equal(
      rollupOrganizationHealth([{ overall: "WARNING" }, { overall: "CRITICAL" }]).overall,
      "CRITICAL"
    );
  });
});
