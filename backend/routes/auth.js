const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { authLimiter, validatePassword } = require("../middleware/security");

function requireJwtSecret(res) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    res.status(500).json({ error: "JWT_SECRET debe configurarse con minimo 32 caracteres" });
    return false;
  }

  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    res.status(500).json({ error: "JWT_REFRESH_SECRET debe configurarse con minimo 32 caracteres" });
    return false;
  }

  return true;
}

// REGISTRO
router.post("/register", authLimiter, validatePassword, async (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password requeridos" });
    }

    if (password.length < 10) {
      return res.status(400).json({ error: "La contraseña debe tener mínimo 10 caracteres" });
    }

    // Verificar si existe
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    // Hashear password
    const hash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await pool.query(
      "INSERT INTO users(email, password, name, company) VALUES($1, $2, $3, $4) RETURNING id, email, name",
      [email, hash, name || email, company || ""]
    );

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: { ...result.rows[0], company: company || "", role: "cliente", clientVerified: false }
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// LOGIN
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password requeridos" });
    }

    // Buscar usuario
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      // Log de intento fallido
      await pool.query(
        "INSERT INTO security_logs(action, risk_level, details) VALUES($1, $2, $3)",
        ["login_failed", "medium", JSON.stringify({ email, reason: "user_not_found" })]
      );
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    // Verificar password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await pool.query(
        "INSERT INTO security_logs(action, risk_level, details) VALUES($1, $2, $3)",
        ["login_failed", "medium", JSON.stringify({ email, reason: "wrong_password" })]
      );
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar JWT
    if (!requireJwtSecret(res)) return;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || "cliente" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Log de login exitoso
    await pool.query(
      "INSERT INTO activity_logs(user_id, action_type) VALUES($1, $2)",
      [user.id, "login_success"]
    );

    res.json({
      message: "Login exitoso",
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role || "cliente",
        clientVerified: Boolean(user.client_verified)
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// REFRESH TOKEN
router.post("/refresh", authLimiter, (req, res) => {
  try {
    if (!requireJwtSecret(res)) return;

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token requerido" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const newToken = jwt.sign(
      { id: decoded.id, role: decoded.role || "cliente" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: "Refresh token inválido" });
  }
});

module.exports = router;
