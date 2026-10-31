/**
 * Phase 7 — agent domain service (enrollment, heartbeat, observations).
 */
const {
  sha256Hex,
  generateEnrollmentToken,
  generateAgentSecret,
  formatCredential,
  parseCredential,
  hashMatches
} = require("./crypto");
const { normalizeCapabilityList, hasCapability, observationCapability, OBSERVATION_TYPES } = require("./capabilities");
const { validateMeasurement } = require("./schemas");
const { AGENT_STATUS, deriveAgentStatus } = require("./state");
const { recordAgentSecurityEvent } = require("./audit");

const ENROLL_TTL_MS = Number(process.env.AGENT_ENROLL_TTL_MS) || 60 * 60 * 1000;
const MAX_BATCH = 20;

async function createEnrollment(pool, { organizationId, assetId, capabilities, createdBy, agentNameHint }) {
  const asset = await pool.query(
    `SELECT id, organization_id FROM assets WHERE id = $1 AND organization_id = $2`,
    [assetId, organizationId]
  );
  if (!asset.rows[0]) {
    const err = new Error("Asset not found in organization");
    err.code = "ASSET_NOT_FOUND";
    throw err;
  }
  const caps = normalizeCapabilityList(capabilities);
  const token = generateEnrollmentToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + ENROLL_TTL_MS);
  const ins = await pool.query(
    `INSERT INTO agent_enrollments (
       organization_id, asset_id, token_hash, capabilities, status, expires_at, created_by, agent_name_hint
     ) VALUES ($1,$2,$3,$4::jsonb,'PENDING',$5,$6,$7)
     RETURNING id, expires_at, capabilities`,
    [
      organizationId,
      assetId,
      tokenHash,
      JSON.stringify(caps),
      expiresAt.toISOString(),
      createdBy || null,
      agentNameHint ? String(agentNameHint).slice(0, 120) : null
    ]
  );
  await recordAgentSecurityEvent(pool, {
    organizationId,
    kind: "ENROLL_TOKEN_CREATED",
    severity: "INFO",
    details: { enrollmentId: ins.rows[0].id, assetId, createdBy }
  });
  return {
    enrollmentId: ins.rows[0].id,
    token,
    expiresAt: ins.rows[0].expires_at,
    capabilities: caps,
    organizationId,
    assetId
  };
}

