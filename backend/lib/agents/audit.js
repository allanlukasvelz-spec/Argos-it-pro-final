/**
 * Phase 7 — agent security audit (redacted).
 */
const SECRET_KEYS = /token|secret|password|authorization|credential|api[_-]?key|private/i;

function redact(value, depth = 0) {
  if (depth > 6) return "[TRUNCATED]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 200) return `${value.slice(0, 40)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEYS.test(k)) out[k] = "[REDACTED]";
      else out[k] = redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

async function recordAgentSecurityEvent(pool, { organizationId, agentId, kind, severity = "INFO", details = {} }) {
  try {
    await pool.query(
      `INSERT INTO agent_security_events (organization_id, agent_id, kind, severity, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        organizationId || null,
        agentId || null,
        String(kind).slice(0, 80),
        severity,
        JSON.stringify(redact(details))
      ]
    );
  } catch (err) {
    console.error("[AGENTS] audit write failed:", err.message);
  }
}

module.exports = { recordAgentSecurityEvent, redact };
