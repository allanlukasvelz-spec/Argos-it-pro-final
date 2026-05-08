const express = require("express");
const pool = require("../db");

const router = express.Router();

function clean(value = "", limit = 2000) {
  return String(value).trim().slice(0, limit);
}

async function notifyFormspree(subject, payload) {
  const endpoint = process.env.CONTACT_FORM_ENDPOINT;
  if (!endpoint) return;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ _subject: subject, ...payload })
  });

  if (!response.ok) {
    console.error("[CLIENT] Error notificando a Formspree:", response.status);
  }
}

router.get("/portal", async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      "SELECT id, email, name, company, created_at FROM users WHERE id = $1",
      [userId]
    );

    const submissions = await pool.query(
      `SELECT id, data, status, created_at
       FROM form_submissions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 12`,
      [userId]
    );

    const activity = await pool.query(
      `SELECT id, action_type, details, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      user: userResult.rows[0],
      clientVerified: true,
      websiteAudit: {
        status: "pendiente_de_revision",
        score: 82,
        checks: [
          { label: "SEO tecnico", status: "mejorable" },
          { label: "Rendimiento movil", status: "correcto" },
          { label: "Seguridad WordPress", status: "prioritario" },
          { label: "Captacion B2B", status: "mejorable" }
        ]
      },
      suggestedImprovements: [
        "Revisar Core Web Vitals y compresion de assets.",
        "Activar backups automaticos y politica de actualizaciones.",
        "Completar datos legales y banner de cookies si hay analitica.",
        "Crear formularios segmentados por seguridad, soporte, IA y WordPress."
      ],
      submissions: submissions.rows,
      activity: activity.rows
    });
  } catch (error) {
    console.error("[CLIENT] Error portal:", error);
    res.status(500).json({ error: "Error obteniendo portal de cliente" });
  }
});

router.post("/improvements", async (req, res) => {
  try {
    const userId = req.user.id;
    const data = {
      type: "improvement_request",
      category: clean(req.body.category, 120),
      priority: clean(req.body.priority, 60),
      pageUrl: clean(req.body.pageUrl, 500),
      title: clean(req.body.title, 180),
      message: clean(req.body.message),
      source: "client_dashboard"
    };

    if (!data.category || !data.title || !data.message) {
      return res.status(400).json({ error: "Categoria, titulo y mensaje son obligatorios." });
    }

    const result = await pool.query(
      "INSERT INTO form_submissions(user_id, data, status) VALUES($1, $2, $3) RETURNING id, status, created_at",
      [userId, JSON.stringify(data), "pending"]
    );

    await pool.query(
      "INSERT INTO activity_logs(user_id, action_type, details) VALUES($1, $2, $3)",
      [userId, "improvement_request_created", JSON.stringify(data)]
    );

    await notifyFormspree("Nueva mejora solicitada desde portal ARGOS-IT", data);

    res.status(201).json({
      message: "Mejora enviada correctamente.",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("[CLIENT] Error mejora:", error);
    res.status(500).json({ error: "Error enviando la mejora." });
  }
});

router.post("/messages", async (req, res) => {
  try {
    const userId = req.user.id;
    const data = {
      type: "direct_message",
      subject: clean(req.body.subject, 180),
      urgency: clean(req.body.urgency, 60),
      message: clean(req.body.message),
      source: "client_dashboard"
    };

    if (!data.subject || !data.message) {
      return res.status(400).json({ error: "Asunto y mensaje son obligatorios." });
    }

    const result = await pool.query(
      "INSERT INTO form_submissions(user_id, data, status) VALUES($1, $2, $3) RETURNING id, status, created_at",
      [userId, JSON.stringify(data), "pending"]
    );

    await pool.query(
      "INSERT INTO activity_logs(user_id, action_type, details) VALUES($1, $2, $3)",
      [userId, "direct_message_created", JSON.stringify(data)]
    );

    await notifyFormspree("Nuevo mensaje directo desde portal ARGOS-IT", data);

    res.status(201).json({
      message: "Mensaje enviado correctamente.",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("[CLIENT] Error mensaje:", error);
    res.status(500).json({ error: "Error enviando el mensaje." });
  }
});

module.exports = router;
