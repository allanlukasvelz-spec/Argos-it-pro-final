/**
 * Unit tests — client portal health semantics (no React).
 * Run: node --experimental-strip-types --test frontend/lib/clientHealthSemantics.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveProtectionSummary,
  observationToDisplayHealth,
  HEALTH
} from "./clientHealthSemantics.ts";

describe("deriveProtectionSummary", () => {
  it("no monitors is NEVER protected or healthy claim", () => {
    const s = deriveProtectionSummary({
      overall: "UNKNOWN",
      monitorsEnabled: 0,
      assetsWithFreshEvidence: 0,
      openAlerts: 0,
      openIncidents: 0
    });
    assert.equal(s.coverage, "NONE");
    assert.equal(s.fullyProtected, false);
    assert.equal(s.noMonitorsImpliesProtected, false);
    assert.equal(s.canShowHealthy, false);
    assert.equal(s.zeroAlertsImpliesHealthy, false);
    assert.equal(s.zeroIncidentsImpliesHealthy, false);
  });

  it("zero alerts does not imply HEALTHY", () => {
    const s = deriveProtectionSummary({
      overall: "UNKNOWN",
      monitorsEnabled: 3,
      assetsWithFreshEvidence: 0,
      openAlerts: 0,
      openIncidents: 0
    });
    assert.equal(s.overall, HEALTH.UNKNOWN);
    assert.equal(s.canShowHealthy, false);
    assert.equal(s.zeroAlertsImpliesHealthy, false);
  });

  it("HEALTHY only when overall healthy AND coverage fresh", () => {
    const bad = deriveProtectionSummary({
      overall: "HEALTHY",
      monitorsEnabled: 2,
      assetsWithFreshEvidence: 0
    });
    assert.equal(bad.canShowHealthy, false);

    const ok = deriveProtectionSummary({
      overall: "HEALTHY",
      monitorsEnabled: 2,
      assetsWithFreshEvidence: 2
    });
    assert.equal(ok.canShowHealthy, true);
    assert.equal(ok.fullyProtected, false);
  });
});

describe("observationToDisplayHealth", () => {
  it("stale or missing → UNKNOWN", () => {
    assert.equal(observationToDisplayHealth({ fresh: false, ok: true }), HEALTH.UNKNOWN);
    assert.equal(observationToDisplayHealth({}), HEALTH.UNKNOWN);
  });

  it("runner/SSRF/timeout → UNKNOWN not HEALTHY", () => {
    assert.equal(
      observationToDisplayHealth({ fresh: true, errorClass: "SSRF_BLOCKED", ok: false }),
      HEALTH.UNKNOWN
    );
    assert.equal(
      observationToDisplayHealth({ fresh: true, errorClass: "RUNNER_ERROR" }),
      HEALTH.UNKNOWN
    );
    assert.equal(
      observationToDisplayHealth({ fresh: true, errorClass: "TIMEOUT", overall: "HEALTHY" }),
      HEALTH.UNKNOWN
    );
  });
});
