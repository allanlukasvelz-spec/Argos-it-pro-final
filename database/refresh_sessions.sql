-- Sesiones de refresh token: jti en JWT + revocación y rotación.
-- El API ejecuta este DDL al arrancar (backend/lib/ensureRefreshSessions.js).
-- Usa este archivo para aplicar el mismo esquema con psql en entornos restringidos.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/refresh_sessions.sql

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_jti ON refresh_sessions(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires ON refresh_sessions(expires_at);
