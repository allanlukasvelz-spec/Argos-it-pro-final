/**
 * Durable PostgreSQL job queue — ADR-004.
 */
const { ALLOWED_JOB_TYPES } = require("../reports/reportConstants");

const STALE_CLAIM_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

class PlatformJobError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function assertJobType(jobType) {
  if (!ALLOWED_JOB_TYPES.includes(jobType)) {
    throw new PlatformJobError("INVALID_JOB_TYPE", `Job type not allowed: ${jobType}`);
  }
}

function computeRetryDelayMs(attempts) {
  const base = Math.min(1000 * 2 ** attempts, 60000);
  return base + Math.floor(Math.random() * 500);
}

function createPlatformJobService(pool) {
  async function enqueue({
    jobType,
    organizationId = null,
    payload,
    idempotencyKey,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    runAfter = new Date()
  }) {
    assertJobType(jobType);
    if (!idempotencyKey) {
      throw new PlatformJobError("IDEMPOTENCY_REQUIRED", "idempotencyKey required");
    }
    const existing = await pool.query(
      `SELECT id, status FROM platform_jobs WHERE idempotency_key = $1`,
      [idempotencyKey]
    );
    if (existing.rows[0]) {
      return { job: existing.rows[0], created: false };
    }
    const insert = await pool.query(
      `INSERT INTO platform_jobs (
         job_type, organization_id, payload, idempotency_key, max_attempts, run_after
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [jobType, organizationId, JSON.stringify(payload || {}), idempotencyKey, maxAttempts, runAfter]
    );
    return { job: insert.rows[0], created: true };
  }

  async function reclaimStaleClaims() {
    const cutoff = new Date(Date.now() - STALE_CLAIM_MS);
    const r = await pool.query(
      `UPDATE platform_jobs
       SET status = 'RETRY_WAIT',
           run_after = NOW() + INTERVAL '30 seconds',
           claimed_by = NULL,
           claimed_at = NULL,
           last_error = COALESCE(last_error, '') || ' [stale claim reclaimed]',
           updated_at = NOW()
       WHERE status IN ('CLAIMED', 'RUNNING')
         AND claimed_at IS NOT NULL
         AND claimed_at < $1
       RETURNING id`,
      [cutoff]
    );
    return r.rowCount;
  }

  async function claimNext(workerId) {
    await reclaimStaleClaims();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const sel = await client.query(
        `SELECT * FROM platform_jobs
         WHERE status IN ('QUEUED', 'RETRY_WAIT')
           AND run_after <= NOW()
         ORDER BY id ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1`
      );
      const job = sel.rows[0];
      if (!job) {
        await client.query("COMMIT");
        return null;
      }
      const upd = await client.query(
        `UPDATE platform_jobs
         SET status = 'CLAIMED',
             claimed_by = $2,
             claimed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [job.id, workerId]
      );
      await client.query("COMMIT");
      return upd.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async function markRunning(jobId) {
    await pool.query(
      `UPDATE platform_jobs
       SET status = 'RUNNING', started_at = COALESCE(started_at, NOW()), updated_at = NOW()
       WHERE id = $1`,
      [jobId]
    );
  }

  async function markCompleted(jobId) {
    await pool.query(
      `UPDATE platform_jobs
       SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW(), last_error = NULL
       WHERE id = $1`,
      [jobId]
    );
  }

  async function markFailed(jobId, errorMessage, { retry = true } = {}) {
    const r = await pool.query(`SELECT * FROM platform_jobs WHERE id = $1`, [jobId]);
    const job = r.rows[0];
    if (!job) return;
    const attempts = Number(job.attempts || 0) + 1;
    const maxAttempts = Number(job.max_attempts || DEFAULT_MAX_ATTEMPTS);
    const sanitized = String(errorMessage || "unknown").slice(0, 2000);

    if (retry && attempts < maxAttempts) {
      const delayMs = computeRetryDelayMs(attempts);
      await pool.query(
        `UPDATE platform_jobs
         SET status = 'RETRY_WAIT',
             attempts = $2,
             run_after = NOW() + ($3 || ' milliseconds')::interval,
             last_error = $4,
             claimed_by = NULL,
             claimed_at = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [jobId, attempts, String(delayMs), sanitized]
      );
      return { deadLetter: false, attempts };
    }

    await pool.query(
      `UPDATE platform_jobs
       SET status = 'DEAD_LETTER',
           attempts = $2,
           last_error = $3,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [jobId, attempts, sanitized]
    );
    return { deadLetter: true, attempts };
  }

  return {
    enqueue,
    claimNext,
    markRunning,
    markCompleted,
    markFailed,
    reclaimStaleClaims
  };
}

module.exports = {
  PlatformJobError,
  createPlatformJobService,
  STALE_CLAIM_MS
};
