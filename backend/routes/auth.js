const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { authLimiter, validatePassword, validateEmailFormat } = require("../middleware/security");
const { setTokenCookies, clearTokenCookies, REFRESH_COOKIE } = require("../lib/authCookies");
const { ensurePrimaryOrganizationForUser } = require("../lib/ensureOrganizations");

function requireJwtSecret(res) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    res.status(500).json({ error: "JWT_SECRET debe configurarse con minimo 32 caracteres" });
    return false;
  }

  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    res.status(500).json({ error: "JWT_REFRESH_SECRET debe configurarse con minimo 32 caracteres" });
    return false;
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    res.status(500).json({ error: "JWT_SECRET y JWT_REFRESH_SECRET deben ser distintos" });
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

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!validateEmailFormat(normalizedEmail)) {
      return res.status(400).json({ error: "Email no valido" });
    }

    if (password.length < 10) {
      return res.status(400).json({ error: "La contraseña debe tener mínimo 10 caracteres" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users(email, password, name, company) VALUES($1, $2, $3, $4) RETURNING id, email, name, company",
      [normalizedEmail, hash, name || normalizedEmail, String(company || "").trim()]
    );

    const created = result.rows[0];
    try {
      await ensurePrimaryOrganizationForUser(pool, {
        id: created.id,
        company: created.company,
        name: created.name,
        email: created.email
      });
    } catch (orgErr) {
      console.error("[AUTH] No se pudo crear organización primaria:", orgErr.message);
    }

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: { ...created, company: company || "", role: "cliente", clientVerified: false }
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

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!validateEmailFormat(normalizedEmail)) {
      return res.status(400).json({ error: "Email no valido" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    if (result.rows.length === 0) {
      await pool.query(
        "INSERT INTO security_logs(user_id, action, risk_level, details) VALUES($1, $2, $3, $4)",
        [null, "login_failed", "medium", JSON.stringify({ email: normalizedEmail, reason: "user_not_found" })]
      );
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await pool.query(
        "INSERT INTO security_logs(user_id, action, risk_level, details) VALUES($1, $2, $3, $4)",
        [user.id, "login_failed", "medium", JSON.stringify({ email: normalizedEmail, reason: "wrong_password" })]
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

    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_sessions(user_id, jti, expires_at) VALUES($1, $2, $3)",
      [user.id, jti, expiresAt]
    );

    const refreshToken = jwt.sign(
      { id: user.id, jti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Log de login exitoso
    await pool.query(
      "INSERT INTO activity_logs(user_id, action_type) VALUES($1, $2)",
      [user.id, "login_success"]
    );

    setTokenCookies(res, token, refreshToken);

    res.json({
      message: "Login exitoso",
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

// REFRESH TOKEN (rol y email siempre desde BD)
router.post("/refresh", authLimiter, async (req, res) => {
  try {
    if (!requireJwtSecret(res)) return;

    const rawRefresh =
      (req.cookies && req.cookies[REFRESH_COOKIE]) ||
      req.body?.refreshToken;

    if (!rawRefresh) {
      return res.status(400).json({ error: "Refresh token requerido" });
    }

    const decoded = jwt.verify(rawRefresh, process.env.JWT_REFRESH_SECRET);

    if (decoded.jti) {
      const active = await pool.query(
        `SELECT id FROM refresh_sessions
         WHERE user_id = $1 AND jti = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
        [decoded.id, decoded.jti]
      );
      if (active.rows.length === 0) {
        clearTokenCookies(res);
        return res.status(401).json({ error: "Refresh token invalido" });
      }
      await pool.query("UPDATE refresh_sessions SET revoked_at = NOW() WHERE id = $1", [
        active.rows[0].id
      ]);
    }

    const userResult = await pool.query(
      "SELECT id, email, role, client_verified FROM users WHERE id = $1 AND is_active IS NOT FALSE",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      clearTokenCookies(res);
      return res.status(401).json({ error: "Refresh token invalido" });
    }

    const row = userResult.rows[0];
    const role = row.role || "cliente";

    const newAccessToken = jwt.sign(
      { id: row.id, email: row.email, role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    if (decoded.jti) {
      const newJti = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        "INSERT INTO refresh_sessions(user_id, jti, expires_at) VALUES($1, $2, $3)",
        [row.id, newJti, expiresAt]
      );

      pool.query(
        `DELETE FROM refresh_sessions
         WHERE user_id = $1
           AND (expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '1 day'))`,
        [row.id]
      ).catch((err) => console.error("[AUTH] refresh session cleanup error:", err.message));

      const newRefreshToken = jwt.sign({ id: row.id, jti: newJti }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d"
      });

      setTokenCookies(res, newAccessToken, newRefreshToken);
      return res.json({ message: "Token renovado" });
    }

    res.json({ message: "Token renovado" });
  } catch (error) {
    clearTokenCookies(res);
    res.status(401).json({ error: "Refresh token inválido" });
  }
});

// LOGOUT — revoke the refresh session so the token cannot be reused
router.post("/logout", async (req, res) => {
  try {
    const rawRefresh =
      (req.cookies && req.cookies[REFRESH_COOKIE]) ||
      req.body?.refreshToken;

    if (rawRefresh && typeof rawRefresh === "string") {
      const secret = process.env.JWT_REFRESH_SECRET;
      if (secret && secret.length >= 32) {
        let jti;
        try {
          const decoded = jwt.verify(rawRefresh, secret);
          jti = decoded.jti;
        } catch (_verifyErr) {
          // Token invalid/expired — nothing to revoke, logout succeeds
        }

        if (jti) {
          await pool.query(
            "UPDATE refresh_sessions SET revoked_at = NOW() WHERE jti = $1 AND revoked_at IS NULL",
            [jti]
          );
        }
      }
    }

    clearTokenCookies(res);
    res.json({ message: "Sesion cerrada" });
  } catch (error) {
    console.error("[AUTH] Error en logout:", error.message);
    clearTokenCookies(res);
    res.status(503).json({ message: "Sesion cerrada" });
  }
});

module.exports = router;
