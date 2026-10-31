const express = require("express");
const router = express.Router();
const pool = require("../db");
const { normalizeChatMessage } = require("../lib/aiMessage");

const CHICO_ACTION_MAX = 200;
const CHICO_DETAILS_MAX_JSON = 4000;
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 45000);

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  // Lazy-load: top-level require("openai") can block process boot in some local envs.
  const OpenAI = require("openai");
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS
  });
}

// Obtener memoria de usuario
async function getMemory(userId, role, limit = 10) {
  const result = await pool.query(
    `SELECT role, message FROM ai_memory 
     WHERE user_id = $1 AND role = $2 
     ORDER BY created_at DESC LIMIT $3`,
    [userId, role, limit]
  );
  return result.rows.reverse();
}

// Guardar en memoria
async function saveMemory(userId, role, message) {
  await pool.query(
    "INSERT INTO ai_memory(user_id, role, message) VALUES($1, $2, $3)",
    [userId, role, message]
  );
}

// DUMBO - Guía UX
router.post("/dumbo", async (req, res) => {
  try {
    const { message: rawMessage } = req.body;
    const { ok, error, message } = normalizeChatMessage(rawMessage);
    if (!ok) {
      return res.status(400).json({ error });
    }
    const userId = req.user.id;

    // Obtener contexto
    const memory = await getMemory(userId, "dumbo");

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres Dumbo 🐘, asistente UX de Argos IT.
Tu objetivo es guiar al usuario paso a paso a través de nuestros servicios.
Sé amable, claro y siempre lleva la conversación hacia completar formularios.
Si el usuario pregunta sobre servicios, recomienda el adecuado.`
        },
        ...memory.map(m => ({ role: "user", content: m.message })),
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0].message.content;

    // Guardar en memoria
    await saveMemory(userId, "dumbo", message);
    await saveMemory(userId, "dumbo", reply);

    res.json({ reply });
  } catch (error) {
    console.error("Error Dumbo:", error);
    res.status(500).json({ error: "Error procesando solicitud" });
  }
});

// CHICO - Seguridad
router.post("/chico", async (req, res) => {
  try {
    const { action: rawAction, details } = req.body;
    if (!rawAction || typeof rawAction !== "string") {
      return res.status(400).json({ error: "El campo action es obligatorio." });
    }
    const action = rawAction.trim().slice(0, CHICO_ACTION_MAX);
    if (!action) {
      return res.status(400).json({ error: "El campo action no puede estar vacio." });
    }

    let detailsPayload = {};
    if (details !== undefined && details !== null) {
      if (typeof details !== "object" || Array.isArray(details)) {
        return res.status(400).json({ error: "El campo details debe ser un objeto." });
      }
      try {
        const json = JSON.stringify(details);
        if (json.length > CHICO_DETAILS_MAX_JSON) {
          return res.status(400).json({ error: "El campo details es demasiado grande." });
        }
        detailsPayload = details;
      } catch {
        return res.status(400).json({ error: "El campo details no es serializable." });
      }
    }

    const userId = req.user.id;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres Chico 🔒, guardián de seguridad de Argos IT.
Tu objetivo es detectar:
- Comportamientos sospechosos
- Errores técnicos
- Riesgos de seguridad
- Intentos de fraude
- Patrones anómalos

Responde en JSON: { "risk_level": "low|medium|high", "alert": "mensaje", "action": "prevención" }`
        },
        {
          role: "user",
          content: `Acción: ${action}\nDetalles: ${JSON.stringify(detailsPayload)}`
        }
      ]
    });

    const rawContent = completion.choices[0]?.message?.content;
    let response;
    try {
      response = JSON.parse(rawContent);
    } catch {
      return res.status(502).json({ error: "Respuesta del modelo no valida" });
    }
    if (!response || typeof response !== "object") {
      return res.status(502).json({ error: "Respuesta del modelo incompleta" });
    }

    const risk =
      ["low", "medium", "high"].includes(String(response.risk_level)) ? response.risk_level : "low";

    await pool.query(
      "INSERT INTO security_logs(user_id, action, risk_level, details) VALUES($1, $2, $3, $4)",
      [userId, action, risk, JSON.stringify(response)]
    );

    res.json(response);
  } catch (error) {
    console.error("Error Chico:", error);
    res.status(500).json({ error: "Error procesando solicitud" });
  }
});

module.exports = router;
