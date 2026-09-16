/**
 * Invitation tokens reuse CURRENT agent hash primitives.
 * Raw token never persisted. Prefix is invitation-specific.
 */
const crypto = require("crypto");
const { sha256Hex, hashMatches } = require("../agents/crypto");

const TOKEN_PREFIX = "wpi_";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateInvitationToken() {
  return `${TOKEN_PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
}

function hashInvitationToken(token) {
  return sha256Hex(String(token || ""));
}

function invitationTokenLooksValid(token) {
  const raw = String(token || "").trim();
  return raw.startsWith(TOKEN_PREFIX) && raw.length >= TOKEN_PREFIX.length + 32;
}

function invitationExpiresAt(now = new Date()) {
  return new Date(now.getTime() + TTL_MS);
}

module.exports = {
  TOKEN_PREFIX,
  TTL_MS,
  generateInvitationToken,
  hashInvitationToken,
  invitationTokenLooksValid,
  invitationExpiresAt,
  hashMatches
};
