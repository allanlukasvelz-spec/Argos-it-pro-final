const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { setTokenCookies } = require("../authCookies");

function jwtSecretsReady() {
  return Boolean(
    process.env.JWT_SECRET &&
      process.env.JWT_SECRET.length >= 32 &&
      process.env.JWT_REFRESH_SECRET &&
      process.env.JWT_REFRESH_SECRET.length >= 32 &&
      process.env.JWT_SECRET !== process.env.JWT_REFRESH_SECRET
  );
}

async function issueInvitationSession(pool, res, user) {
  if (!jwtSecretsReady()) {
    const err = new Error("JWT no configurado");
    err.status = 500;
    throw err;
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role || "cliente" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(`INSERT INTO refresh_sessions(user_id, jti, expires_at) VALUES ($1, $2, $3)`, [
    user.id,
    jti,
    expiresAt
  ]);
  const refreshToken = jwt.sign({ id: user.id, jti }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  });
  setTokenCookies(res, token, refreshToken);
}

function readSessionFromRequest(req) {
  const token = req.cookies && req.cookies.argos_access;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id || !decoded?.email) return null;
    return { id: Number(decoded.id), email: decoded.email, role: decoded.role || "cliente" };
  } catch {
    return null;
  }
}

module.exports = {
  jwtSecretsReady,
  issueInvitationSession,
  readSessionFromRequest
};
