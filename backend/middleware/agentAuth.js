/**
 * Phase 7 — authenticate technical agent credential (Bearer agentId.secret).
 */
const { resolveAgentAuth } = require("../lib/agents/service");

function agentAuth(pool) {
  return async function agentAuthMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization || req.headers["x-argos-agent-credential"];
      if (!header) {
        return res.status(401).json({ error: "Agent credential required", code: "AGENT_AUTH_REQUIRED" });
      }
      const agent = await resolveAgentAuth(pool, header);
      req.agent = agent;
      next();
    } catch (err) {
      const code = err.code || "AGENT_AUTH_FAIL";
      const status = code === "AGENT_REVOKED" ? 401 : 401;
      return res.status(status).json({ error: "Unauthorized agent", code });
    }
  };
}

module.exports = agentAuth;
