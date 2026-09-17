/**
 * Platform storage class taxonomy (foundation).
 * Every dataset must declare exactly one primary class.
 */
const STORAGE_CLASSES = Object.freeze({
  TRANSACTIONAL: "TRANSACTIONAL",
  TIME_SERIES: "TIME_SERIES",
  LOG: "LOG",
  OBJECT: "OBJECT",
  CACHE: "CACHE",
  EPHEMERAL: "EPHEMERAL"
});

const DATASET_CLASS = Object.freeze({
  organizations: STORAGE_CLASSES.TRANSACTIONAL,
  assets: STORAGE_CLASSES.TRANSACTIONAL,
  monitors: STORAGE_CLASSES.TRANSACTIONAL,
  observations: STORAGE_CLASSES.TRANSACTIONAL,
  alerts: STORAGE_CLASSES.TRANSACTIONAL,
  incidents: STORAGE_CLASSES.TRANSACTIONAL,
  agents: STORAGE_CLASSES.TRANSACTIONAL,
  agent_observations: STORAGE_CLASSES.TRANSACTIONAL,
  remediation_executions: STORAGE_CLASSES.TRANSACTIONAL,
  evidence_objects_future: STORAGE_CLASSES.OBJECT,
  prometheus_samples_future: STORAGE_CLASSES.TIME_SERIES,
  access_logs: STORAGE_CLASSES.LOG,
  agent_spool: STORAGE_CLASSES.EPHEMERAL,
  rate_limit_counters: STORAGE_CLASSES.CACHE
});

function assertStorageClass(name) {
  if (!Object.values(STORAGE_CLASSES).includes(name)) {
    const err = new Error(`Unknown storage class: ${name}`);
    err.code = "UNKNOWN_STORAGE_CLASS";
    throw err;
  }
  return name;
}

module.exports = { STORAGE_CLASSES, DATASET_CLASS, assertStorageClass };
