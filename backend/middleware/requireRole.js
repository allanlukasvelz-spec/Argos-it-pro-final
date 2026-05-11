/**
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles) {
  const set = new Set(allowedRoles);

  return (req, res, next) => {
    const role = req.user?.role || "cliente";
    if (!set.has(role)) {
      return res.status(403).json({ error: "No autorizado para esta operacion" });
    }
    next();
  };
}

module.exports = requireRole;
