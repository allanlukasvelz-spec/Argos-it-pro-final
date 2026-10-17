"use strict";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function parseEnvText(text = "") {
  const values = {};
  for (const line of String(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function classifyBackendUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "ABSENT";
  let url;
  try {
    url = new URL(raw);
  } catch {
    return "INVALID";
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (LOCAL_HOSTS.has(host) || host.endsWith(".local")) return "LOCAL";
  if (url.protocol !== "https:") return "NOT_HTTPS";
  return "PUBLIC_HTTPS";
}

function resolvePublicBackendUrl({ env = {}, files = {} } = {}) {
  const order = [".env", ".env.production", ".env.local", ".env.production.local"];
  let value = "";
  for (const name of order) {
    const parsed = parseEnvText(files[name] || "");
    if (Object.prototype.hasOwnProperty.call(parsed, "NEXT_PUBLIC_BACKEND_URL")) {
      value = parsed.NEXT_PUBLIC_BACKEND_URL;
    }
  }
  if (String(env.NEXT_PUBLIC_BACKEND_URL || "").trim()) {
    value = String(env.NEXT_PUBLIC_BACKEND_URL).trim();
  }
  return value;
}

function evaluateReleaseBuild({ env = {}, files = {} } = {}) {
  if (String(env.ARGOS_RELEASE_BUILD || "") !== "1") {
    return { required: false, status: "SKIPPED", kind: null };
  }
  const kind = classifyBackendUrl(resolvePublicBackendUrl({ env, files }));
  if (kind !== "PUBLIC_HTTPS") {
    return { required: true, status: "FAIL", kind };
  }
  return { required: true, status: "PASS", kind };
}

module.exports = {
  parseEnvText,
  classifyBackendUrl,
  resolvePublicBackendUrl,
  evaluateReleaseBuild
};
