/**
 * Platform job queue unit tests
 */
const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createPlatformJobService, PlatformJobError } = require("./platformJobs");

function createMemoryPool() {
  const jobs = [];
  let idSeq = 1;
  const pool = {
    jobs,
    query: async (sql, params = []) => {
      const s = String(sql).replace(/\s+/g, " ").trim();
      if (s.startsWith("INSERT INTO platform_jobs")) {
        const row = {
          id: idSeq++,
          job_type: params[0],
          organization_id: params[1],
          payload: JSON.parse(params[2]),
          idempotency_key: params[3],
          max_attempts: params[4],
          run_after: params[5],
          status: "QUEUED",
          attempts: 0,
          claimed_by: null,
          claimed_at: null
        };
        if (jobs.find((j) => j.idempotency_key === row.idempotency_key)) {
          const err = new Error("dup");
          err.code = "23505";
          throw err;
        }
        jobs.push(row);
        return { rows: [row] };
      }
      if (s.includes("FROM platform_jobs WHERE idempotency_key")) {
        const row = jobs.find((j) => j.idempotency_key === params[0]);
        return { rows: row ? [row] : [] };
      }
      if (s.includes("FOR UPDATE SKIP LOCKED")) {
        const row = jobs.find(
          (j) =>
            (j.status === "QUEUED" || j.status === "RETRY_WAIT") &&
            new Date(j.run_after) <= new Date()
        );
        return { rows: row ? [row] : [] };
      }
      if (s.startsWith("UPDATE platform_jobs") && s.includes("CLAIMED")) {
        const job = jobs.find((j) => j.id === params[0]);
        if (job) {
          job.status = "CLAIMED";
          job.claimed_by = params[1];
          job.claimed_at = new Date();
        }
        return { rows: job ? [job] : [] };
      }
      if (s.includes("status = 'RUNNING'")) {
        const job = jobs.find((j) => j.id === params[0]);
        if (job) job.status = "RUNNING";
        return { rows: [] };
      }
      if (s.includes("status = 'COMPLETED'")) {
        const job = jobs.find((j) => j.id === params[0]);
        if (job) job.status = "COMPLETED";
        return { rows: [] };
      }
      if (s.includes("FROM platform_jobs WHERE id =")) {
        return { rows: jobs.filter((j) => j.id === params[0]) };
      }
      if (s.includes("status = 'RETRY_WAIT'")) {
        const job = jobs.find((j) => j.id === params[0]);
        if (job) {
          job.status = "RETRY_WAIT";
          job.attempts = params[1];
        }
        return { rows: [] };
      }
      if (s.includes("status = 'DEAD_LETTER'")) {
        const job = jobs.find((j) => j.id === params[0]);
        if (job) job.status = "DEAD_LETTER";
        return { rows: [] };
      }
      if (s.includes("status IN ('CLAIMED', 'RUNNING')")) {
        return { rows: [], rowCount: 0 };
      }
      if (s === "BEGIN" || s === "COMMIT" || s === "ROLLBACK") {
        return { rows: [] };
      }
      return { rows: [] };
    },
    connect: async () => ({
      query: (sql, params) => pool.query(sql, params),
      release: () => {}
    })
  };
  return pool;
}

describe("platformJobs", () => {
  it("rejects invalid job type", async () => {
    const pool = createMemoryPool();
    const svc = createPlatformJobService(pool);
    await assert.rejects(
      () => svc.enqueue({ jobType: "EVIL", payload: {}, idempotencyKey: "k1" }),
      (e) => e instanceof PlatformJobError
    );
  });

  it("dedupes by idempotency key", async () => {
    const pool = createMemoryPool();
    const svc = createPlatformJobService(pool);
    const a = await svc.enqueue({
      jobType: "REPORT_GENERATE",
      payload: { x: 1 },
      idempotencyKey: "same-key"
    });
    const b = await svc.enqueue({
      jobType: "REPORT_GENERATE",
      payload: { x: 2 },
      idempotencyKey: "same-key"
    });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.job.id, b.job.id);
  });
});
