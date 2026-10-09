/**
 * Generic first-dossier provision. No product tenant names.
 * Looks up CURRENT org + membership, then calls the same createProject as NOC.
 */
const { PROJECT_TYPES, ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readProvisionInput(raw = {}) {
  const orgSlug = String(raw.orgSlug || raw.ORG_SLUG || "").trim().toLowerCase();
  const orgName = String(raw.orgName || raw.ORG_NAME || "").trim();
  const title = String(raw.title || raw.projectTitle || raw.PROJECT_TITLE || "").trim();
  const projectType = String(raw.projectType || raw.PROJECT_TYPE || "improve").trim();
  const websiteHostname = String(raw.websiteHostname || raw.WEBSITE_HOSTNAME || "").trim();
  const organizationId = Number(raw.organizationId || raw.ORGANIZATION_ID || 0) || null;
  const actorUserId = Number(raw.actorUserId || raw.ACTOR_USER_ID || 0) || null;
  const ownerUserId = Number(raw.ownerUserId || raw.OWNER_USER_ID || 0) || null;
  const createOrganization = ["1", "true", "yes"].includes(
    String(raw.createOrganization || raw.CREATE_ORG || "").toLowerCase()
  );
  const reuseExisting = !["0", "false", "no"].includes(
    String(raw.reuseExisting || raw.REUSE_EXISTING || "1").toLowerCase()
  );
  return {
    orgSlug,
    orgName,
    title,
    projectType,
    websiteHostname,
    organizationId,
    actorUserId,
    ownerUserId,
    createOrganization,
    reuseExisting
  };
}

function assertProvisionInput(input) {
  if (!input.orgSlug || !SLUG_RE.test(input.orgSlug) || input.orgSlug.length > 48) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "ORG_SLUG inválido");
  }
  if (!input.title) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "PROJECT_TITLE requerido");
  }
  if (!PROJECT_TYPES.includes(input.projectType)) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "PROJECT_TYPE debe ser create o improve");
  }
  if (!input.websiteHostname) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "WEBSITE_HOSTNAME requerido");
  }
  if (!input.actorUserId) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "ACTOR_USER_ID requerido");
  }
  if (input.createOrganization && !input.ownerUserId) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "OWNER_USER_ID requerido para CREATE_ORG");
  }
  if (input.createOrganization && !input.orgName) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "ORG_NAME requerido para CREATE_ORG");
  }
}

async function requireUser(pool, userId, label) {
  const { rows } = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
  if (!rows[0]) {
    throw new WebProjectError(404, ERROR_CODES.USER_NOT_FOUND, `${label} no existe`);
  }
  return rows[0].id;
}

async function loadOrganization(pool, slug) {
  const { rows } = await pool.query(
    `SELECT id, slug, name, status FROM organizations WHERE slug = $1`,
    [slug]
  );
  return rows[0] || null;
}

async function countMembers(pool, organizationId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM organization_members WHERE organization_id = $1`,
    [organizationId]
  );
  return rows[0]?.n || 0;
}

async function createOrganizationWithOwner(pool, input) {
  await requireUser(pool, input.ownerUserId, "OWNER_USER_ID");
  const existing = await loadOrganization(pool, input.orgSlug);
  if (existing) {
    throw new WebProjectError(409, ERROR_CODES.VALIDATION_ERROR, "La organización ya existe");
  }
  const inserted = await pool.query(
    `INSERT INTO organizations (slug, name, status)
     VALUES ($1, $2, 'active')
     RETURNING id, slug, name, status`,
    [input.orgSlug, input.orgName]
  );
  const org = inserted.rows[0];
  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role)
     VALUES ($1, $2, 'org_owner')
     ON CONFLICT (organization_id, user_id) DO NOTHING`,
    [org.id, input.ownerUserId]
  );
  return org;
}

function sameHostname(left, right) {
  return String(left || "").toLowerCase() === String(right || "").toLowerCase();
}

async function provisionWebProject(pool, service, rawInput) {
  const input = readProvisionInput(rawInput);
  assertProvisionInput(input);
  await requireUser(pool, input.actorUserId, "ACTOR_USER_ID");

  let organization = await loadOrganization(pool, input.orgSlug);
  if (!organization && input.createOrganization) {
    organization = await createOrganizationWithOwner(pool, input);
  }
  if (!organization) {
    throw new WebProjectError(
      404,
      ERROR_CODES.ORGANIZATION_NOT_FOUND,
      "Organización no encontrada. No se fabrica el expediente."
    );
  }
  if (organization.status !== "active") {
    throw new WebProjectError(409, ERROR_CODES.VALIDATION_ERROR, "La organización no está activa");
  }
  if (input.organizationId && Number(input.organizationId) !== Number(organization.id)) {
    throw new WebProjectError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "ORGANIZATION_ID no coincide con ORG_SLUG"
    );
  }

  const members = await countMembers(pool, organization.id);
  if (members < 1) {
    throw new WebProjectError(
      409,
      ERROR_CODES.MEMBERSHIP_REQUIRED,
      "La organización no tiene membership. No se fabrica el expediente."
    );
  }

  if (input.reuseExisting) {
    const existing = await service.listProjects(organization.id, { includeArchived: false });
    const found = existing.find(
      (project) =>
        sameHostname(project.websiteHostname, input.websiteHostname) &&
        String(project.title) === input.title
    );
    if (found) {
      return {
        created: false,
        reused: true,
        organization,
        project: found
      };
    }
  }

  const project = await service.createProject({
    organizationId: organization.id,
    actorUserId: input.actorUserId,
    title: input.title,
    projectType: input.projectType,
    websiteHostname: input.websiteHostname,
    source: "provision"
  });

  return {
    created: true,
    reused: false,
    organization,
    project
  };
}

function databaseUrlLooksLocal(url) {
  const raw = String(url || "");
  return /127\.0\.0\.1|localhost/i.test(raw);
}

module.exports = {
  readProvisionInput,
  assertProvisionInput,
  provisionWebProject,
  databaseUrlLooksLocal,
  SLUG_RE
};
