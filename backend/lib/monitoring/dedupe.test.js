/**
 * Phase 3 — alert/incident dedupe with fake pool.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { applyObservationToAlerts, buildFingerprint } = require("./alertEngine");
const { maybeOpenIncidentFromAlert, correlationKey } = require("./incidentEngine");
const { ERROR_CLASS } = require("./constants");

function makePool() {
  const state = { alerts: [], incidents: [], events: [] };
  let alertSeq = 1;
  let incidentSeq = 1;
  let eventSeq = 1;

  return {
    _state: state,
    async query(sql, params = []) {
      const s = String(sql).replace(/\s+/g, " ");

      if (s.includes("SELECT * FROM alerts") && s.includes("fingerprint")) {
        return {
          rows: state.alerts.filter(
            (a) =>
              a.organization_id === params[0] &&
              a.fingerprint === params[1] &&
              ["OPEN", "ACKNOWLEDGED"].includes(a.state)
          )
        };
      }

      if (s.includes("UPDATE alerts SET") && s.includes("count = count + 1")) {
        const row = state.alerts.find((a) => a.id === params[4] && a.organization_id === params[5]);
        row.count += 1;
        row.severity = params[0];
        row.observation_id = params[1];
        row.evidence = JSON.parse(params[2]);
        row.reason = params[3];
        return { rows: [row] };
      }

      if (s.includes("INSERT INTO alerts")) {
        const row = {
          id: alertSeq++,
          organization_id: params[0],
          asset_id: params[1],
          monitor_id: params[2],
          severity: params[3],
          state: "OPEN",
          fingerprint: params[4],
          title: params[5],
          reason: params[6],
          evidence: JSON.parse(params[7]),
          observation_id: params[8],
          count: 1
        };
        state.alerts.push(row);
        return { rows: [row] };
      }

      if (s.includes("UPDATE alerts SET state = 'RESOLVED'")) {
        for (const a of state.alerts) {
          if (a.organization_id === params[0] && a.monitor_id === params[1]) a.state = "RESOLVED";
        }
        return { rows: [] };
      }

      if (s.includes("SELECT * FROM incidents") && s.includes("correlation_key")) {
        return {
          rows: state.incidents.filter(
            (i) =>
              i.organization_id === params[0] &&
              i.correlation_key === params[1] &&
              ["OPEN", "INVESTIGATING", "MITIGATED"].includes(i.state)
          )
        };
      }

      if (s.includes("INSERT INTO incidents")) {
        const row = {
          id: incidentSeq++,
          organization_id: params[0],
          asset_id: params[1],
          title: params[2],
          summary: params[3],
          severity: "CRITICAL",
          state: "OPEN",
          correlation_key: params[4]
        };
        state.incidents.push(row);
        return { rows: [row] };
      }

      if (s.includes("UPDATE incidents SET updated_at")) {
        return { rows: [] };
      }

      if (s.includes("INSERT INTO incident_events")) {
        // SQL: VALUES ($1, $2, 'KIND', $3::jsonb) — kind is literal, payload is $3
        const kindMatch = s.match(/'([A-Z_]+)'/);
        state.events.push({
          id: eventSeq++,
          incident_id: params[0],
          organization_id: params[1],
          kind: kindMatch ? kindMatch[1] : "UNKNOWN",
          payload: typeof params[2] === "string" ? JSON.parse(params[2]) : params[2]
        });
        return { rows: [] };
      }

      throw new Error(`Unhandled SQL: ${s.slice(0, 140)}`);
    }
  };
}

describe("alert/incident dedupe", () => {
  it("repeated identical observations update same alert", async () => {
    const pool = makePool();
    const obs = {
      id: 1,
      ok: false,
      error_class: ERROR_CLASS.HTTP_5XX,
      evidence: {}
    };
    const first = await applyObservationToAlerts(pool, {
      organizationId: 1,
      monitorId: 10,
      assetId: 5,
      observation: obs,
      hostname: "a.example",
      monitorType: "HTTP"
    });
    assert.equal(first.created, true);

    const second = await applyObservationToAlerts(pool, {
      organizationId: 1,
      monitorId: 10,
      assetId: 5,
      observation: { ...obs, id: 2 },
      hostname: "a.example",
      monitorType: "HTTP"
    });
    assert.equal(second.updated, true);
    assert.equal(second.created, false);
    assert.equal(pool._state.alerts.length, 1);
    assert.equal(pool._state.alerts[0].count, 2);
  });

  it("different tenants do not share fingerprints", () => {
    assert.notEqual(
      buildFingerprint(1, 10, ERROR_CLASS.HTTP_5XX),
      buildFingerprint(2, 10, ERROR_CLASS.HTTP_5XX)
    );
  });

  it("CRITICAL alerts correlate to one open incident", async () => {
    const pool = makePool();
    const alert = {
      id: 99,
      organization_id: 1,
      asset_id: 5,
      severity: "CRITICAL",
      state: "OPEN",
      fingerprint: buildFingerprint(1, 10, ERROR_CLASS.HTTP_5XX),
      title: "HTTP 5xx",
      reason: ERROR_CLASS.HTTP_5XX,
      count: 1
    };
    const a = await maybeOpenIncidentFromAlert(pool, {
      organizationId: 1,
      alert,
      hostname: "a.example"
    });
    assert.equal(a.created, true);

    const b = await maybeOpenIncidentFromAlert(pool, {
      organizationId: 1,
      alert: { ...alert, id: 100, count: 2 },
      hostname: "a.example"
    });
    assert.equal(b.created, false);
    assert.equal(b.updated, true);
    assert.equal(pool._state.incidents.length, 1);
    assert.equal(correlationKey(5, ERROR_CLASS.HTTP_5XX), "asset:5|ec:HTTP_5XX");
  });
});
