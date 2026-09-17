#!/usr/bin/env node
/**
 * Gate MinIO live validation for verify:backend.
 * Runs only when ARGOS_MINIO_POC=1; otherwise skips with exit 0.
 */
if (process.env.ARGOS_MINIO_POC !== "1") {
  console.log("[verify] MinIO live validation SKIPPED (set ARGOS_MINIO_POC=1 to run)");
  process.exit(0);
}

console.log("[verify] MinIO live validation RUNNING (ARGOS_MINIO_POC=1)");

const { runMinioLiveFlow } = require("../backend/scripts/evidence-minio-live-flow");

runMinioLiveFlow().catch((err) => {
  console.error("[verify] MinIO live validation FAILED");
  console.error(err.message || err);
  process.exit(1);
});
