/**
 * Phase 6 — ensure runbooks/remediation tables + seed safe templates.
 */
const fs = require("fs");
const path = require("path");

const SEED_RUNBOOKS = [
  {
    slug: "http-availability-investigation",
    name: "HTTP availability investigation",
    description: "Deterministic L0 chain for HTTP unavailable signals. No restarts.",
    applies_to: { signals: ["HTTP_UNAVAILABLE", "HTTP_5XX", "HTTP_TIMEOUT"], assetTypes: ["WEBSITE", "API"] },
    automation_max_level: 0,
    steps: {
      signal: "HTTP unavailable",
      evidence_expected: ["last checks", "error_class", "DNS/TLS context"],
      hypothesis: "Origin or path failure — confirm with typed probes",
      preconditions: ["asset active", "HTTP monitor enabled"],
      A: {
        action_type: "HTTP_RECHECK",
        expected_result: "Fresh HTTP observation recorded",
        failure_signals: ["probe fails", "runner error"],
        verification: "monitor_check finished"
      },
      B: {
        action_type: "DNS_RECHECK",
        expected_result: "DNS observation recorded",
        failure_signals: ["NXDOMAIN", "resolve fail"],
        verification: "monitor_check finished"
      },
      C: {
        action_type: "MONITOR_RECHECK",
        expected_result: "Additional evidence",
        failure_signals: ["still failing"],
        verification: "monitor_check finished"
      },
      on_exhausted: "SAFE_STOP / human escalation",
      rollback: "N/A (L0)"
    }
  },
  {
    slug: "tls-expiry-investigation",
    name: "TLS expiry / mismatch investigation",
    description: "L0 TLS recheck then DNS relation evidence. No auto-renewal.",
    applies_to: { signals: ["TLS_EXPIRING", "TLS_EXPIRED", "HOSTNAME_MISMATCH"], assetTypes: ["WEBSITE", "DOMAIN"] },
    automation_max_level: 0,
    steps: {
      signal: "TLS warning/critical",
      A: {
        action_type: "TLS_RECHECK",
        expected_result: "Fresh certificate evidence",
        failure_signals: ["still EXPIRING/EXPIRED/MISMATCH"]
      },
      B: {
        action_type: "DNS_RECHECK",
        expected_result: "Hostname/DNS relation evidence"
      },
      C: {
        action_type: "INCIDENT_EVIDENCE_REFRESH",
        expected_result: "Human remediation plan evidence appended"
      },
      on_exhausted: "SAFE_STOP — no cert mutation in Phase 6",
      rollback: "N/A (L0/L1)"
    }
  },
  {
    slug: "dns-resolution-investigation",
    name: "DNS resolution investigation",
    description: "L0 DNS recheck and evidence refresh. No DNS writes.",
    applies_to: { signals: ["DNS_NXDOMAIN", "DNS_FAIL"], assetTypes: ["DOMAIN"] },
    automation_max_level: 0,
    steps: {
      signal: "DNS resolution failure/drift",
      A: { action_type: "DNS_RECHECK", expected_result: "Fresh DNS answers" },
      B: { action_type: "INCIDENT_EVIDENCE_REFRESH", expected_result: "Evidence snapshot" },
      C: { action_type: "HEALTH_REEVALUATE", expected_result: "Health recompute (may stay UNKNOWN)" },
      on_exhausted: "SAFE_STOP / human escalation",
      rollback: "N/A"
    }
  },
  {
    slug: "monitor-runner-failure-investigation",
    name: "Monitor runner failure investigation",
    description: "Do not escalate target to CRITICAL solely because ARGOS runner failed.",
    applies_to: { signals: ["RUNNER_ERROR", "MONITOR_ERROR"], assetTypes: ["*"] },
    automation_max_level: 1,
    steps: {
      signal: "monitor execution failed",
      A: { action_type: "MONITOR_RECHECK", expected_result: "Second runner attempt" },
      B: { action_type: "HEALTH_REEVALUATE", expected_result: "Health may remain UNKNOWN" },
      C: { action_type: "INCIDENT_EVIDENCE_REFRESH", expected_result: "Escalate with evidence" },
      on_exhausted: "SAFE_STOP — platform/runner issue",
      note: "Runner failure ≠ customer CRITICAL"
    }
  },
  {
    slug: "simulator-reversible-demo",
    name: "Simulator reversible demo (test only)",
    description: "L2 TEST_SET_FLAG against remediation_test_flags only.",
    applies_to: { signals: ["SIMULATOR"], assetTypes: ["*"] },
    automation_max_level: 2,
    steps: {
      signal: "simulator",
      A: {
        action_type: "TEST_SET_FLAG",
        expected_result: "flag set",
        rollback: "restore previous flag"
      },
      B: { action_type: "TEST_INCREMENT_VERSION", expected_result: "version++" },
      C: { action_type: "TEST_RESTORE_VERSION", expected_result: "version restored" },
      on_exhausted: "SAFE_STOP"
    }
  }
];

async function ensureRemediationTables(pool) {
  const migrationPath = path.join(
    __dirname,
    "../../../database/migrations/004_runbooks_remediation.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  // Strip BEGIN/COMMIT for nested-safe execution — run statements via pool
  await pool.query(sql);

  for (const rb of SEED_RUNBOOKS) {
    const existing = await pool.query(`SELECT id FROM runbooks WHERE slug = $1`, [rb.slug]);
    let runbookId;
    if (existing.rows[0]) {
      runbookId = existing.rows[0].id;
      await pool.query(
        `UPDATE runbooks SET name = $2, description = $3, applies_to = $4::jsonb,
           automation_max_level = $5, status = 'ACTIVE', updated_at = NOW()
         WHERE id = $1`,
        [
          runbookId,
          rb.name,
          rb.description,
          JSON.stringify(rb.applies_to),
          rb.automation_max_level
        ]
      );
    } else {
      const ins = await pool.query(
        `INSERT INTO runbooks (slug, name, description, status, applies_to, automation_max_level)
         VALUES ($1,$2,$3,'ACTIVE',$4::jsonb,$5) RETURNING id`,
        [
          rb.slug,
          rb.name,
          rb.description,
          JSON.stringify(rb.applies_to),
          rb.automation_max_level
        ]
      );
      runbookId = ins.rows[0].id;
    }
    const ver = await pool.query(
      `SELECT id FROM runbook_versions WHERE runbook_id = $1 AND version = 1`,
      [runbookId]
    );
    if (!ver.rows[0]) {
      await pool.query(
        `INSERT INTO runbook_versions (runbook_id, version, steps, changelog)
         VALUES ($1, 1, $2::jsonb, 'Phase 6 seed')`,
        [runbookId, JSON.stringify(rb.steps)]
      );
    }
  }
}

module.exports = { ensureRemediationTables, SEED_RUNBOOKS };
