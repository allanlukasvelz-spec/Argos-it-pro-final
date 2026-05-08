const express = require("express");
const { contactLimiter } = require("../middleware/security");

const router = express.Router();

function clean(value = "") {
  return String(value).trim().slice(0, 2000);
}

router.post("/", contactLimiter, async (req, res) => {
  try {
    const payload = {
      name: clean(req.body.name),
      email: clean(req.body.email),
      company: clean(req.body.company),
      phone: clean(req.body.phone),
      service: clean(req.body.service),
      message: clean(req.body.message)
    };

    if (!payload.name || !payload.email || !payload.message) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios." });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
    if (!emailOk) {
      return res.status(400).json({ error: "Email no valido." });
    }

    const endpoint = process.env.CONTACT_FORM_ENDPOINT;
    if (!endpoint) {
      console.warn("[CONTACT] CONTACT_FORM_ENDPOINT no configurado.");
      return res.status(202).json({
        message: "Consulta validada. Configura CONTACT_FORM_ENDPOINT para enviarla a Formspree."
      });
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        _subject: "Nueva consulta desde ARGOS-IT"
      })
    });

    if (!response.ok) {
      console.error("[CONTACT] Error Formspree:", response.status);
      return res.status(502).json({ error: "No se pudo enviar la consulta." });
    }

    res.json({ message: "Consulta enviada correctamente." });
  } catch (error) {
    console.error("[CONTACT] Error:", error);
    res.status(500).json({ error: "Error procesando la consulta." });
  }
});

module.exports = router;
