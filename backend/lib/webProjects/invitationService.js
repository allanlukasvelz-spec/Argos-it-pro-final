/**
 * Web project invitations. Org + project at create time; membership on accept.
 */
const bcrypt = require("bcrypt");
const { slugifyBase } = require("../ensureOrganizations");
const { PROJECT_TYPES, ERROR_CODES, MAX_TITLE_LENGTH } = require("./constants");
const { WebProjectError } = require("./errors");
const { validateEmailFormat } = require("../../middleware/security");
const {
  generateInvitationToken,
  hashInvitationToken,
  invitationTokenLooksValid,
  invitationExpiresAt,
  hashMatches
} = require("./invitationTokens");
const { createInvitationMailer } = require("./invitationMailer");

const GENERIC_INVALID = "Esta invitación no es válida o ha caducado.";
const EXISTING_ORG_ROLES = Object.freeze(["org_member", "org_admin", "org_viewer"]);
const INVITATION_COLUMNS = `id, email, display_name, project_type, project_title,
  organization_id, web_project_id, invited_by, token_hash, status, delivery_status,
  created_organization, intended_org_role, expires_at, accepted_at, accepted_by,
  created_at, updated_at`;

function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

function normalizeDisplayName(raw) {
  return String(raw || "").trim().slice(0, 120);
}

function defaultProjectTitle(displayName) {
  const name = normalizeDisplayName(displayName);
  if (!name) return "Proyecto web";
  return `Web de ${name}`.slice(0, MAX_TITLE_LENGTH);
}

