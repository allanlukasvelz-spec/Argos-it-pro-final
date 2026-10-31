/**
 * Phase 7 — explicit capability allowlist (safe read-only observation only).
 * Anything not listed is REJECTED. No shell/SQL/exec/HTTP mutate.
 */

const CAPABILITIES = Object.freeze({
  HEARTBEAT: "HEARTBEAT",
  SYSTEM_METRICS_READ: "SYSTEM_METRICS_READ",
  CPU_READ: "CPU_READ",
  MEMORY_READ: "MEMORY_READ",
  DISK_READ: "DISK_READ",
  LOAD_READ: "LOAD_READ",
  SERVICE_HEALTH_READ: "SERVICE_HEALTH_READ",
  NETWORK_HEALTH_READ: "NETWORK_HEALTH_READ",
  SAFE_LOCAL_PROBE: "SAFE_LOCAL_PROBE"
});

const ALL = Object.freeze(Object.values(CAPABILITIES));

const DEFAULT_MVP = Object.freeze([
  CAPABILITIES.HEARTBEAT,
  CAPABILITIES.SYSTEM_METRICS_READ,
  CAPABILITIES.CPU_READ,
  CAPABILITIES.MEMORY_READ,
  CAPABILITIES.DISK_READ,
  CAPABILITIES.LOAD_READ,
  CAPABILITIES.SERVICE_HEALTH_READ,
  CAPABILITIES.NETWORK_HEALTH_READ,
  CAPABILITIES.SAFE_LOCAL_PROBE
]);

/** Observation types bound to capabilities */
const OBSERVATION_TYPES = Object.freeze({
  SYSTEM_METRICS: { capability: CAPABILITIES.SYSTEM_METRICS_READ, schemaVersion: 1 },
  CPU: { capability: CAPABILITIES.CPU_READ, schemaVersion: 1 },
  MEMORY: { capability: CAPABILITIES.MEMORY_READ, schemaVersion: 1 },
  DISK: { capability: CAPABILITIES.DISK_READ, schemaVersion: 1 },
  LOAD: { capability: CAPABILITIES.LOAD_READ, schemaVersion: 1 },
  SERVICE_HEALTH: { capability: CAPABILITIES.SERVICE_HEALTH_READ, schemaVersion: 1 },
  NETWORK_HEALTH: { capability: CAPABILITIES.NETWORK_HEALTH_READ, schemaVersion: 1 },
  SAFE_LOCAL_PROBE: { capability: CAPABILITIES.SAFE_LOCAL_PROBE, schemaVersion: 1 }
});

const REJECTED_CAPABILITIES = Object.freeze([
  "SHELL",
  "EXEC",
  "SQL",
  "HTTP_MUTATE",
  "FILESYSTEM_BROWSE",
  "REMOTE_REMEDIATION",
  "ARBITRARY_COMMAND"
]);

function normalizeCapabilityList(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return [...DEFAULT_MVP];
  }
  const out = [];
  const seen = new Set();
  for (const raw of input) {
    const c = String(raw || "").trim().toUpperCase();
    if (!c) continue;
    if (REJECTED_CAPABILITIES.includes(c) || !ALL.includes(c)) {
      const err = new Error(`Capability not allowlisted: ${c}`);
      err.code = "CAPABILITY_REJECTED";
      throw err;
    }
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  if (!out.includes(CAPABILITIES.HEARTBEAT)) {
    out.unshift(CAPABILITIES.HEARTBEAT);
  }
  return out;
}

function hasCapability(granted, needed) {
  const list = Array.isArray(granted) ? granted : [];
  return list.map((x) => String(x).toUpperCase()).includes(String(needed).toUpperCase());
}

function observationCapability(type) {
  const t = String(type || "").toUpperCase();
  const meta = OBSERVATION_TYPES[t];
  if (!meta) return null;
  return meta.capability;
}

module.exports = {
  CAPABILITIES,
  ALL,
  DEFAULT_MVP,
  OBSERVATION_TYPES,
  REJECTED_CAPABILITIES,
  normalizeCapabilityList,
  hasCapability,
  observationCapability
};
