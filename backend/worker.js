#!/usr/bin/env node
/**
 * Phase 8 platform worker — claims PostgreSQL jobs and runs typed handlers.
 * Staging: supervised via Compose (Dockerfile.worker). No inbound port.
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const fs = require("fs");
const os = require("os");
const pool = require("./db");
const { configureEvidenceStore } = require("./lib/platform/evidenceStore");
const { ensurePhase8Tables } = require("./lib/ensurePhase8Tables");
const { ensureEvidenceObjectsTable } = require("./lib/ensureEvidenceObjects");
const { createPlatformJobService } = require("./lib/platform/platformJobs");
const { dispatchJob } = require("./lib/platform/jobHandlers");

const WORKER_ID = `${os.hostname()}-${process.pid}`;
const POLL_MS = Number(process.env.ARGOS_WORKER_POLL_MS || 2000);
const HEARTBEAT_PATH =
  process.env.ARGOS_WORKER_HEARTBEAT_PATH || "/tmp/argos-worker-heartbeat";

let shuttingDown = false;
let inFlight = false;
let loopTimer = null;

function writeHeartbeat() {
  try {
    fs.writeFileSync(HEARTBEAT_PATH, String(Date.now()), "utf8");
  } catch (err) {
    console.error("[WORKER] heartbeat write failed:", err.message);
  }
}

async function processOne(jobs) {
  const job = await jobs.claimNext(WORKER_ID);
  if (!job) return false;
  inFlight = true;
  await jobs.markRunning(job.id);
  try {
    await dispatchJob(pool, job);
    await jobs.markCompleted(job.id);
  } catch (err) {
    console.error(`[WORKER] job ${job.id} (${job.job_type}) failed:`, err.message);
    await jobs.markFailed(job.id, err.message, { retry: true });
  } finally {
    inFlight = false;
  }
  return true;
}

function requestShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[WORKER] ${signal} received — draining in-flight job then exit`);
  if (loopTimer) clearTimeout(loopTimer);
  const wait = async () => {
    const deadline = Date.now() + 55_000;
    while (inFlight && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (inFlight) {
      console.error("[WORKER] drain timeout — exiting with in-flight job (stale reclaim will recover)");
    } else {
      console.log("[WORKER] drain complete — exit 0");
    }
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
    process.exit(inFlight ? 1 : 0);
  };
  wait();
}

async function main() {
  configureEvidenceStore();
  await ensureEvidenceObjectsTable(pool);
  await ensurePhase8Tables(pool);

  const jobs = createPlatformJobService(pool);
  console.log(
    `[WORKER] started id=${WORKER_ID} poll=${POLL_MS}ms heartbeat=${HEARTBEAT_PATH}`
  );
  writeHeartbeat();

  process.on("SIGTERM", () => requestShutdown("SIGTERM"));
  process.on("SIGINT", () => requestShutdown("SIGINT"));

  const loop = async () => {
    if (shuttingDown) return;
    writeHeartbeat();
    try {
      let busy = true;
      while (busy && !shuttingDown) {
        busy = await processOne(jobs);
        writeHeartbeat();
      }
    } catch (err) {
      console.error("[WORKER] loop error:", err.message);
    }
    if (!shuttingDown) {
      loopTimer = setTimeout(loop, POLL_MS);
    }
  };

  loop();
}

main().catch((err) => {
  console.error("[WORKER] fatal:", err);
  process.exit(1);
});
