/**
 * Tenant context middleware (Phase 0).
 * organization_id must come from authenticated membership — never trust body/query alone.
 */
const {
  listMembershipsForUser,
  resolveActiveOrganization,
  isGlobalArgosAdmin
} = require("../lib/ensureOrganizations");

/**
 * After auth middleware. Attaches:
 *   req.tenant = { id, slug, name, status, orgRole } | null
 *   req.tenantMemberships = [...]
 *   req.isGlobalArgosAdmin = boolean
 *
 * Optional header X-Argos-Organization-Id is honored ONLY if user is a member.
 */
function resolveTenantContext(pool) {
  return async function tenantContext(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Token requerido" });
      }

      const globalRole = req.user?.role || "cliente";
      req.isGlobalArgosAdmin = isGlobalArgosAdmin(globalRole);

      const memberships = await listMembershipsForUser(pool, userId);
      req.tenantMemberships = memberships;

      const requested =
        req.headers["x-argos-organization-id"] ??
        req.query?.organizationId ??
        null;

      // Never take organizationId from body for mutations without membership check —
      // resolveActiveOrganization only accepts ids present in memberships.
      const tenant = resolveActiveOrganization(memberships, requested);
      req.tenant = tenant;

      if (!tenant && !req.isGlobalArgosAdmin) {
        const hasInactiveOnly =
          Array.isArray(memberships) &&
          memberships.length > 0 &&
          memberships.every((m) => String(m.status || "").toLowerCase() !== "active");
        return res.status(403).json({
          error: hasInactiveOnly
            ? "Organización inactiva o suspendida"
            : "Usuario sin organización asignada",
          code: hasInactiveOnly ? "INACTIVE_ORGANIZATION" : "NO_ORGANIZATION_MEMBERSHIP"
        });
      }

      next();
    } catch (err) {
      console.error("[TENANT] resolveTenantContext:", err.message);
      return res.status(500).json({ error: "Error resolviendo contexto de organización" });
    }
  };
}

/**
 * Require an active tenant (clients). Global ARGOS admins may proceed without tenant
 * only when allowGlobalWithoutTenant=true (admin cross-tenant routes).
 */
function requireTenant(options = {}) {
  const allowGlobalWithoutTenant = Boolean(options.allowGlobalWithoutTenant);

  return function requireTenantMiddleware(req, res, next) {
    if (req.tenant?.id) {
      return next();
    }
    if (allowGlobalWithoutTenant && req.isGlobalArgosAdmin) {
      return next();
    }
    return res.status(403).json({
      error: "Contexto de organización requerido",
      code: "TENANT_REQUIRED"
    });
  };
}

module.exports = {
  resolveTenantContext,
  requireTenant
};
