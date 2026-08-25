/**
 * Phase 5 — explicit internal NOC authorization.
 * Only users.role admin | super_admin. org_admin NEVER grants NOC.
 */
const { isGlobalArgosAdmin } = require("../lib/ensureOrganizations");

const NOC_ROLES = ["admin", "super_admin"];

function requireNocAccess(req, res, next) {
  const role = req.user?.role || "cliente";
  if (!isGlobalArgosAdmin(role) || !NOC_ROLES.includes(role)) {
    return res.status(403).json({
      error: "Acceso NOC denegado",
      code: "NOC_FORBIDDEN"
    });
  }
  next();
}

module.exports = requireNocAccess;
module.exports.NOC_ROLES = NOC_ROLES;