async function enrollAgent(pool, { token, name, agentVersion, metadata }) {
  const tokenHash = sha256Hex(token);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const enr = await client.query(
      `SELECT * FROM agent_enrollments WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash]
    );
    const row = enr.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      await recordAgentSecurityEvent(pool, {
        kind: "ENROLL_REJECT",
        severity: "WARNING",
        details: { reason: "unknown_token" }
      });
      const err = new Error("Invalid enrollment token");
      err.code = "ENROLL_INVALID";
      throw err;
    }
    if (row.status !== "PENDING") {
      await client.query("ROLLBACK");
      await recordAgentSecurityEvent(pool, {
        organizationId: row.organization_id,
        kind: "ENROLL_REPLAY",
        severity: "CRITICAL",
        details: { enrollmentId: row.id, status: row.status }
      });
      const err = new Error("Enrollment token already used or revoked");
      err.code = "ENROLL_REPLAY";
      throw err;
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await client.query(
        `UPDATE agent_enrollments SET status = 'EXPIRED' WHERE id = $1`,
        [row.id]
      );
      await client.query("COMMIT");
      const err = new Error("Enrollment token expired");
      err.code = "ENROLL_EXPIRED";
      throw err;
    }

    const caps = Array.isArray(row.capabilities) ? row.capabilities : JSON.parse(row.capabilities || "[]");
    const agentName = String(name || row.agent_name_hint || "argos-agent").slice(0, 120);
    const agentIns = await client.query(
      `INSERT INTO agents (
         organization_id, asset_id, name, status, capabilities, agent_version, metadata
       ) VALUES ($1,$2,$3,'ENROLLMENT_PENDING',$4::jsonb,$5,$6::jsonb)
       RETURNING id`,
      [
        row.organization_id,
        row.asset_id,
        agentName,
        JSON.stringify(caps),
        agentVersion ? String(agentVersion).slice(0, 64) : null,
        JSON.stringify(sanitizeMeta(metadata))
      ]
    );
    const agentId = agentIns.rows[0].id;
    const secret = generateAgentSecret();
    await client.query(
      `INSERT INTO agent_credentials (agent_id, organization_id, secret_hash, version, status)
       VALUES ($1,$2,$3,1,'ACTIVE')`,
      [agentId, row.organization_id, sha256Hex(secret)]
    );
    await client.query(
      `UPDATE agent_enrollments
       SET status = 'CONSUMED', consumed_at = NOW(), agent_id = $2
       WHERE id = $1`,
      [row.id, agentId]
    );
    await client.query("COMMIT");

    await recordAgentSecurityEvent(pool, {
      organizationId: row.organization_id,
      agentId,
      kind: "ENROLL_OK",
      severity: "INFO",
      details: { enrollmentId: row.id }
    });

    return {
      agentId,
      organizationId: row.organization_id,
      assetId: row.asset_id,
      capabilities: caps,
      credential: formatCredential(agentId, secret)
    };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

function sanitizeMeta(metadata) {
  if (!metadata || typeof metadata !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (/secret|token|password|key/i.test(k)) continue;
    if (typeof v === "string") out[String(k).slice(0, 40)] = v.slice(0, 120);
    if (typeof v === "number" && Number.isFinite(v)) out[String(k).slice(0, 40)] = v;
  }
  return out;
}

async function resolveAgentAuth(pool, authorizationHeader) {
  const parsed = parseCredential(authorizationHeader);
  if (!parsed) {
    const err = new Error("Invalid agent credential");
    err.code = "AGENT_AUTH_INVALID";
    throw err;
  }
  const { agentId, secret } = parsed;
  const q = await pool.query(
    `SELECT a.*, c.id AS credential_id, c.secret_hash, c.version AS credential_version, c.status AS credential_status
     FROM agents a
     JOIN agent_credentials c ON c.agent_id = a.id AND c.status = 'ACTIVE'
     WHERE a.id = $1
     ORDER BY c.version DESC
     LIMIT 1`,
    [agentId]
  );
  const row = q.rows[0];
  if (!row || row.status === AGENT_STATUS.REVOKED || row.credential_status === "REVOKED") {
    await recordAgentSecurityEvent(pool, {
      agentId,
      kind: "AUTH_REVOKED_OR_MISSING",
      severity: "WARNING",
      details: {}
    });
    const err = new Error("Agent revoked or unknown");
    err.code = "AGENT_REVOKED";
    throw err;
  }
  if (!hashMatches(secret, row.secret_hash)) {
    await recordAgentSecurityEvent(pool, {
      organizationId: row.organization_id,
      agentId,
      kind: "AUTH_FAIL",
      severity: "CRITICAL",
      details: {}
    });
    const err = new Error("Agent auth failed");
    err.code = "AGENT_AUTH_FAIL";
    throw err;
  }
  return {
    agentId: row.id,
    organizationId: row.organization_id,
    assetId: row.asset_id,
    status: row.status,
    capabilities: row.capabilities,
    lastSeq: Number(row.last_seq) || 0,
    lastSeenAt: row.last_seen_at,
    name: row.name
  };
}

async function recordHeartbeat(pool, agent, body) {
  const seq = Number(body.seq);
  if (!Number.isInteger(seq) || seq < 1) {
    const err = new Error("seq required");
    err.code = "INVALID_SEQ";
    throw err;
  }
  if (seq <= agent.lastSeq) {
    await recordAgentSecurityEvent(pool, {
      organizationId: agent.organizationId,
      agentId: agent.agentId,
      kind: "HEARTBEAT_REPLAY",
      severity: "WARNING",
      details: { seq, lastSeq: agent.lastSeq }
    });
    const err = new Error("Heartbeat seq replay");
    err.code = "REPLAY";
    throw err;
  }

  const receivedAt = new Date();
  const payload = sanitizeMeta(body.metadata || body.payload || {});
  try {
    await pool.query(
      `INSERT INTO agent_heartbeats (
         agent_id, organization_id, seq, agent_reported_at, received_at, agent_version, capabilities, payload
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)`,
      [
        agent.agentId,
        agent.organizationId,
        seq,
        body.agentReportedAt || body.agent_reported_at || null,
        receivedAt.toISOString(),
        body.agentVersion ? String(body.agentVersion).slice(0, 64) : null,
        JSON.stringify(agent.capabilities || []),
        JSON.stringify(payload)
      ]
    );
  } catch (e) {
    if (e && e.code === "23505") {
      const err = new Error("Heartbeat seq replay");
      err.code = "REPLAY";
      throw err;
    }
    throw e;
  }

  const status = deriveAgentStatus({
    status: AGENT_STATUS.ONLINE,
    lastSeenAt: receivedAt,
    now: receivedAt
  });

  await pool.query(
    `UPDATE agents
     SET last_seen_at = $2, last_seq = $3, status = $4, agent_version = COALESCE($5, agent_version), updated_at = NOW()
     WHERE id = $1`,
    [
      agent.agentId,
      receivedAt.toISOString(),
      seq,
      status,
      body.agentVersion ? String(body.agentVersion).slice(0, 64) : null
    ]
  );

  return { status, serverTime: receivedAt.toISOString(), seq };
}

async function ingestObservations(pool, agent, items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error("observations required");
    err.code = "INVALID_INPUT";
    throw err;
  }
  if (items.length > MAX_BATCH) {
    const err = new Error("batch too large");
    err.code = "BATCH_TOO_LARGE";
    throw err;
  }

  const accepted = [];
  const rejected = [];
  const receivedAt = new Date();

  for (const raw of items) {
    try {
      const type = String(raw.type || "").toUpperCase();
      const needed = observationCapability(type);
      if (!needed || !OBSERVATION_TYPES[type]) {
        throw Object.assign(new Error("Unknown type"), { code: "UNKNOWN_TYPE" });
      }
      if (!hasCapability(agent.capabilities, needed)) {
        throw Object.assign(new Error("Capability missing"), { code: "CAPABILITY_DENIED" });
      }

      // Tenant/asset spoof protection — credential binding wins
      const claimOrg = raw.organizationId ?? raw.organization_id;
      const claimAsset = raw.assetId ?? raw.asset_id;
      if (claimOrg != null && Number(claimOrg) !== Number(agent.organizationId)) {
        await recordAgentSecurityEvent(pool, {
          organizationId: agent.organizationId,
          agentId: agent.agentId,
          kind: "TENANT_SPOOF",
          severity: "CRITICAL",
          details: { claimOrg }
        });
        throw Object.assign(new Error("Org spoof"), { code: "TENANT_SPOOF" });
      }
      if (claimAsset != null && Number(claimAsset) !== Number(agent.assetId)) {
        await recordAgentSecurityEvent(pool, {
          organizationId: agent.organizationId,
          agentId: agent.agentId,
          kind: "ASSET_SPOOF",
          severity: "CRITICAL",
          details: { claimAsset }
        });
        throw Object.assign(new Error("Asset spoof"), { code: "ASSET_SPOOF" });
      }

      const idem = String(raw.idempotencyKey || raw.idempotency_key || "").slice(0, 128);
      if (!idem) {
        throw Object.assign(new Error("idempotencyKey required"), { code: "INVALID_INPUT" });
      }
      const measurement = validateMeasurement(type, raw.measurement || raw.payload || {});
      const observedAt = raw.observedAt || raw.observed_at || receivedAt.toISOString();
      const schemaVersion = Number(raw.schemaVersion || raw.schema_version || 1) || 1;

      const existing = await pool.query(
        `SELECT id, status FROM agent_observations WHERE agent_id = $1 AND idempotency_key = $2`,
        [agent.agentId, idem]
      );
      if (existing.rows[0]) {
        accepted.push({ idempotencyKey: idem, duplicate: true, id: existing.rows[0].id });
        continue;
      }

      const ok =
        classifyOk(type, measurement);
      const errorClass = ok ? null : errorClassFor(type, measurement);
      const proj = await pool.query(
        `INSERT INTO observations (
           organization_id, monitor_id, asset_id, observed_at, ok, error_class,
           classification, evidence, source
         ) VALUES ($1, NULL, $2, $3, $4, $5, 'DETECTED', $6::jsonb, 'AGENT')
         RETURNING id`,
        [
          agent.organizationId,
          agent.assetId,
          observedAt,
          ok,
          errorClass,
          JSON.stringify({
            agentId: agent.agentId,
            type,
            measurement,
            schemaVersion
          })
        ]
      );

      const ins = await pool.query(
        `INSERT INTO agent_observations (
           agent_id, organization_id, asset_id, type, schema_version, idempotency_key,
           observed_at, received_at, status, measurement, projected_observation_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACCEPTED',$9::jsonb,$10)
         RETURNING id`,
        [
          agent.agentId,
          agent.organizationId,
          agent.assetId,
          type,
          schemaVersion,
          idem,
          observedAt,
          receivedAt.toISOString(),
          JSON.stringify(measurement),
          proj.rows[0].id
        ]
      );
      accepted.push({ idempotencyKey: idem, id: ins.rows[0].id, projectedObservationId: proj.rows[0].id });
    } catch (e) {
      rejected.push({
        idempotencyKey: raw?.idempotencyKey || raw?.idempotency_key || null,
        code: e.code || "REJECTED",
        error: e.message
      });
      if (e.code === "TENANT_SPOOF" || e.code === "ASSET_SPOOF") {
        // already audited
      }
    }
  }

  await pool.query(
    `UPDATE agents SET last_seen_at = NOW(), status = 'ONLINE', updated_at = NOW() WHERE id = $1 AND status <> 'REVOKED'`,
    [agent.agentId]
  );

  return { accepted, rejected, serverTime: receivedAt.toISOString() };
}

function classifyOk(type, m) {
  const { classifyAgentMeasurement } = require("./schemas");
  const c = classifyAgentMeasurement(type, m);
  return c === "OK";
}

function errorClassFor(type, m) {
  const { classifyAgentMeasurement } = require("./schemas");
  const c = classifyAgentMeasurement(type, m);
  if (c === "CRITICAL") return `AGENT_${type}_CRITICAL`;
  if (c === "WARNING") return `AGENT_${type}_WARNING`;
  if (c === "UNKNOWN") return `AGENT_${type}_UNKNOWN`;
  return `AGENT_${type}`;
}

async function revokeAgent(pool, { agentId, organizationId, actorId }) {
  const q = await pool.query(`SELECT * FROM agents WHERE id = $1`, [agentId]);
  const agent = q.rows[0];
  if (!agent) {
    const err = new Error("Not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (organizationId != null && Number(agent.organization_id) !== Number(organizationId)) {
    const err = new Error("Org mismatch");
    err.code = "TENANT_SPOOF";
    throw err;
  }
  await pool.query(
    `UPDATE agents SET status = 'REVOKED', revoked_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [agentId]
  );
  await pool.query(
    `UPDATE agent_credentials SET status = 'REVOKED', revoked_at = NOW() WHERE agent_id = $1 AND status = 'ACTIVE'`,
    [agentId]
  );
  await recordAgentSecurityEvent(pool, {
    organizationId: agent.organization_id,
    agentId,
    kind: "AGENT_REVOKED",
    severity: "WARNING",
    details: { actorId }
  });
  return { ok: true };
}

async function rotateAgentCredential(pool, agentAuth) {
  const secret = generateAgentSecret();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ver = await client.query(
      `SELECT COALESCE(MAX(version), 0) AS v FROM agent_credentials WHERE agent_id = $1`,
      [agentAuth.agentId]
    );
    const next = Number(ver.rows[0].v) + 1;
    await client.query(
      `UPDATE agent_credentials SET status = 'REVOKED', revoked_at = NOW()
       WHERE agent_id = $1 AND status = 'ACTIVE'`,
      [agentAuth.agentId]
    );
    await client.query(
      `INSERT INTO agent_credentials (agent_id, organization_id, secret_hash, version, status)
       VALUES ($1,$2,$3,$4,'ACTIVE')`,
      [agentAuth.agentId, agentAuth.organizationId, sha256Hex(secret), next]
    );
    await client.query("COMMIT");
    await recordAgentSecurityEvent(pool, {
      organizationId: agentAuth.organizationId,
      agentId: agentAuth.agentId,
      kind: "CREDENTIAL_ROTATED",
      severity: "INFO",
      details: { version: next }
    });
    return {
      credential: formatCredential(agentAuth.agentId, secret),
      version: next
    };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

async function nocForceRotate(pool, { agentId, actorId }) {
  const auth = await pool.query(`SELECT id, organization_id, status FROM agents WHERE id = $1`, [agentId]);
  if (!auth.rows[0] || auth.rows[0].status === "REVOKED") {
    const err = new Error("Not found or revoked");
    err.code = "NOT_FOUND";
    throw err;
  }
  const result = await rotateAgentCredential(pool, {
    agentId: auth.rows[0].id,
    organizationId: auth.rows[0].organization_id
  });
  await recordAgentSecurityEvent(pool, {
    organizationId: auth.rows[0].organization_id,
    agentId,
    kind: "NOC_FORCE_ROTATE",
    severity: "WARNING",
    details: { actorId }
  });
  return result;
}

async function refreshStaleAgents(pool, now = new Date()) {
  const q = await pool.query(
    `SELECT id, organization_id, status, last_seen_at FROM agents WHERE status NOT IN ('REVOKED', 'ENROLLMENT_PENDING')`
  );
  let updated = 0;
  for (const row of q.rows) {
    const next = deriveAgentStatus({
      status: row.status,
      lastSeenAt: row.last_seen_at,
      now
    });
    if (next !== row.status) {
      await pool.query(`UPDATE agents SET status = $2, updated_at = NOW() WHERE id = $1`, [row.id, next]);
      updated += 1;
    }
  }
  return updated;
}

function serializeAgent(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name || null,
    assetId: row.asset_id,
    assetHostname: row.asset_hostname || null,
    name: row.name,
    status: deriveAgentStatus({ status: row.status, lastSeenAt: row.last_seen_at }),
    storedStatus: row.status,
    capabilities: row.capabilities,
    agentVersion: row.agent_version,
    lastSeenAt: row.last_seen_at,
    lastSeq: row.last_seq,
    createdAt: row.created_at,
    revokedAt: row.revoked_at
  };
}

module.exports = {
  createEnrollment,
  enrollAgent,
  resolveAgentAuth,
  recordHeartbeat,
  ingestObservations,
  revokeAgent,
  rotateAgentCredential,
  nocForceRotate,
  refreshStaleAgents,
  serializeAgent,
  ENROLL_TTL_MS,
  MAX_BATCH
};
