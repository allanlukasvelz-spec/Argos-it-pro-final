# ARGOS — Database model

```
NO DDL IN THIS PHASE
HEAD SCHEMA = database/schema.sql @ ec27eb9
MARKERS = EXISTS | EXISTS_VIA_ENSURE | PHASE_3 | PHASE_4 | PHASE_6 | PHASE_7 | PHASE_8 | FUTURE
```

---

## 1. ER objetivo (lógico)

```
users 1──* organization_members *──1 organizations
organizations 1──* assets
assets 1──* tls_certificates          (EXISTS; cert also org-scoped)
assets 1──* monitors                  PHASE_3
monitors 1──* observations            PHASE_3
observations }── health derivation    PHASE_3 (table or computed)
alerts *──1 organization              PHASE_3
alerts *──0..1 incidents              PHASE_3
incidents 1──* incident_events        PHASE_3
incidents 1──* remediation_actions    PHASE_6
runbooks 1──* remediation_actions     PHASE_6
preventive_actions → assets           PHASE_6
agents *──1 organization              PHASE_7
agents 1──* agent_heartbeats          PHASE_7
notifications ← alerts/incidents      PHASE_8
reports ← org                         PHASE_8
audit_events org+actor                PHASE_8
support_tickets org+user              FUTURE/P8
```

Aislamiento: **toda** tabla de recurso cliente lleva `organization_id NOT NULL` (salvo catálogo `services` y `users` globales).

---

## 2. EXISTS (schema.sql)

### users
`id, email UNIQUE, password, name, company, role DEFAULT 'cliente', client_verified, company_profile JSONB, avatar_url, is_active, timestamps`  
Roles comentario: visitante | cliente | cliente_verificado | admin | super_admin.

### organizations
`id, slug UNIQUE, name, status IN (active,suspended,archived), timestamps`

### organization_members
`id, organization_id FK CASCADE, user_id FK CASCADE, org_role IN (org_owner, org_admin, org_member, org_viewer), created_at`  
UNIQUE (organization_id, user_id)

### assets
`id, organization_id FK CASCADE, parent_asset_id self FK SET NULL`  
`type IN (DOMAIN, HOSTNAME, WEBSITE, SERVER, API, DATABASE, SERVICE, TLS_CERTIFICATE)`  
`name, hostname, address, environment IN (production,staging,development,other), status IN (active,inactive,archived,unknown), kind, is_primary, metadata JSONB, last_observed_at, created_by, timestamps`

### tls_certificates
`id, organization_id, asset_id SET NULL, provider, serial, fingerprint_sha256, issuer, subject, not_before, not_after, sans JSONB, is_wildcard, auto_renew, renewal_method, last_observed_at`  
`observation_status IN (VALID, EXPIRING, EXPIRED, HOSTNAME_MISMATCH, CHAIN_ERROR, UNKNOWN)`  
`hostname_match, metadata, created_by, timestamps`  
**No private key.**

### ai_memory
`user_id, role dumbo|chico, message` — **not org-scoped** (deuda PHASE_1 leftover).

### activity_logs / security_logs
`user_id, organization_id SET NULL, action(+risk_level), details JSONB`  
API security dashboard **no** filtra por org (deuda).

### services
Catálogo global (no tenant).

### form_submissions, client_services, website_audits, client_improvements, client_messages
Tenant columns nullable SET NULL — Phase 1 backfill. TARGET: tratar `organization_id` como obligatorio en escrituras nuevas.

### refresh_sessions
`user_id, jti UNIQUE, expires_at, revoked_at`

---

## 3. EXISTS_VIA_ENSURE (deuda)

### client_diagnostics
Creada en `ensureClientDiagnosticsTable.js`: `user_id`, score, `risk_level`, JSONB strengths/risks/priorities/answers.  
Migración 001 añade `organization_id` si existe.  
**Acción futura (no ahora):** promover a `schema.sql`.

---

## 4. PHASE_3 (diseño — NO CREAR AHORA)

### monitors
`id, organization_id NOT NULL, asset_id NOT NULL, type` (HTTP, TLS, DNS, TCP, ICMP, CUSTOM)  
`interval_seconds, enabled, config JSONB, created_by, timestamps`  
UNIQUE lógico: un tipo activo por asset salvo config distinta explícita.

### observations
`id, organization_id NOT NULL, monitor_id, asset_id, checked_at, ok BOOLEAN, status_code, latency_ms, error_class, evidence JSONB, source IN (PLATFORM, AGENT)`  
Inmutable (append-only).

### health_snapshots (opcional; puede ser vista materializada)
`organization_id, asset_id, overall IN (HEALTHY, OBSERVE, WARNING, HIGH, CRITICAL, UNKNOWN), coverage JSONB, computed_at, basis_observation_ids`

### alerts
`id, organization_id NOT NULL, asset_id, monitor_id, severity, state IN (OPEN, ACKED, CLOSED), fingerprint, title, opened_at, closed_at, evidence JSONB`  
Dedup por fingerprint + org.

### incidents
`id, organization_id NOT NULL, title, severity, state IN (OPEN, MITIGATED, RESOLVED, CLOSED), owner_user_id, opened_at, resolved_at, summary`

### incident_events
`id, incident_id, organization_id, kind IN (ALERT_LINKED, NOTE, ACTION, VERIFY, STATE_CHANGE), payload JSONB, actor_user_id, created_at`  
Append-only.

Índices: `(organization_id, state)`, `(organization_id, asset_id, checked_at DESC)`.

---

## 5. PHASE_6

### runbooks
`id, slug UNIQUE, title, applies_to JSONB` (asset types / signals), `steps JSONB` (A/B/C/rollback definitions), `automation_max_level INT`

### remediation_actions
`id, organization_id, incident_id, runbook_id, letter IN (A,B,C), level, status IN (PROPOSED, APPROVED, RUNNING, PASSED, FAILED, ROLLED_BACK, SKIPPED), hypothesis, evidence_in, evidence_out, started_at, finished_at, actor`

### preventive_actions
`id, organization_id, asset_id, risk_class, state, proposed_action, source IN (DETECTED, INFERRED, PREDICTED), confidence IN (HIGH, MEDIUM, LOW, UNKNOWN)`

---

## 6. PHASE_7

### agents
`id, organization_id, asset_id, name, token_id` (hash only), `status, last_seen_at, metadata`

### agent_heartbeats
`id, agent_id, organization_id, received_at, payload JSONB`

Secretos de agente: hash + rotación; nunca plaintext en fila de log.

---

## 7. PHASE_8 / FUTURE

### notifications
`id, organization_id, channel, template, payload, state, sent_at, error`

### reports
`id, organization_id, type, period, file_uri, generated_at`

### audit_events
Producto de auditoría NOC: `actor_user_id, organization_id NULL` (NULL = plataforma), `action, resource, ip, details`  
Hoy `activity_logs` es semilla, no reemplazo completo.

### support_tickets
Evolución de `client_messages` / `form_submissions` — FUTURE si se unifica; no duplicar ahora.

---

## 8. Reglas

1. **No** tablas Phase 3 en esta ejecución.  
2. FK `organization_id` ON DELETE CASCADE en recursos operativos; logs SET NULL o retain según retención (decidir en P8).  
3. Queries always `WHERE organization_id = $ctx`.  
4. Observations/events append-only — no UPDATE de evidencia histórica.  
5. TLS private keys: never a column.  
6. `UNKNOWN` es un valor de dominio, no un NULL silencioso en status enums que impliquen salud.
