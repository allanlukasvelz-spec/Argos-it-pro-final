#!/usr/bin/env node
/**
 * ARGOS Phase 7 — reference technical agent (observation only).
 * Features: enroll, heartbeat, typed observations, bounded offline spool, retry+jitter.
 * NO shell, SQL, exec, HTTP mutation, or remediation.
 *
 * Usage:
 *   ARGOS_API=http://127.0.0.1:4000 \
 *   ARGOS_ENROLL_TOKEN=enr_... \
 *   node agents/argos-agent-ref/index.js
 *
 * After enroll, set ARGOS_AGENT_CREDENTIAL=agentId.secret
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const API = process.env.ARGOS_API || "http://127.0.0.1:4000";
const SPOOL_PATH = process.env.ARGOS_SPOOL_PATH || path.join(os.tmpdir(), "argos-agent-spool.json");
const SPOOL_MAX_ITEMS = Number(process.env.ARGOS_SPOOL_MAX) || 200;
const SPOOL_MAX_AGE_MS = Number(process.env.ARGOS_SPOOL_MAX_AGE_MS) || 24 * 60 * 60 * 1000;
const HEARTBEAT_MS = Number(process.env.ARGOS_HEARTBEAT_MS) || 30000;

let credential = process.env.ARGOS_AGENT_CREDENTIAL || "";
let seq = Number(process.env.ARGOS_AGENT_SEQ) || 0;

function loadSpool() {
  try {
    const raw = fs.readFileSync(SPOOL_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

function saveSpool(items) {
  const now = Date.now();
  const trimmed = items
    .filter((i) => now - (i.enqueuedAt || 0) < SPOOL_MAX_AGE_MS)
    .slice(-SPOOL_MAX_ITEMS);
  fs.writeFileSync(SPOOL_PATH, JSON.stringify({ items: trimmed }, null, 0), { mode: 0o600 });
}

function request(method, urlPath, body, headers = {}) {
  const u = new URL(urlPath, API);
  const lib = u.protocol === "https:" ? https : http;
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            json = { raw: text };
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function enroll() {
  const token = process.env.ARGOS_ENROLL_TOKEN;
  if (!token) throw new Error("ARGOS_ENROLL_TOKEN required for first run");
  const res = await request("POST", "/api/agent/v1/enroll", {
    token,
    name: process.env.ARGOS_AGENT_NAME || os.hostname(),
    agentVersion: "0.7.0-ref",
    metadata: { platform: os.platform(), release: os.release() }
  });
  if (res.status >= 400) throw new Error(`enroll failed: ${JSON.stringify(res.json)}`);
  credential = res.json.credential;
  console.log("[agent] enrolled agentId=", res.json.agentId);
  console.log("[agent] credential stored in memory only — set ARGOS_AGENT_CREDENTIAL for restarts");
}

function authHeaders() {
  return { Authorization: `Bearer ${credential}` };
}

function collectSafeMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 1000) / 10;
  const load = os.loadavg();
  const cpus = os.cpus() || [];
  return {
    observations: [
      {
        type: "MEMORY",
        idempotencyKey: `mem-${Date.now()}`,
        observedAt: new Date().toISOString(),
        measurement: {
          usedPercent,
          totalMb: Math.round(totalMem / (1024 * 1024)),
          availableMb: Math.round(freeMem / (1024 * 1024))
        }
      },
      {
        type: "LOAD",
        idempotencyKey: `load-${Date.now()}`,
        observedAt: new Date().toISOString(),
        measurement: { load1: load[0], load5: load[1], load15: load[2] }
      },
      {
        type: "CPU",
        idempotencyKey: `cpu-${Date.now()}`,
        observedAt: new Date().toISOString(),
        measurement: { usagePercent: Math.min(99, Math.round((load[0] / Math.max(cpus.length, 1)) * 100)), cores: cpus.length }
      }
    ]
  };
}

async function flushSpool() {
  const items = loadSpool();
  if (!items.length) return;
  const still = [];
  for (const item of items) {
    try {
      const res = await request("POST", "/api/agent/v1/observations", { observations: [item.body] }, authHeaders());
      if (res.status >= 500 || res.status === 429) {
        still.push(item);
      }
      // 2xx or 4xx (except rate) — drop to avoid infinite poison; duplicates OK via idempotency
    } catch {
      still.push(item);
    }
  }
  saveSpool(still);
}

async function heartbeat() {
  seq += 1;
  const res = await request(
    "POST",
    "/api/agent/v1/heartbeat",
    { seq, agentReportedAt: new Date().toISOString(), agentVersion: "0.7.0-ref" },
    authHeaders()
  );
  if (res.status >= 400) throw new Error(`heartbeat ${res.status}`);
}

async function sendObservations() {
  const batch = collectSafeMetrics();
  try {
    const res = await request("POST", "/api/agent/v1/observations", batch, authHeaders());
    if (res.status >= 500 || res.status === 429) {
      const spool = loadSpool();
      for (const o of batch.observations) {
        spool.push({ enqueuedAt: Date.now(), body: o });
      }
      saveSpool(spool);
    }
  } catch {
    const spool = loadSpool();
    for (const o of batch.observations) {
      spool.push({ enqueuedAt: Date.now(), body: o });
    }
    saveSpool(spool);
  }
}

function jitter(ms) {
  return ms + Math.floor(Math.random() * Math.min(5000, ms * 0.2));
}

async function loop() {
  if (!credential) await enroll();
  for (;;) {
    try {
      await heartbeat();
      await flushSpool();
      await sendObservations();
    } catch (err) {
      console.error("[agent] cycle error:", err.message);
    }
    await new Promise((r) => setTimeout(r, jitter(HEARTBEAT_MS)));
  }
}

if (require.main === module) {
  console.log("[agent] ARGOS reference agent — observation only");
  loop().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { loadSpool, saveSpool, collectSafeMetrics, SPOOL_MAX_ITEMS };
