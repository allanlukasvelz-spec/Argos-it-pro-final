/**
 * Phase 7 — typed observation schema validators (aggregate-only).
 * Reject unknown fields that look like secrets / paths / commands.
 */
const MAX_MEASUREMENT_BYTES = 8 * 1024;
const FORBIDDEN_KEYS = new Set([
  "password",
  "secret",
  "token",
  "api_key",
  "apikey",
  "private_key",
  "privatekey",
  "authorization",
  "command",
  "shell",
  "sql",
  "script",
  "path",
  "file_contents",
  "contents",
  "payload_exec"
]);

function assertNoForbiddenKeys(obj, path = "") {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  for (const [k, v] of Object.entries(obj)) {
    const key = String(k).toLowerCase();
    if (FORBIDDEN_KEYS.has(key)) {
      const err = new Error(`Forbidden measurement key: ${path}${k}`);
      err.code = "FORBIDDEN_FIELD";
      throw err;
    }
    if (v && typeof v === "object") assertNoForbiddenKeys(v, `${path}${k}.`);
  }
}

function sizeOk(measurement) {
  const raw = JSON.stringify(measurement || {});
  if (raw.length > MAX_MEASUREMENT_BYTES) {
    const err = new Error("Measurement too large");
    err.code = "PAYLOAD_TOO_LARGE";
    throw err;
  }
}

function num(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (min != null && n < min) return null;
  if (max != null && n > max) return null;
  return n;
}

function validateMeasurement(type, measurement) {
  const t = String(type || "").toUpperCase();
  const m = measurement && typeof measurement === "object" ? measurement : {};
  assertNoForbiddenKeys(m);
  sizeOk(m);

  switch (t) {
    case "CPU": {
      const usagePercent = num(m.usagePercent, 0, 100);
      if (usagePercent == null) {
        const err = new Error("CPU requires usagePercent 0-100");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return { usagePercent, cores: num(m.cores, 1, 1024) ?? undefined };
    }
    case "MEMORY": {
      const usedPercent = num(m.usedPercent, 0, 100);
      if (usedPercent == null) {
        const err = new Error("MEMORY requires usedPercent 0-100");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return {
        usedPercent,
        totalMb: num(m.totalMb, 0, 1e9) ?? undefined,
        availableMb: num(m.availableMb, 0, 1e9) ?? undefined
      };
    }
    case "DISK": {
      const usedPercent = num(m.usedPercent, 0, 100);
      if (usedPercent == null || !m.mount || typeof m.mount !== "string") {
        const err = new Error("DISK requires mount + usedPercent");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      const mount = String(m.mount).slice(0, 64);
      if (mount.includes("..") || /[;\|&`$]/.test(mount)) {
        const err = new Error("Invalid mount");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return { mount, usedPercent, totalGb: num(m.totalGb, 0, 1e7) ?? undefined };
    }
    case "LOAD": {
      const load1 = num(m.load1, 0, 1e6);
      if (load1 == null) {
        const err = new Error("LOAD requires load1");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return {
        load1,
        load5: num(m.load5, 0, 1e6) ?? undefined,
        load15: num(m.load15, 0, 1e6) ?? undefined
      };
    }
    case "SYSTEM_METRICS": {
      return {
        uptimeSec: num(m.uptimeSec, 0, 1e12) ?? undefined,
        cpu: m.cpu != null ? validateMeasurement("CPU", m.cpu) : undefined,
        memory: m.memory != null ? validateMeasurement("MEMORY", m.memory) : undefined,
        load: m.load != null ? validateMeasurement("LOAD", m.load) : undefined
      };
    }
    case "SERVICE_HEALTH": {
      const name = String(m.name || "").trim().slice(0, 80);
      const state = String(m.state || "").toUpperCase();
      if (!name || !["UP", "DOWN", "DEGRADED", "UNKNOWN"].includes(state)) {
        const err = new Error("SERVICE_HEALTH requires name + state");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return { name, state };
    }
    case "NETWORK_HEALTH": {
      const state = String(m.state || "").toUpperCase();
      if (!["OK", "DEGRADED", "DOWN", "UNKNOWN"].includes(state)) {
        const err = new Error("NETWORK_HEALTH requires state");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return {
        state,
        interfaceCount: num(m.interfaceCount, 0, 1024) ?? undefined
      };
    }
    case "SAFE_LOCAL_PROBE": {
      const probe = String(m.probe || "").toUpperCase();
      const allowed = new Set(["PROCESS_ALIVE", "PORT_LOCAL_LISTEN", "DISK_MOUNT_EXISTS"]);
      if (!allowed.has(probe)) {
        const err = new Error("SAFE_LOCAL_PROBE probe not allowlisted");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      const ok = m.ok === true || m.ok === false ? m.ok : null;
      if (ok == null) {
        const err = new Error("SAFE_LOCAL_PROBE requires ok boolean");
        err.code = "SCHEMA_INVALID";
        throw err;
      }
      return {
        probe,
        ok,
        target: m.target != null ? String(m.target).slice(0, 80) : undefined
      };
    }
    default: {
      const err = new Error(`Unknown observation type: ${t}`);
      err.code = "UNKNOWN_TYPE";
      throw err;
    }
  }
}

/**
 * Map validated measurement → health contribution for asset merge.
 * @returns {'CRITICAL'|'WARNING'|'OK'|'UNKNOWN'}
 */
function classifyAgentMeasurement(type, measurement) {
  const t = String(type || "").toUpperCase();
  const m = measurement || {};
  if (t === "DISK" && typeof m.usedPercent === "number") {
    if (m.usedPercent >= 95) return "CRITICAL";
    if (m.usedPercent >= 85) return "WARNING";
    return "OK";
  }
  if (t === "MEMORY" && typeof m.usedPercent === "number") {
    if (m.usedPercent >= 98) return "CRITICAL";
    if (m.usedPercent >= 90) return "WARNING";
    return "OK";
  }
  if (t === "CPU" && typeof m.usagePercent === "number") {
    if (m.usagePercent >= 98) return "WARNING";
    return "OK";
  }
  if (t === "SERVICE_HEALTH") {
    if (m.state === "DOWN") return "CRITICAL";
    if (m.state === "DEGRADED") return "WARNING";
    if (m.state === "UNKNOWN") return "UNKNOWN";
    return "OK";
  }
  if (t === "NETWORK_HEALTH") {
    if (m.state === "DOWN") return "CRITICAL";
    if (m.state === "DEGRADED") return "WARNING";
    if (m.state === "UNKNOWN") return "UNKNOWN";
    return "OK";
  }
  if (t === "SAFE_LOCAL_PROBE") {
    if (m.ok === false) return "WARNING";
    if (m.ok === true) return "OK";
    return "UNKNOWN";
  }
  if (t === "SYSTEM_METRICS") {
    const parts = [m.cpu, m.memory, m.load].filter(Boolean);
    if (!parts.length && m.uptimeSec == null) return "UNKNOWN";
    return "OK";
  }
  if (t === "LOAD") return "OK";
  return "UNKNOWN";
}

module.exports = {
  MAX_MEASUREMENT_BYTES,
  validateMeasurement,
  classifyAgentMeasurement,
  assertNoForbiddenKeys
};
