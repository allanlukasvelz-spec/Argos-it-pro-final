const express = require("express");
const rateLimit = require("express-rate-limit");
const { contactLimiter } = require("../middleware/security");
const { createChallenge, verifyChallenge } = require("../lib/contactCaptcha");
const { validateContactBody } = require("../lib/validateContact");
const { acceptQaMessage, isQaTransport } = require("../lib/email/qaOutbox");
const { resolveEmailTransport } = require("../lib/email/transport");
const { createSmtpTransport } = require("../lib/email/smtpTransport");
const { contactText, responseForSmtp } = require("../lib/email/contactDispatch");

const router = express.Router();

const challengeLimiter = rateLimit({
  windowMs: Number(process.env.CONTACT_CHALLENGE_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.CONTACT_CHALLENGE_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de verificacion. Intentalo de nuevo mas tarde." }
});

const CAPTCHA_ERROR =
  "La respuesta de verificación no es correcta. Inténtalo de nuevo.";

router.get("/challenge", challengeLimiter, (_req, res) => {
  res.json(createChallenge());
});

router.post("/", contactLimiter, async (req, res) => {
  try {
    const validation = validateContactBody(req.body);
    if (validation.honeypot) {
      return res.status(200).json({ message: "Consulta enviada correctamente." });
    }

    if (validation.errors.length) {
      return res.status(400).json({ error: "Revisa los campos obligatorios del formulario." });
    }

    const captcha = verifyChallenge(req.body.challengeId, req.body.captchaAnswer);
    if (!captcha.ok) {
      return res.status(400).json({ error: CAPTCHA_ERROR, code: "CAPTCHA_INVALID" });
    }

    const payload = validation.payload;
    if (isQaTransport()) {
      acceptQaMessage({
        kind: "contact",
        to: null,
        subject: "Nueva consulta desde ARGOS-IT",
        text: payload.message
      });
      return res.status(202).json({
        message: "Consulta aceptada en el transporte de prueba. No se ha entregado a un destinatario real.",
        dispatch: "qa",
        delivered: false
      });
    }

    if (resolveEmailTransport().mode === "smtp") {
      const result = await createSmtpTransport().send({
        kind: "contact",
        replyTo: payload.email,
        subject: "Nueva consulta desde ARGOS-IT",
        text: contactText(payload)
      });
      const response = responseForSmtp(result);
      if (response.status >= 500) {
        console.error("[CONTACT] SMTP", result.reason);
      }
      return res.status(response.status).json(response.body);
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

    res.json({
      message: "Consulta aceptada por el enlace configurado. La entrega al buzón no está confirmada.",
      delivered: false
    });
  } catch (error) {
    console.error("[CONTACT] Error", error && error.code ? error.code : "CONTACT_FAILED");
    res.status(500).json({ error: "Error procesando la consulta." });
  }
});

module.exports = router;