function publicInvalid() {
  return new WebProjectError(404, ERROR_CODES.INVITATION_INVALID, GENERIC_INVALID);
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    email: row.email,
    displayName: row.display_name,
    projectType: row.project_type,
    projectTitle: row.project_title,
    organizationId: row.organization_id != null ? Number(row.organization_id) : null,
    webProjectId: row.web_project_id != null ? Number(row.web_project_id) : null,
    invitedBy: row.invited_by != null ? Number(row.invited_by) : null,
    status: row.status,
    deliveryStatus: row.delivery_status,
    createdOrganization: Boolean(row.created_organization),
    intendedOrgRole: row.intended_org_role,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    acceptedBy: row.accepted_by != null ? Number(row.accepted_by) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toNocDto(invitation, extras = {}) {
  return {
    id: invitation.id,
    email: invitation.email,
    displayName: invitation.displayName,
    projectType: invitation.projectType,
    projectTitle: invitation.projectTitle,
    organizationId: invitation.organizationId,
    organizationName: extras.organizationName || null,
    webProjectId: invitation.webProjectId,
    status: invitation.status,
    deliveryStatus: invitation.deliveryStatus,
    createdOrganization: invitation.createdOrganization,
    intendedOrgRole: invitation.intendedOrgRole,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt
  };
}

function toResolveDto(invitation, organizationName) {
  return {
    displayName: invitation.displayName,
    projectType: invitation.projectType,
    expiresAt: invitation.expiresAt,
    organizationLabel: organizationName || invitation.displayName
  };
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
  delete safe.token;
  delete safe.tokenHash;
  delete safe.password;
  delete safe.inviteUrl;
  await client.query(
    `INSERT INTO activity_logs (user_id, organization_id, action_type, details)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [userId || null, organizationId || null, action, JSON.stringify(safe)]
  );
}

async function loadOrganization(client, organizationId) {
  const { rows } = await client.query(
    `SELECT id, slug, name, status FROM organizations WHERE id = $1`,
    [organizationId]
  );
  return rows[0] || null;
}

async function uniqueOrgSlug(client, displayName) {
  const root = slugifyBase(displayName).slice(0, 40);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = `${root}-${require("crypto").randomBytes(3).toString("hex")}`;
    const { rows } = await client.query(`SELECT 1 FROM organizations WHERE slug = $1`, [slug]);
    if (!rows[0]) return slug;
  }
  throw new WebProjectError(500, ERROR_CODES.VALIDATION_ERROR, "No se pudo generar un identificador de organización");
}

async function insertOrganization(client, displayName) {
  const slug = await uniqueOrgSlug(client, displayName);
  const inserted = await client.query(
    `INSERT INTO organizations (slug, name, status)
     VALUES ($1, $2, 'active')
     RETURNING id, slug, name, status`,
    [slug, displayName]
  );
  return inserted.rows[0];
}

async function findUserByEmail(client, email) {
  const { rows } = await client.query(
    `SELECT id, email, name, role, is_active FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

async function findInvitationByHash(client, tokenHash) {
  const { rows } = await client.query(
    `SELECT ${INVITATION_COLUMNS} FROM web_project_invitations WHERE token_hash = $1`,
    [tokenHash]
  );
  return mapRow(rows[0]);
}

async function findPendingDuplicate(client, email, organizationId, createdOrganization) {
  if (organizationId) {
    const { rows } = await client.query(
      `SELECT ${INVITATION_COLUMNS}
       FROM web_project_invitations
       WHERE email = $1 AND organization_id = $2 AND status = 'PENDING'
       ORDER BY id DESC
       LIMIT 1`,
      [email, organizationId]
    );
    return mapRow(rows[0]);
  }
  if (createdOrganization) {
    const { rows } = await client.query(
      `SELECT ${INVITATION_COLUMNS}
       FROM web_project_invitations
       WHERE email = $1 AND created_organization = TRUE AND status = 'PENDING'
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );
    return mapRow(rows[0]);
  }
  return null;
}

async function refreshInvitation(client, id) {
  const { rows } = await client.query(
    `SELECT ${INVITATION_COLUMNS} FROM web_project_invitations WHERE id = $1`,
    [id]
  );
  return mapRow(rows[0]);
}

function isExpired(invitation, now) {
  if (!invitation?.expiresAt) return true;
  return new Date(invitation.expiresAt).getTime() <= now.getTime();
}

async function markExpired(client, invitation) {
  await client.query(
    `UPDATE web_project_invitations
     SET status = 'EXPIRED', updated_at = NOW()
     WHERE id = $1 AND status = 'PENDING'`,
    [invitation.id]
  );
}

async function rotateToken(client, invitation, invitedBy, now) {
  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = invitationExpiresAt(now);
  await client.query(
    `UPDATE web_project_invitations
     SET token_hash = $1, expires_at = $2, status = 'PENDING',
         delivery_status = 'NONE', updated_at = NOW()
     WHERE id = $3`,
    [tokenHash, expiresAt, invitation.id]
  );
  const updated = await refreshInvitation(client, invitation.id);
  return { invitation: updated, token };
}

function passwordMeetsPolicy(password) {
  const value = String(password || "");
  return value.length >= 10 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
}

function createInvitationService({
  pool,
  projectService,
  mailer = createInvitationMailer(),
  now = () => new Date()
}) {
  if (!projectService) {
    throw new Error("projectService requerido");
  }

  async function deliver(invitation, token, actorUserId) {
    const result = await mailer.send({
      to: invitation.email,
      displayName: invitation.displayName,
      expiresAt: invitation.expiresAt
    });
    const deliveryStatus = result.delivered ? "SENT" : "FAILED";
    await pool.query(
      `UPDATE web_project_invitations
       SET delivery_status = $1, updated_at = NOW()
       WHERE id = $2`,
      [deliveryStatus, invitation.id]
    );
    invitation.deliveryStatus = deliveryStatus;
    await audit(pool, {
      userId: actorUserId,
      organizationId: invitation.organizationId,
      action: result.delivered ? "WEB_PROJECT_INVITATION_SENT" : "WEB_PROJECT_INVITATION_CREATED",
      details: {
        invitationId: invitation.id,
        projectId: invitation.webProjectId,
        delivered: Boolean(result.delivered),
        reason: result.reason || null
      }
    });
    const payload = { invitation: toNocDto(invitation), delivery: { delivered: Boolean(result.delivered), reason: result.reason || null } };
    if (!result.delivered && mailer.canRevealInviteUrl()) {
      payload.inviteUrl = mailer.buildInviteUrl(token);
    }
    return payload;
  }

  async function createInvitation(input) {
    const email = normalizeEmail(input.email);
    const displayName = normalizeDisplayName(input.displayName);
    const projectType = String(input.projectType || "").trim();
    const projectTitle = String(input.projectTitle || "").trim() || defaultProjectTitle(displayName);
    const actorUserId = Number(input.actorUserId);
    const organizationId = Number(input.organizationId || 0) || null;
    const intendedOrgRole = organizationId
      ? String(input.orgRole || "org_member")
      : "org_owner";

    if (!validateEmailFormat(email)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Email no válido");
    }
    if (!displayName) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Nombre identificativo requerido");
    }
    if (!PROJECT_TYPES.includes(projectType)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "project_type debe ser create o improve");
    }
    if (!actorUserId) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Actor requerido");
    }
    if (organizationId && !EXISTING_ORG_ROLES.includes(intendedOrgRole)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Rol no permitido para organización existente");
    }

    const existing = await findPendingDuplicate(pool, email, organizationId, !organizationId);
    if (existing && !isExpired(existing, now())) {
      const rotated = await withTx(pool, async (client) => {
        const next = await rotateToken(client, existing, actorUserId, now());
        await audit(client, {
          userId: actorUserId,
          organizationId: next.invitation.organizationId,
          action: "WEB_PROJECT_INVITATION_RESENT",
          details: { invitationId: next.invitation.id, projectId: next.invitation.webProjectId }
        });
        return next;
      });
      rotated.invitation.organizationName =
        (await loadOrganization(pool, rotated.invitation.organizationId))?.name || null;
      return deliver(rotated.invitation, rotated.token, actorUserId);
    }
    if (existing && isExpired(existing, now())) {
      await markExpired(pool, existing);
    }

    let organization = null;
    let createdOrganization = false;
    if (organizationId) {
      organization = await loadOrganization(pool, organizationId);
      if (!organization || organization.status !== "active") {
        throw new WebProjectError(404, ERROR_CODES.ORGANIZATION_NOT_FOUND, "Organización no encontrada");
      }
    } else {
      organization = await insertOrganization(pool, displayName);
      createdOrganization = true;
    }

    const project = await projectService.createProject({
      organizationId: organization.id,
      actorUserId,
      title: projectTitle,
      projectType,
      source: "invitation"
    });

    const token = generateInvitationToken();
    const created = await withTx(pool, async (client) => {
      const inserted = await client.query(
        `INSERT INTO web_project_invitations (
           email, display_name, project_type, project_title,
           organization_id, web_project_id, invited_by, token_hash,
           status, delivery_status, created_organization, intended_org_role, expires_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING','NONE',$9,$10,$11)
         RETURNING ${INVITATION_COLUMNS}`,
        [
          email,
          displayName,
          projectType,
          projectTitle,
          organization.id,
          project.id,
          actorUserId,
          hashInvitationToken(token),
          createdOrganization,
          intendedOrgRole,
          invitationExpiresAt(now())
        ]
      );
      await audit(client, {
        userId: actorUserId,
        organizationId: organization.id,
        action: "WEB_PROJECT_INVITATION_CREATED",
        details: { invitationId: inserted.rows[0].id, projectId: project.id }
      });
      return {
        invitation: mapRow(inserted.rows[0]),
        token,
        organization,
        reused: false
      };
    });

    const org = created.organization || (created.invitation.organizationId
      ? await loadOrganization(pool, created.invitation.organizationId)
      : null);
    created.invitation.organizationName = org?.name || null;
    return deliver(created.invitation, created.token, actorUserId);
  }

  async function listInvitations({ organizationId, limit = 50 } = {}) {
    const capped = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const params = [];
    let sql = `SELECT i.*, o.name AS organization_name
      FROM web_project_invitations i
      LEFT JOIN organizations o ON o.id = i.organization_id`;
    if (organizationId) {
      params.push(organizationId);
      sql += ` WHERE i.organization_id = $1`;
    }
    sql += ` ORDER BY i.id DESC LIMIT ${capped}`;
    const { rows } = await pool.query(sql, params);
    return rows.map((row) => toNocDto(mapRow(row), { organizationName: row.organization_name }));
  }

  async function getInvitation(id) {
    const { rows } = await pool.query(
      `SELECT i.*, o.name AS organization_name
       FROM web_project_invitations i
       LEFT JOIN organizations o ON o.id = i.organization_id
       WHERE i.id = $1`,
      [id]
    );
    if (!rows[0]) {
      throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Invitación no encontrada");
    }
    return toNocDto(mapRow(rows[0]), { organizationName: rows[0].organization_name });
  }

  async function revokeInvitation(id, actorUserId) {
    await withTx(pool, async (client) => {
      const invitation = await refreshInvitation(client, id);
      if (!invitation) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Invitación no encontrada");
      }
      if (invitation.status !== "PENDING") {
        throw new WebProjectError(409, ERROR_CODES.VALIDATION_ERROR, "Solo se puede revocar una invitación pendiente");
      }
      await client.query(
        `UPDATE web_project_invitations
         SET status = 'REVOKED', updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
      await audit(client, {
        userId: actorUserId,
        organizationId: invitation.organizationId,
        action: "WEB_PROJECT_INVITATION_REVOKED",
        details: { invitationId: invitation.id, projectId: invitation.webProjectId }
      });
    });
    return getInvitation(id);
  }

  async function resendInvitation(id, actorUserId) {
    const rotated = await withTx(pool, async (client) => {
      const invitation = await refreshInvitation(client, id);
      if (!invitation) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Invitación no encontrada");
      }
      if (invitation.status === "ACCEPTED") {
        throw new WebProjectError(409, ERROR_CODES.VALIDATION_ERROR, "La invitación ya fue aceptada");
      }
      if (invitation.status === "REVOKED") {
        throw new WebProjectError(409, ERROR_CODES.VALIDATION_ERROR, "La invitación está revocada");
      }
      const next = await rotateToken(client, invitation, actorUserId, now());
      await audit(client, {
        userId: actorUserId,
        organizationId: next.invitation.organizationId,
        action: "WEB_PROJECT_INVITATION_RESENT",
        details: { invitationId: next.invitation.id, projectId: next.invitation.webProjectId }
      });
      return next;
    });
    const org = await loadOrganization(pool, rotated.invitation.organizationId);
    rotated.invitation.organizationName = org?.name || null;
    return deliver(rotated.invitation, rotated.token, actorUserId);
  }

  async function resolveInvitation(rawToken) {
    if (!invitationTokenLooksValid(rawToken)) {
      throw publicInvalid();
    }
    const invitation = await findInvitationByHash(pool, hashInvitationToken(rawToken));
    if (!invitation || invitation.status === "REVOKED" || invitation.status === "EXPIRED") {
      throw publicInvalid();
    }
    if (!hashMatches(rawToken, hashInvitationToken(rawToken))) {
      throw publicInvalid();
    }
    if (invitation.status === "PENDING" && isExpired(invitation, now())) {
      await markExpired(pool, invitation);
      throw publicInvalid();
    }
    if (invitation.status === "ACCEPTED") {
      throw publicInvalid();
    }
    const org = invitation.organizationId ? await loadOrganization(pool, invitation.organizationId) : null;
    return toResolveDto(invitation, org?.name);
  }

  async function acceptInvitation({ token, sessionUser, password, name }) {
    if (!invitationTokenLooksValid(token)) {
      throw publicInvalid();
    }
    const result = await withTx(pool, async (client) => {
      const invitation = await findInvitationByHash(client, hashInvitationToken(token));
      if (!invitation || invitation.status === "REVOKED" || invitation.status === "EXPIRED") {
        throw publicInvalid();
      }
      if (invitation.status === "PENDING" && isExpired(invitation, now())) {
        await markExpired(client, invitation);
        throw publicInvalid();
      }

      const existingUser = await findUserByEmail(client, invitation.email);

      if (invitation.status === "ACCEPTED") {
        if (sessionUser && normalizeEmail(sessionUser.email) === invitation.email) {
          return {
            invitation,
            userId: Number(sessionUser.id),
            createdUser: false,
            issueSession: false
          };
        }
        throw publicInvalid();
      }

      if (sessionUser) {
        const sessionEmail = normalizeEmail(sessionUser.email);
        if (sessionEmail !== invitation.email) {
          throw new WebProjectError(
            409,
            ERROR_CODES.WRONG_ACCOUNT,
            "Esta invitación pertenece a otra cuenta. Cierra sesión e inicia con el correo invitado."
          );
        }
        if (!existingUser || Number(existingUser.id) !== Number(sessionUser.id)) {
          throw publicInvalid();
        }
        if (existingUser.is_active === false) {
          throw publicInvalid();
        }
        await attachMembership(client, invitation, existingUser.id);
        await markAccepted(client, invitation, existingUser.id);
        return {
          invitation,
          userId: existingUser.id,
          createdUser: false,
          issueSession: false
        };
      }

      if (existingUser) {
        throw new WebProjectError(
          409,
          ERROR_CODES.LOGIN_REQUIRED,
          "Inicia sesión o crea tu acceso para continuar."
        );
      }

      if (!passwordMeetsPolicy(password)) {
        throw new WebProjectError(
          400,
          ERROR_CODES.SETUP_REQUIRED,
          "Inicia sesión o crea tu acceso para continuar."
        );
      }

      const hash = await bcrypt.hash(String(password), 10);
      const created = await client.query(
        `INSERT INTO users (email, password, name, company, role)
         VALUES ($1, $2, $3, $4, 'cliente')
         RETURNING id, email, name, role`,
        [invitation.email, hash, name || invitation.displayName, invitation.displayName]
      );
      const userId = created.rows[0].id;
      await attachMembership(client, invitation, userId);
      await markAccepted(client, invitation, userId);
      return {
        invitation,
        userId,
        createdUser: true,
        issueSession: true,
        user: created.rows[0]
      };
    });

    return {
      projectId: result.invitation.webProjectId,
      organizationId: result.invitation.organizationId,
      redirectTo: `/dashboard/proyectos/${result.invitation.webProjectId}`,
      issueSession: result.issueSession,
      user: result.user || null,
      userId: result.userId
    };
  }

  async function attachMembership(client, invitation, userId) {
    const { rows } = await client.query(
      `SELECT org_role FROM organization_members
       WHERE organization_id = $1 AND user_id = $2`,
      [invitation.organizationId, userId]
    );
    if (rows[0]) return;
    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, org_role)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [invitation.organizationId, userId, invitation.intendedOrgRole]
    );
  }

  async function markAccepted(client, invitation, userId) {
    await client.query(
      `UPDATE web_project_invitations
       SET status = 'ACCEPTED', accepted_at = NOW(), accepted_by = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING'`,
      [invitation.id, userId]
    );
    await audit(client, {
      userId,
      organizationId: invitation.organizationId,
      action: "WEB_PROJECT_INVITATION_ACCEPTED",
      details: { invitationId: invitation.id, projectId: invitation.webProjectId }
    });
    await audit(client, {
      userId,
      organizationId: invitation.organizationId,
      action: "WEB_PROJECT_CLIENT_ONBOARDED",
      details: { invitationId: invitation.id, projectId: invitation.webProjectId }
    });
  }

  return {
    createInvitation,
    listInvitations,
    getInvitation,
    revokeInvitation,
    resendInvitation,
    resolveInvitation,
    acceptInvitation,
    toNocDto
  };
}

module.exports = {
  createInvitationService,
  normalizeEmail,
  defaultProjectTitle,
  GENERIC_INVALID,
  passwordMeetsPolicy
};
