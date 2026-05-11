const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { normalizeChatMessage } = require("../lib/aiMessage");

const DUMBO_SYSTEM = `Eres Dumbo, perro guía de ARGOS-IT en la web pública. Tono cálido, claro y profesional.
Ayudas a visitantes con consultoría IT, mantenimiento informático, seguridad, web, WordPress y automatización.
Respuestas concisas (2–6 frases salvo que pidan detalle). No inventes precios ni compromisos legales.
Si algo requiere dato concreto o contrato, invita a usar el formulario de contacto del sitio.`;

const CHICO_SYSTEM = `Eres Chico, perro guardián de ARGOS-IT en la web pública. Tono sereno, seguro y profesional.
Enfocado en seguridad digital, continuidad, copias de seguridad, accesos, buenas prácticas y reducción de riesgos.
Respuestas concisas (2–6 frases). No alarmes ni alarmismo; no inventes incidentes ni vulnerabilidades concretas.
Si hace falta intervención o diagnóstico real, recomienda contactar con ARGOS-IT por el formulario de contacto.`;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("OPENAI_API_KEY no configurada");
    err.code = "NO_OPENAI_KEY";
    throw err;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * @param {"dumbo"|"chico"} persona
 * @param {string} message
 * @returns {Promise<string>}
 */
async function completeMascotChat(persona, message) {
  const openai = getOpenAIClient();
  const system = persona === "chico" ? CHICO_SYSTEM : DUMBO_SYSTEM;
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: message }
    ]
  });
  return completion.choices[0].message.content;
}

async function handleMascotChat(req, res, persona) {
  const { message: rawMessage } = req.body;
  const { ok, error, message } = normalizeChatMessage(rawMessage);
  if (!ok) {
    return res.status(400).json({ error });
  }

  try {
    const reply = await completeMascotChat(persona, message);
    return res.json({ reply });
  } catch (err) {
    if (err.code === "NO_OPENAI_KEY") {
      console.warn("[mascot-chat] OPENAI_API_KEY no configurada");
      return res.status(503).json({ error: "assistant_unavailable", message: err.message });
    }
    console.error("[mascot-chat]", err);
    return res.status(500).json({ error: "Error procesando solicitud" });
  }
}

/** POST body: { message, persona: "dumbo" | "chico" } */
router.post("/mascot-chat", (req, res) => {
  const raw = req.body?.persona;
  const persona = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (persona !== "dumbo" && persona !== "chico") {
    return res.status(400).json({ error: 'El campo persona debe ser "dumbo" o "chico".' });
  }
  return handleMascotChat(req, res, persona);
});

/** Compatibilidad: mismo comportamiento que mascot-chat con Dumbo */
router.post("/dumbo-chat", (req, res) => handleMascotChat(req, res, "dumbo"));

module.exports = router;
