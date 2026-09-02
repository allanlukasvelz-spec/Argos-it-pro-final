const express = require("express");
const router = express.Router();
const { handleAssistantChat, healthCheck } = require("../lib/ai/assistantService");

/**
 * POST /api/assistant/chat
 * Body: { message: string, conversationId?: string }
 */
router.post("/chat", async (req, res) => {
  const result = await handleAssistantChat({
    message: req.body?.message,
    conversationId: req.body?.conversationId
  });
  return res.status(result.status).json(result.body);
});

/** Lightweight readiness (no secrets) */
router.get("/health", async (_req, res) => {
  const h = await healthCheck();
  if (!h.ok) {
    return res.status(503).json({
      status: "UNAVAILABLE",
      providerConfigured: false,
      provider: h.provider,
      model: h.model
    });
  }
  return res.json({
    status: "READY",
    providerConfigured: true,
    provider: h.provider,
    model: h.model
  });
});

module.exports = router;
