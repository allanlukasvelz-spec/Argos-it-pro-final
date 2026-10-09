const express = require("express");

const SOURCE_DEFAULT = "diagnostico-argos";
const ALLOWED_RISK_LEVELS = new Set(["low", "medium", "high", "critical"]);
const MAX_SUMMARY = 4000;
const MAX_JSON_STRING = 500;
const MIN_ANSWERS_EXPECTED = 12;
/** Límite de ítems de respuesta incluidos en cada payload (caben ~12 preguntas + margen). */
const MAX_ANSWER_ITEMS = 24;

/** @param {unknown} raw */
function stripUnsafeText(raw, limit = MAX_SUMMARY) {
  const plain = String(raw ?? "")
    .replace(/</g, " ")
    .replace(/>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, limit);
}

/** @param {unknown[]} arr @param {number} maxLen @param {number} maxItems */
function sanitizeStringArray(arr, maxLen, maxItems = 60) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    if (out.length >= maxItems) break;
    const s = stripUnsafeText(item, maxLen);
    if (s) out.push(s);
  }
  return out;
}

/** @param {unknown} body */
function parseAnswers(body) {
  const raw = body?.answers ?? body?.Answers;
  if (!Array.isArray(raw)) return { error: "El campo answers debe ser un array.", answers: [] };
  if (raw.length > MAX_ANSWER_ITEMS) {
    return { error: "demasiadas respuestas en el payload.", answers: [] };
  }
  const answers = [];
  for (let i = 0; i < raw.length; i += 1) {
    const a = raw[i];
    if (!a || typeof a !== "object") continue;
    const questionId = stripUnsafeText(a.questionId ?? a.question_id ?? "", 80);
    const question = stripUnsafeText(a.question ?? "", 580);
    const answerLabel = stripUnsafeText(a.answerLabel ?? a.answer_label ?? "", 220);
    const rp = Number(a.riskPoints ?? a.risk_points);
    if (!questionId || !question || !answerLabel) continue;
    if (!Number.isFinite(rp)) continue;
    const riskPoints = Math.min(2, Math.max(0, Math.round(rp)));
    answers.push({ questionId, question, answerLabel, riskPoints });
  }
  if (answers.length === 0) {
    return { error: "No se encontraron respuestas validas.", answers: [] };
  }
  if (answers.length < MIN_ANSWERS_EXPECTED) {
    return { error: "Encuesta incompleta.", answers: [] };
  }
  return { error: null, answers };
}

/**
 * @param {import("pg").Pool} pool
 */
