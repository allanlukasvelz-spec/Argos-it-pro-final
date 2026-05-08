const express = require("express");
const router = express.Router();
const pool = require("../db");

// Dashboard de seguridad
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user.id;

    // Últimos logs del usuario
    const logs = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    // Alertas de seguridad
    const alerts = await pool.query(
      `SELECT * FROM security_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    res.json({
      activity: logs.rows,
      alerts: alerts.rows,
      riskLevel: alerts.rows.some(a => a.risk_level === "high") ? "high" : "low"
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo dashboard" });
  }
});

// Estadísticas de seguridad
router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        risk_level,
        COUNT(*) as count
      FROM security_logs
      GROUP BY risk_level
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

module.exports = router;
