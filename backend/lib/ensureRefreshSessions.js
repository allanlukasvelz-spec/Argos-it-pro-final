/**
 * Asegura la tabla refresh_sessions (jti + rotación de refresh).
 * Mismo DDL que database/refresh_sessions.sql; si cambias uno, sincroniza el otro.
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS refresh_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
  "CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user ON refresh_sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_refresh_sessions_jti ON refresh_sessions(jti)",
  "CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires ON refresh_sessions(expires_at)"
];

async function ensureRefreshSessionsTable(pool) {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}

module.exports = { ensureRefreshSessionsTable };
