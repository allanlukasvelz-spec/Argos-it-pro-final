/**
 * Resolve notification recipients from organization membership — never from event payload.
 */
async function resolveOrgMemberRecipients(pool, organizationId, { eventType } = {}) {
  const { rows } = await pool.query(
    `SELECT om.user_id, om.org_role, u.email
     FROM organization_members om
     INNER JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1`,
    [organizationId]
  );

  const recipients = [];
  for (const row of rows) {
    const pref = await pool.query(
      `SELECT enabled FROM notification_preferences
       WHERE organization_id = $1 AND user_id = $2 AND event_type = $3`,
      [organizationId, row.user_id, eventType]
    );
    if (pref.rows[0] && pref.rows[0].enabled === false) {
      continue;
    }
    recipients.push({
      userId: row.user_id,
      orgRole: row.org_role
    });
  }
  return recipients;
}

async function resolveStaffRecipients(pool) {
  const { rows } = await pool.query(
    `SELECT id AS user_id, role
     FROM users
     WHERE role IN ('admin', 'super_admin')
       AND COALESCE(is_active, TRUE) = TRUE`
  );
  return rows.map((row) => ({
    userId: row.user_id,
    orgRole: row.role
  }));
}

module.exports = { resolveOrgMemberRecipients, resolveStaffRecipients };
