const express = require("express");

const PORTAL_ROLES = ["visitante", "cliente", "cliente_verificado", "admin", "super_admin"];

const IMPROVEMENT_PANEL = {
  statusOptions: ["pending", "reviewed", "accepted", "in_progress", "done"],
  fields: ["estado_web", "problema_detectado", "mejora_recomendada", "prioridad", "estado", "fecha_revision"]
};

function clean(value = "", limit = 2000) {
  return String(value).trim().slice(0, limit);
}

function mapFindingsToChecks(findings) {
  if (!Array.isArray(findings)) return [];
  return findings
    .filter((f) => f && typeof f === "object")
    .map((f) => ({
      label: String(f.label || f.name || "").trim().slice(0, 200) || "Check",
      status: String(f.status || "pendiente").trim().slice(0, 120),
      priority: f.priority != null ? String(f.priority).trim().slice(0, 80) : "Media"
    }))
    .filter((c) => c.label);
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

/**
 * @param {import("pg").Pool} pool
 */
function createClientRouter(pool) {
  const router = express.Router();
  const createDiagnosticsRouter = require("./clientDiagnostics");

  router.get("/portal", async (req, res) => {
    try {
      const userId = req.user.id;
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

      const userResult = await pool.query(
        `SELECT id, email, name, company, created_at, role, client_verified, company_profile
         FROM users WHERE id = $1`,
        [userId]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const user = userResult.rows[0];

      const submissions = await pool.query(
        `SELECT id, data, status, created_at
         FROM form_submissions
         WHERE organization_id = $1
         ORDER BY created_at DESC
         LIMIT 12`,
        [orgId]
      );

      const activity = await pool.query(
        `SELECT id, action_type, details, created_at
         FROM activity_logs
         WHERE organization_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [orgId]
      );

      const services = await pool.query(
        `SELECT service_slug, status, metadata, started_at
         FROM client_services
         WHERE organization_id = $1
         ORDER BY started_at DESC NULLS LAST, id DESC`,
        [orgId]
      );

      const auditResult = await pool.query(
        `SELECT website_url, score, status, findings, reviewed_at
         FROM website_audits
         WHERE organization_id = $1
         ORDER BY reviewed_at DESC NULLS LAST, id DESC
         LIMIT 1`,
        [orgId]
      );

      const improvementsResult = await pool.query(
        `SELECT id, title, priority, status, page_url, details, created_at
         FROM client_improvements
         WHERE organization_id = $1
           AND (status IS NULL OR status NOT IN ('done', 'rejected', 'cancelled'))
         ORDER BY created_at DESC
         LIMIT 20`,
        [orgId]
      );

      let argosDiagnostics = [];
      try {
        const diagnosticsResult = await pool.query(
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
           LIMIT 25`,
          [orgId]
        );
        argosDiagnostics = diagnosticsResult.rows.map((row) => ({
          id: row.id,
          score: Number(row.score),
          max_score: Number(row.max_score),
          risk_level: row.risk_level,
          risk_label: row.risk_label,
          summary_preview:
            typeof row.summary === "string" ? row.summary.slice(0, 280) : "",
          created_at: row.created_at
        }));
      } catch (diagErr) {
        console.warn("[CLIENT] Lista de diagnosticos omitida:", diagErr?.message || diagErr);
        argosDiagnostics = [];
      }

      const auditRow = auditResult.rows[0];
      const checks = auditRow ? mapFindingsToChecks(auditRow.findings) : [];

      const websiteAudit = auditRow
        ? {
            status: auditRow.status || "pending",
            score: auditRow.score != null ? Number(auditRow.score) : null,
            reviewedAt: auditRow.reviewed_at,
            websiteUrl: auditRow.website_url,
            checks
          }
        : {
            status: "pending",
            score: null,
            reviewedAt: null,
            websiteUrl: null,
            checks: []
          };

      const suggestedImprovements = improvementsResult.rows.map((row) => {
        const d = row.details ? String(row.details).trim().slice(0, 120) : "";
        return d ? `${row.title}: ${d}` : row.title;
      });

      const profile =
        user.company_profile && typeof user.company_profile === "object" && !Array.isArray(user.company_profile)
          ? user.company_profile
          : {};

      const clientVerified = Boolean(user.client_verified);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          company: user.company,
          created_at: user.created_at,
          role: user.role || "cliente",
          clientVerified
        },
        organization: {
          id: req.tenant.id,
          slug: req.tenant.slug,
          name: req.tenant.name,
          orgRole: req.tenant.orgRole
        },
        roles: PORTAL_ROLES,
        clientVerified,
        companyProfile: {
          name: profile.name || req.tenant.name || user.company || "Empresa pendiente",
          contactEmail: profile.contactEmail || user.email,
          status: profile.status || "perfil_basico",
          nextStep:
            profile.nextStep || "Completar dominio web, responsables y servicios contratados."
        },
        activeServices: services.rows.map((row) => ({
          slug: row.service_slug,
          name:
            row.metadata && typeof row.metadata === "object" && row.metadata.name
              ? String(row.metadata.name)
              : String(row.service_slug).replace(/-/g, " "),
          status: row.status,
          startedAt: row.started_at
        })),
        websiteAudit,
        suggestedImprovements,
        improvementPanel: IMPROVEMENT_PANEL,
        messages: submissions.rows
          .filter((submission) => submission.data?.type === "direct_message")
          .map((submission) => ({
            id: submission.id,
            subject: submission.data?.subject,
            urgency: submission.data?.urgency,
            status: submission.status,
            read: submission.status !== "pending",
            created_at: submission.created_at
          })),
        submissions: submissions.rows,
        activity: activity.rows,
        argosDiagnostics
      });
    } catch (error) {
      console.error("[CLIENT] Error portal:", error);
      res.status(500).json({ error: "Error obteniendo portal de cliente" });
    }
  });

  router.post("/improvements", async (req, res) => {
    try {
      const userId = req.user.id;
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

      // Ignore any client-supplied organization_id
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
        `INSERT INTO form_submissions(user_id, organization_id, data, status)
         VALUES($1, $2, $3, $4)
         RETURNING id, status, created_at, organization_id`,
        [userId, orgId, JSON.stringify(data), "pending"]
      );

      await pool.query(
        `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
         VALUES($1, $2, $3, $4)`,
        [userId, orgId, "improvement_request_created", JSON.stringify(data)]
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

  router.use(createDiagnosticsRouter(pool));
  router.use(require("./clientAssets")(pool));

  router.post("/messages", async (req, res) => {
    try {
      const userId = req.user.id;
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

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
        `INSERT INTO form_submissions(user_id, organization_id, data, status)
         VALUES($1, $2, $3, $4)
         RETURNING id, status, created_at, organization_id`,
        [userId, orgId, JSON.stringify(data), "pending"]
      );

      await pool.query(
        `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
         VALUES($1, $2, $3, $4)`,
        [userId, orgId, "direct_message_created", JSON.stringify(data)]
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

  return router;
}

module.exports = createClientRouter;
module.exports.createClientRouter = createClientRouter;
