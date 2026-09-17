/**
 * Phase 7 — crypto helpers for enrollment tokens and agent secrets.
 * Never log plaintext tokens/secrets.
 */
const crypto = require("crypto");

function sha256Hex(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function generateEnrollmentToken() {
  return `enr_${crypto.randomBytes(32).toString("base64url")}`;
}

function generateAgentSecret() {
  return `ags_${crypto.randomBytes(32).toString("base64url")}`;
}

/** Format returned once: agentId.secret — auth parses and verifies hash */
function formatCredential(agentId, secret) {
  return `${Number(agentId)}.${secret}`;
}

function parseCredential(raw) {
  const s = String(raw || "").trim();
  const bearer = s.startsWith("Bearer ") ? s.slice(7).trim() : s;
  const dot = bearer.indexOf(".");
  if (dot <= 0) return null;
  const id = Number.parseInt(bearer.slice(0, dot), 10);
  const secret = bearer.slice(dot + 1);
  if (!Number.isInteger(id) || id < 1 || !secret || secret.length < 16) return null;
  return { agentId: id, secret };
}

function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function hashMatches(plaintext, hash) {
  if (!plaintext || !hash) return false;
  return timingSafeEqualHex(sha256Hex(plaintext), hash);
}

module.exports = {
  sha256Hex,
  generateEnrollmentToken,
  generateAgentSecret,
  formatCredential,
  parseCredential,
  hashMatches,
  timingSafeEqualHex
};
