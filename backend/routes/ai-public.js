const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Dumbo público (sin autenticación)
router.post("/dumbo-chat", async (req, res) => {
  try {
    const { message } = req.body;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Eres Dumbo 🐘, asistente de bienvenida de Argos IT.
Eres amable, entusiasta y ayudas a nuevos visitantes.
Puedes responder preguntas sobre nuestros servicios de tecnología e innovación.`
        },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error procesando solicitud" });
  }
});

module.exports = router;
