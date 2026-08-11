const jwt = require("jsonwebtoken");

const ACCESS_COOKIE = "argos_access";

module.exports = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("[AUTH] JWT_SECRET no configurado o demasiado corto.");
      return res.status(500).json({ error: "Configuracion de autenticacion incompleta" });
    }

    const raw = req.cookies && req.cookies[ACCESS_COOKIE];

    if (!raw) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const decoded = jwt.verify(raw, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
