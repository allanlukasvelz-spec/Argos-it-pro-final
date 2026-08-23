/**
 * Organizations / tenant foundation (Phase 0).
 * Idempotent DDL + backfill: one org per user without membership.
 */
const ORG_ROLES = ["org_owner", "org_admin", "org_member", "org_viewer"];
const GLOBAL_ADMIN_ROLES = ["admin", "super_admin"];

const DDL = [
  `CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
  `CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'org_member'
    CHECK (org_role IN ('org_owner', 'org_admin', 'org_member', 'org_viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
)`,
  `CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id)`,
  `ALTER TABLE client_services ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `ALTER TABLE website_audits ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `ALTER TABLE client_improvements ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`,
  `CREATE INDEX IF NOT EXISTS idx_client_services_org ON client_services(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_website_audits_org ON website_audits(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_client_improvements_org ON client_improvements(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_client_messages_org ON client_messages(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_form_submissions_org ON form_submissions(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_security_logs_org ON security_logs(organization_id)`
];

function slugifyBase(input) {
  const raw = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return raw || "org";
}

async function ensureOrganizationsFoundation(pool) {
  for (const sql of DDL) {
    await pool.query(sql);
  }

  // Optional table from ensureClientDiagnosticsTable
  const diag = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'client_diagnostics'`
  );
  if (diag.rowCount > 0) {
    await pool.query(
      `ALTER TABLE client_diagnostics
       ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_client_diagnostics_org ON client_diagnostics(organization_id)`
    );
  }

  await backfillOrganizationsForUsers(pool);
  await backfillOrganizationIdsOnRows(pool);
}

async function backfillOrganizationsForUsers(pool) {
  const users = await pool.query(
    `SELECT u.id, u.company, u.name, u.email
     FROM users u
     WHERE NOT EXISTS (
       SELECT 1 FROM organization_members m WHERE m.user_id = u.id
     )
     ORDER BY u.id ASC`
  );

  for (const user of users.rows) {
    const base = slugifyBase(user.company || user.name || user.email || `user-${user.id}`);
    let slug = `${base}-${user.id}`;
    let attempt = 0;
    // Unique slug retry
    while (attempt < 5) {
      const existing = await pool.query(`SELECT id FROM organizations WHERE slug = $1`, [slug]);
      if (existing.rowCount === 0) break;
      attempt += 1;
      slug = `${base}-${user.id}-${attempt}`;
    }

    const name =
      (user.company && String(user.company).trim()) ||
      (user.name && String(user.name).trim()) ||
      `Organización ${user.id}`;

    const org = await pool.query(
      `INSERT INTO organizations(slug, name, status)
       VALUES ($1, $2, 'active')
       RETURNING id`,
      [slug, name]
    );
    const organizationId = org.rows[0].id;

    await pool.query(
      `INSERT INTO organization_members(organization_id, user_id, org_role)
       VALUES ($1, $2, 'org_owner')
       ON CONFLICT (organization_id, user_id) DO NOTHING`,
      [organizationId, user.id]
    );
  }
}

async function backfillOrganizationIdsOnRows(pool) {
  const tables = [
    "client_services",
    "website_audits",
    "client_improvements",
    "client_messages",
    "form_submissions",
    "activity_logs",
    "security_logs"
  ];

  for (const table of tables) {
    await pool.query(
      `UPDATE ${table} t
       SET organization_id = m.organization_id
       FROM organization_members m
       WHERE t.user_id = m.user_id
         AND t.organization_id IS NULL
         AND m.org_role = 'org_owner'`
    );
    // Fallback: any membership if owner missing
    await pool.query(
      `UPDATE ${table} t
       SET organization_id = m.organization_id
       FROM organization_members m
       WHERE t.user_id = m.user_id
         AND t.organization_id IS NULL`
    );
  }

  const diag = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'client_diagnostics'`
  );
  if (diag.rowCount > 0) {
    await pool.query(
      `UPDATE client_diagnostics t
       SET organization_id = m.organization_id
       FROM organization_members m
       WHERE t.user_id = m.user_id
         AND t.organization_id IS NULL`
    );
  }
}

/**
 * Load memberships for a user. Does not trust browser-supplied org ids.
 */
async function listMembershipsForUser(pool, userId) {
  const result = await pool.query(
    `SELECT m.organization_id, m.org_role, o.slug, o.name, o.status
     FROM organization_members m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = $1
     ORDER BY m.id ASC`,
    [userId]
  );
  return result.rows;
}

function isGlobalArgosAdmin(role) {
  return GLOBAL_ADMIN_ROLES.includes(role);
}

/**
 * Resolve active organization for a user.
 * Prefer explicit membership match; ignore untrusted client org ids unless member.
 */
function resolveActiveOrganization(memberships, requestedOrgId) {
  if (!memberships || memberships.length === 0) {
    return null;
  }

  if (requestedOrgId != null) {
    const id = Number(requestedOrgId);
    if (Number.isInteger(id) && id > 0) {
      const match = memberships.find((m) => Number(m.organization_id) === id);
      if (match) {
        return {
          id: Number(match.organization_id),
          slug: match.slug,
          name: match.name,
          status: match.status,
          orgRole: match.org_role
        };
      }
    }
  }

  const primary = memberships[0];
  return {
    id: Number(primary.organization_id),
    slug: primary.slug,
    name: primary.name,
    status: primary.status,
    orgRole: primary.org_role
  };
}

/**
 * Fail-closed: resource must belong to active tenant.
 */
function assertResourceInTenant(resourceOrgId, tenantId) {
  if (tenantId == null) {
    return { ok: false, status: 403, error: "Contexto de organización requerido" };
  }
  if (resourceOrgId == null || Number(resourceOrgId) !== Number(tenantId)) {
    return { ok: false, status: 404, error: "Recurso no encontrado" };
  }
  return { ok: true };
}

module.exports = {
  ORG_ROLES,
  GLOBAL_ADMIN_ROLES,
  ensureOrganizationsFoundation,
  backfillOrganizationsForUsers,
  listMembershipsForUser,
  resolveActiveOrganization,
  isGlobalArgosAdmin,
  assertResourceInTenant,
  slugifyBase
};
