/**
 * Tabla opcional persistencia de Diagnóstico ARGOS (cliente autenticado).
 * DDL refleja lo que espera frontend/routes/clientDiagnostics.js.
 */
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS client_diagnostics (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'diagnostico-argos',
  score INT NOT NULL,
  max_score INT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  risk_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb
)`,
  "CREATE INDEX IF NOT EXISTS idx_client_diagnostics_user_created ON client_diagnostics(user_id, created_at DESC)"
];

async function ensureClientDiagnosticsTable(pool) {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
}

module.exports = { ensureClientDiagnosticsTable };
