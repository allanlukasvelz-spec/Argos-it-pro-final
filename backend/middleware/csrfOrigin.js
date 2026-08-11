const { ACCESS_COOKIE, REFRESH_COOKIE } = require("../lib/authCookies");

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function csrfOriginGuard(allowedOrigins) {
  const originSet = new Set(allowedOrigins);

  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) {
      return next();
    }

    const hasCookieAuth =
      Boolean(req.cookies && (req.cookies[ACCESS_COOKIE] || req.cookies[REFRESH_COOKIE]));

    if (!hasCookieAuth) {
      return next();
    }

    const origin = req.headers.origin;
    if (!origin || !originSet.has(origin)) {
      return res.status(403).json({ error: "Origen no permitido" });
    }

    next();
  };
}

module.exports = csrfOriginGuard;
