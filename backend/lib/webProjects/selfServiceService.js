/**
 * Authenticated self-service entry into Web Projects.
 * User identity comes from CURRENT auth. This service never inserts users.
 */
const crypto = require("crypto");
const { listMembershipsForUser, slugifyBase } = require("../ensureOrganizations");
const {
  PROJECT_TYPES,
  WRITE_ROLES,
  ERROR_CODES,
  MAX_TITLE_LENGTH,
  AUDIT_ACTIONS,
  CLIENT_CREATE_POLICY
} = require("./constants");
const { WebProjectError } = require("./errors");
const { WEB_PROJECT_NOTIFICATION_EVENTS } = require("./notificationCopy");

const GENERIC_START_ERROR = "No hemos podido iniciar el proyecto. Inténtalo de nuevo.";
const IDEMPOTENCY_ACTIONS = Object.freeze([
  AUDIT_ACTIONS.SELF_SERVICE_STARTED,
  AUDIT_ACTIONS.SELF_SERVICE_ORGANIZATION_CREATED,
  AUDIT_ACTIONS.SELF_SERVICE_PROJECT_CREATED
]);

function normalizeDisplayName(raw) {
  return String(raw || "").trim().slice(0, 120);
}

function defaultProjectTitle(displayName) {
  const name = normalizeDisplayName(displayName);
  if (!name) return "Proyecto web";
  return `Web de ${name}`.slice(0, MAX_TITLE_LENGTH);
}

function normalizeIdempotencyKey(raw) {
  const key = String(raw || "").trim();
  if (key.length < 8 || key.length > 128) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) return null;
  return key;
}

function parseDetails(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function withTx(pool, work) {
  if (!pool || typeof pool.connect !== "function") {
    return work(pool);
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // original error is authoritative
    }
    throw err;
  } finally {
    client.release();
  }
}

async function audit(client, { userId, organizationId, action, details }) {
  const safe = { ...(details || {}) };
  delete safe.password;
  delete safe.email;
  delete safe.token;
  await client.query(
    `INSERT INTO activity_logs (user_id, organization_id, action_type, details)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [userId || null, organizationId || null, action, JSON.stringify(safe)]
  );
}

async function uniqueOrgSlug(client, displayName) {
  const root = slugifyBase(displayName).slice(0, 40);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = `${root}-${crypto.randomBytes(3).toString("hex")}`;
    const { rows } = await client.query(`SELECT 1 FROM organizations WHERE slug = $1`, [slug]);
    if (!rows[0]) return slug;
  }
  throw new WebProjectError(500, ERROR_CODES.VALIDATION_ERROR, GENERIC_START_ERROR);
}

async function insertOrganization(client, displayName) {
  const name = normalizeDisplayName(displayName) || "Espacio de trabajo";
  const slug = await uniqueOrgSlug(client, name);
  const inserted = await client.query(
    `INSERT INTO organizations (slug, name, status)
     VALUES ($1, $2, 'active')
     RETURNING id, slug, name, status`,
    [slug, name]
  );
  return inserted.rows[0];
}

async function attachOwnerMembership(client, organizationId, userId) {
  await client.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role)
     VALUES ($1, $2, 'org_owner')
     ON CONFLICT (organization_id, user_id) DO NOTHING`,
    [organizationId, userId]
  );
}

async function loadOrganization(client, organizationId) {
  const { rows } = await client.query(
    `SELECT id, slug, name, status FROM organizations WHERE id = $1`,
    [organizationId]
  );
  return rows[0] || null;
}

