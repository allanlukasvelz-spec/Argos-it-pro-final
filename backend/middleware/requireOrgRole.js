/**
 * Organization-role gate for Web Projects (and future scoped modules).
 * Uses req.tenant.orgRole from tenantContext. Does not change global users.role.
 * Does not grant NOC access.
 */
function requireOrgRole(allowedRoles) {
  const allowed = new Set(allowedRoles);

  return function requireOrgRoleMiddleware(req, res, next) {
    const orgRole = req.tenant?.orgRole;
    if (!orgRole || !allowed.has(orgRole)) {
      return res.status(403).json({
        error: "Rol de organización insuficiente",
        code: "FORBIDDEN"
      });
    }
    return next();
  };
}

module.exports = requireOrgRole;
