-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT DEFAULT 'cliente', -- 'visitante', 'cliente', 'cliente_verificado', 'admin', 'super_admin'
  client_verified BOOLEAN DEFAULT false,
  company_profile JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations / tenants (Phase 0 multitenant foundation)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'org_member'
    CHECK (org_role IN ('org_owner', 'org_admin', 'org_member', 'org_viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- Tabla de memoria IA
CREATE TABLE IF NOT EXISTS ai_memory (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'dumbo', 'chico'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs de seguridad
CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  icon TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de formularios enviados
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  service_id INT REFERENCES services(id),
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'accepted'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de servicios contratados por cliente
CREATE TABLE IF NOT EXISTS client_services (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  service_slug TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  renewed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de auditorías y mejoras web
CREATE TABLE IF NOT EXISTS website_audits (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  website_url TEXT,
  score INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  findings JSONB DEFAULT '[]'::jsonb,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_improvements (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'Media',
  status TEXT DEFAULT 'pending',
  page_url TEXT,
  details TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_messages (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  related_submission_id INT REFERENCES form_submissions(id) ON DELETE SET NULL,
  sender_role TEXT DEFAULT 'cliente',
  subject TEXT,
  message TEXT NOT NULL,
  urgency TEXT DEFAULT 'Normal',
  read_at TIMESTAMP,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_org ON security_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_client_services_user ON client_services(user_id);
CREATE INDEX IF NOT EXISTS idx_client_services_org ON client_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_audits_user ON website_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_website_audits_org ON website_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_improvements_user ON client_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_client_improvements_org ON client_improvements(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_user ON client_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_org ON client_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_org ON form_submissions(organization_id);

-- Sesiones de refresh token (jti + rotación en POST /api/auth/refresh)
CREATE TABLE IF NOT EXISTS refresh_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_jti ON refresh_sessions(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires ON refresh_sessions(expires_at);