async function loadUser(client, userId) {
  const { rows } = await client.query(
    `SELECT id, name, company, email FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
}

function writableMemberships(memberships) {
  return (memberships || []).filter((row) => {
    const active = String(row.status || "").toLowerCase() === "active";
    return active && WRITE_ROLES.includes(row.org_role);
  });
}

async function findIdempotentState(client, userId, idempotencyKey) {
  const { rows } = await client.query(
    `SELECT organization_id, action_type, details
     FROM activity_logs
     WHERE user_id = $1
       AND action_type IN (
         'WEB_PROJECT_SELF_SERVICE_STARTED',
         'WEB_PROJECT_SELF_SERVICE_ORGANIZATION_CREATED',
         'WEB_PROJECT_SELF_SERVICE_PROJECT_CREATED'
       )
     ORDER BY id DESC`,
    [userId]
  );
  const matched = rows
    .map((row) => ({
      organizationId: row.organization_id != null ? Number(row.organization_id) : null,
      actionType: row.action_type,
      details: parseDetails(row.details)
    }))
    .filter((row) => row.details.idempotencyKey === idempotencyKey);
  const withProject = matched.find((row) => Number(row.details.projectId) > 0);
  if (withProject) {
    return {
      organizationId: withProject.organizationId || Number(withProject.details.organizationId) || null,
      projectId: Number(withProject.details.projectId),
      organizationCreated: Boolean(withProject.details.organizationCreated)
    };
  }
  const withOrg = matched.find((row) => row.organizationId || Number(row.details.organizationId) > 0);
  if (withOrg) {
    return {
      organizationId: withOrg.organizationId || Number(withOrg.details.organizationId),
      projectId: null,
      organizationCreated: Boolean(withOrg.details.organizationCreated)
    };
  }
  return null;
}

function toOrgDto(row, extras = {}) {
  return {
    id: Number(row.id || row.organization_id),
    name: row.name,
    created: Boolean(extras.created)
  };
}

function createSelfServiceService(pool, options = {}) {
  const projectService = options.projectService;
  if (!projectService || typeof projectService.createProject !== "function") {
    throw new Error("projectService requerido");
  }

  async function notifyStaffSafe(payload) {
    const notifier = options.notifications;
    if (!notifier || typeof notifier.emitWebProject !== "function") return;
    try {
      await notifier.emitWebProject({
        kind: WEB_PROJECT_NOTIFICATION_EVENTS.SELF_SERVICE_STARTED,
        audience: "staff",
        ...payload
      });
    } catch (err) {
      console.error("[WP SELF-SERVICE NOTIFY]", err.message);
    }
  }

  async function getContext(actorUserId) {
    const userId = Number(actorUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new WebProjectError(401, ERROR_CODES.LOGIN_REQUIRED, "Nuestra sesión ha caducado. Vuelve a iniciar sesión.");
    }
    const memberships = await listMembershipsForUser(pool, userId);
    const organizations = (memberships || [])
      .filter((row) => String(row.status || "").toLowerCase() === "active")
      .map((row) => ({
        id: Number(row.organization_id),
        name: row.name,
        canCreate: WRITE_ROLES.includes(row.org_role)
      }));
    const writable = organizations.filter((row) => row.canCreate);
    const intakeProjects = [];
    for (const org of writable) {
      const items = await projectService.listProjects(org.id);
      for (const project of items) {
        if (project.archivedAt) continue;
        if (project.workflowStatus !== "INTAKE") continue;
        intakeProjects.push({
          id: Number(project.id),
          title: project.title,
          projectType: project.projectType,
          organizationId: org.id,
          organizationName: org.name
        });
      }
    }
    return {
      organizations,
      intakeProjects,
      defaultOrganizationId: writable.length === 1 ? writable[0].id : null
    };
  }

  async function startSelfService(input) {
    const actorUserId = Number(input.actorUserId);
    if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
      throw new WebProjectError(401, ERROR_CODES.LOGIN_REQUIRED, "Nuestra sesión ha caducado. Vuelve a iniciar sesión.");
    }
    const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
    if (!idempotencyKey) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, GENERIC_START_ERROR);
    }
    if (!PROJECT_TYPES.includes(input.projectType)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Elige si quieres crear una web nueva o mejorar la actual.");
    }

    const existing = await findIdempotentState(pool, actorUserId, idempotencyKey);
    if (existing?.projectId && existing.organizationId) {
      const project = await projectService.getProject(existing.organizationId, existing.projectId);
      const organization = await loadOrganization(pool, existing.organizationId);
      return {
        project,
        organization: toOrgDto(organization || { id: existing.organizationId, name: "Espacio de trabajo" }, {
          created: existing.organizationCreated
        }),
        created: false,
        reused: true,
        policy: CLIENT_CREATE_POLICY
      };
    }

    const memberships = await listMembershipsForUser(pool, actorUserId);
    const writable = writableMemberships(memberships);
    const requestedOrgId =
      input.organizationId != null && String(input.organizationId).trim() !== ""
        ? Number(input.organizationId)
        : null;
    const createOrganization = Boolean(input.createOrganization);
    const actor = await loadUser(pool, actorUserId);
    const operationalName =
      normalizeDisplayName(input.organizationName) ||
      normalizeDisplayName(actor?.company) ||
      normalizeDisplayName(actor?.name) ||
      "Espacio de trabajo";

    let organization = null;
    let organizationCreated = false;

    if (existing?.organizationId) {
      organization = await loadOrganization(pool, existing.organizationId);
      organizationCreated = Boolean(existing.organizationCreated);
    } else if (createOrganization) {
      organization = await withTx(pool, async (client) => {
        const created = await insertOrganization(client, operationalName);
        await attachOwnerMembership(client, created.id, actorUserId);
        await audit(client, {
          userId: actorUserId,
          organizationId: created.id,
          action: AUDIT_ACTIONS.SELF_SERVICE_ORGANIZATION_CREATED,
          details: { idempotencyKey, organizationCreated: true }
        });
        return created;
      });
      organizationCreated = true;
    } else if (requestedOrgId != null) {
      if (!Number.isInteger(requestedOrgId) || requestedOrgId <= 0) {
        throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, GENERIC_START_ERROR);
      }
      const member = (memberships || []).find((row) => Number(row.organization_id) === requestedOrgId);
      if (!member) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, GENERIC_START_ERROR);
      }
      if (String(member.status || "").toLowerCase() !== "active") {
        throw new WebProjectError(403, ERROR_CODES.INACTIVE_ORGANIZATION, "Ese espacio no está disponible.");
      }
      if (!WRITE_ROLES.includes(member.org_role)) {
        throw new WebProjectError(403, ERROR_CODES.FORBIDDEN, "No tienes permiso para crear un proyecto en ese espacio.");
      }
      organization = {
        id: Number(member.organization_id),
        slug: member.slug,
        name: member.name,
        status: member.status
      };
    } else if (writable.length === 1) {
      const row = writable[0];
      organization = {
        id: Number(row.organization_id),
        slug: row.slug,
        name: row.name,
        status: row.status
      };
    } else if (writable.length === 0) {
      organization = await withTx(pool, async (client) => {
        const created = await insertOrganization(client, operationalName);
        await attachOwnerMembership(client, created.id, actorUserId);
        await audit(client, {
          userId: actorUserId,
          organizationId: created.id,
          action: AUDIT_ACTIONS.SELF_SERVICE_ORGANIZATION_CREATED,
          details: { idempotencyKey, organizationCreated: true }
        });
        return created;
      });
      organizationCreated = true;
    } else {
      const error = new WebProjectError(
        409,
        ERROR_CODES.ORG_SELECTION_REQUIRED,
        "Elige para qué empresa quieres crear este proyecto."
      );
      error.organizations = writable.map((row) => ({
        id: Number(row.organization_id),
        name: row.name
      }));
      throw error;
    }

    if (!organization || String(organization.status || "active").toLowerCase() !== "active") {
      throw new WebProjectError(403, ERROR_CODES.INACTIVE_ORGANIZATION, "Ese espacio no está disponible.");
    }

    const title = String(input.title || "").trim()
      ? String(input.title).trim().slice(0, MAX_TITLE_LENGTH)
      : defaultProjectTitle(operationalName || organization.name);

    const project = await projectService.createProject({
      organizationId: Number(organization.id),
      actorUserId,
      title,
      projectType: input.projectType,
      source: "self_service"
    });

    await audit(pool, {
      userId: actorUserId,
      organizationId: Number(organization.id),
      action: AUDIT_ACTIONS.SELF_SERVICE_STARTED,
      details: {
        idempotencyKey,
        projectId: project.id,
        organizationCreated,
        source: "self_service"
      }
    });
    await audit(pool, {
      userId: actorUserId,
      organizationId: Number(organization.id),
      action: AUDIT_ACTIONS.SELF_SERVICE_PROJECT_CREATED,
      details: {
        idempotencyKey,
        projectId: project.id,
        organizationCreated
      }
    });

    await notifyStaffSafe({
      organizationId: Number(organization.id),
      actorUserId,
      project
    });

    return {
      project,
      organization: toOrgDto(organization, { created: organizationCreated }),
      created: true,
      reused: false,
      policy: CLIENT_CREATE_POLICY
    };
  }

  return {
    getContext,
    startSelfService,
    defaultProjectTitle
  };
}

module.exports = {
  createSelfServiceService,
  defaultProjectTitle,
  normalizeIdempotencyKey,
  GENERIC_START_ERROR
};
