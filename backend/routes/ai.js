const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const pool = require("../db");

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const { message } = req.body;
    const userId = req.user.id;

    // Obtener contexto
    const memory = await getMemory(userId, "dumbo");

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
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
    const { action, details } = req.body;
    const userId = req.user.id;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
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
          content: `Acción: ${action}\nDetalles: ${JSON.stringify(details)}`
        }
      ]
    });

    const response = JSON.parse(completion.choices[0].message.content);

    // Log de seguridad
    await pool.query(
      "INSERT INTO security_logs(user_id, action, risk_level, details) VALUES($1, $2, $3, $4)",
      [userId, action, response.risk_level, JSON.stringify(response)]
    );

    res.json(response);
  } catch (error) {
    console.error("Error Chico:", error);
    res.status(500).json({ error: "Error procesando solicitud" });
  }
});

module.exports = router;
