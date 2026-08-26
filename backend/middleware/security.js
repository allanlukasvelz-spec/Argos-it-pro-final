const rateLimit = require("express-rate-limit");
const { createRegisteredStore } = require("../lib/rateLimitRegistry");
const { authRateLimitKey } = require("../lib/ops/stagingE2eRateLimitKey");

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmailFormat(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length <= 320 && EMAIL_REGEX.test(trimmed);
}

const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false,
  store: createRegisteredStore(),
  message: { error: "Demasiadas solicitudes. Intentalo de nuevo mas tarde." }
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 8),
  standardHeaders: true,
  legacyHeaders: false,
  store: createRegisteredStore(),
  // Staging E2E behind Traefik: isolate via X-Argos-Staging-E2E-Fwd (TEST-NET only).
  // Does not raise max; production ignores the header.
  keyGenerator: authRateLimitKey,
  validate: { keyGeneratorIpFallback: false },
  message: { error: "Demasiados intentos. Intentalo de nuevo en unos minutos." }
});

const aiLimiter = rateLimit({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AI_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  store: createRegisteredStore(),
  message: { error: "Demasiadas solicitudes a la IA. Intentalo de nuevo en unos minutos." }
});

const contactLimiter = rateLimit({
  windowMs: Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000),
  max: Number(process.env.CONTACT_RATE_LIMIT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  store: createRegisteredStore(),
  message: { error: "Demasiadas consultas enviadas desde esta IP." }
});

function detectBot(req, _res, next) {
  const userAgent = String(req.headers["user-agent"] || "");
  const botKeywords = ["bot", "crawler", "spider", "curl", "wget"];

  req.isBot = botKeywords.some((keyword) =>
    userAgent.toLowerCase().includes(keyword)
  );

  if (req.isBot && process.env.LOG_LEVEL !== "silent") {
    console.warn("[SECURITY] Bot detectado:", userAgent);
  }

  next();
}

function validatePassword(req, res, next) {
  const password = req.body?.password;
  if (!password) return next();

  if (password.length < 10) {
    return res.status(400).json({ error: "La contraseña debe tener minimo 10 caracteres." });
  }

  const strongEnough = /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  if (!strongEnough) {
    return res.status(400).json({
      error: "La contraseña debe incluir mayusculas, minusculas y numeros."
    });
  }

  next();
}

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  contactLimiter,
  detectBot,
  validatePassword,
  validateEmailFormat
};
