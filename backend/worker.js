#!/usr/bin/env node
/**
 * Phase 8 platform worker — claims PostgreSQL jobs and runs typed handlers.
 * Usage: node backend/worker.js
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const os = require("os");
const pool = require("./db");
const { configureEvidenceStore } = require("./lib/platform/evidenceStore");
const { ensurePhase8Tables } = require("./lib/ensurePhase8Tables");
const { ensureEvidenceObjectsTable } = require("./lib/ensureEvidenceObjects");
const { createPlatformJobService } = require("./lib/platform/platformJobs");
const { dispatchJob } = require("./lib/platform/jobHandlers");

const WORKER_ID = `${os.hostname()}-${process.pid}`;
const POLL_MS = Number(process.env.ARGOS_WORKER_POLL_MS || 2000);

async function processOne(jobs) {
  const job = await jobs.claimNext(WORKER_ID);
  if (!job) return false;
  await jobs.markRunning(job.id);
  try {
    await dispatchJob(pool, job);
    await jobs.markCompleted(job.id);
  } catch (err) {
    console.error(`[WORKER] job ${job.id} (${job.job_type}) failed:`, err.message);
    await jobs.markFailed(job.id, err.message, { retry: true });
  }
  return true;
}

async function main() {
  configureEvidenceStore();
  await ensureEvidenceObjectsTable(pool);
  await ensurePhase8Tables(pool);

  const jobs = createPlatformJobService(pool);
  console.log(`[WORKER] started id=${WORKER_ID} poll=${POLL_MS}ms`);

  const loop = async () => {
    try {
      let busy = true;
      while (busy) {
        busy = await processOne(jobs);
      }
    } catch (err) {
      console.error("[WORKER] loop error:", err.message);
    }
    setTimeout(loop, POLL_MS);
  };

  loop();
}

main().catch((err) => {
  console.error("[WORKER] fatal:", err);
  process.exit(1);
});