function createDiagnosticsRouter(pool) {
  const router = express.Router();

  /**
   * Lista diagnósticos del tenant activo.
   */
  router.get("/diagnostics", async (req, res) => {
    try {
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

      const r = await pool.query(
        `SELECT id,
                score,
                max_score,
                risk_level,
                risk_label,
                summary,
                created_at
         FROM client_diagnostics
         WHERE organization_id = $1
         ORDER BY created_at DESC
         LIMIT 40`,
        [orgId]
      );
      const list = r.rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        score: row.score,
        maxScore: row.max_score,
        riskLevel: row.risk_level,
        riskLabel: row.risk_label,
        summaryPreview: String(row.summary || "").slice(0, 320)
      }));
      res.json({ diagnostics: list });
    } catch (error) {
      console.error("[CLIENT] Error listando diagnostics:", error);
      res.status(500).json({ error: "No se pudieron recuperar tus diagnosticos." });
    }
  });

  /**
   * Detalle scoped por organization_id (IDOR → 404).
   */
  router.get("/diagnostics/:id", async (req, res) => {
    try {
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

      const rawId = req.params.id;
      const id = Number.parseInt(String(rawId), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT id, created_at, source, score, max_score,
                risk_level, risk_label, summary,
                strengths, risks, priorities, answers, organization_id
         FROM client_diagnostics
         WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Diagnostico no encontrado." });
      }
      const row = r.rows[0];
      res.json({
        id: String(row.id),
        organizationId: String(orgId),
        createdAt: row.created_at,
        source: row.source || SOURCE_DEFAULT,
        score: row.score,
        maxScore: row.max_score,
        riskLevel: row.risk_level,
        riskLabel: row.risk_label,
        summary: row.summary,
        strengths: Array.isArray(row.strengths) ? row.strengths : [],
        risks: Array.isArray(row.risks) ? row.risks : [],
        priorities: Array.isArray(row.priorities) ? row.priorities : [],
        answers: Array.isArray(row.answers) ? row.answers : []
      });
    } catch (error) {
      console.error("[CLIENT] Error detalle diagnostics:", error);
      res.status(500).json({ error: "No se pudo cargar el diagnostico." });
    }
  });

  /**
   * Alta — organization_id forzados desde sesión; body.organization_id ignorado.
   */
  router.post("/diagnostics", async (req, res) => {
    try {
      const userId = req.user.id;
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

      const body = req.body ?? {};

      const source = stripUnsafeText(body.source || SOURCE_DEFAULT, 80) || SOURCE_DEFAULT;
      let score = Number(body.score ?? body.points);
      let maxScore = Number(body.maxScore ?? body.max_score ?? 24);
      if (!Number.isFinite(score) || !Number.isFinite(maxScore)) {
        return res.status(400).json({ error: "Puntuacion invalida." });
      }
      maxScore = Math.min(999, Math.max(1, Math.round(maxScore)));
      score = Math.min(maxScore, Math.max(0, Math.round(score)));

      const rl = String(body.riskLevel ?? body.risk_level ?? "").trim();
      const risk_level = ALLOWED_RISK_LEVELS.has(rl) ? rl : "";
      if (!risk_level) {
        return res.status(400).json({ error: "Nivel de riesgo invalido." });
      }

      const risk_label = stripUnsafeText(body.riskLabel ?? body.risk_label ?? "", 80);
      if (!risk_label) {
        return res.status(400).json({ error: "Etiqueta de riesgo requerida." });
      }

      const summary = stripUnsafeText(body.summary ?? body.levelSummary, MAX_SUMMARY);
      if (!summary) {
        return res.status(400).json({ error: "Resumen obligatorio." });
      }

      const strengths = sanitizeStringArray(body.strengths, MAX_JSON_STRING, 35);
      const risks = sanitizeStringArray(body.risks ?? body.risksDetected, MAX_JSON_STRING, 40);
      const priorities = sanitizeStringArray(body.priorities, MAX_JSON_STRING, 35);

      const parsed = parseAnswers(body);
      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }

      const ins = await pool.query(
        `INSERT INTO client_diagnostics
         (user_id, organization_id, source, score, max_score, risk_level, risk_label,
          summary, strengths, risks, priorities, answers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb)
         RETURNING id, created_at, organization_id`,
        [
          userId,
          orgId,
          source,
          score,
          maxScore,
          risk_level,
          risk_label,
          summary,
          JSON.stringify(strengths),
          JSON.stringify(risks),
          JSON.stringify(priorities),
          JSON.stringify(parsed.answers)
        ]
      );

      const row = ins.rows[0];
      await pool.query(
        `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
         VALUES($1, $2, $3, $4)`,
        [userId, orgId, "diagnostic_argos_saved", JSON.stringify({ id: row.id, score, risk_level })]
      );

      res.status(201).json({
        diagnostic: {
          id: String(row.id),
          organizationId: String(orgId),
          createdAt: row.created_at,
          source,
          score,
          maxScore,
          riskLevel: risk_level,
          riskLabel: risk_label,
          summary,
          strengths,
          risks,
          priorities,
          answers: parsed.answers
        }
      });
    } catch (error) {
      console.error("[CLIENT] Error guardando diagnostic:", error);
      res.status(500).json({ error: "No se pudo guardar el diagnostico. Intentalo mas tarde." });
    }
  });

  return router;
}

module.exports = createDiagnosticsRouter;
module.exports.createDiagnosticsRouter = createDiagnosticsRouter;
