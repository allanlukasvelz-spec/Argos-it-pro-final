const crypto = require("crypto");

function scopeHash({ organizationId, executionId, actionType, letter, assetId }) {
  const raw = [
    organizationId,
    executionId,
    actionType,
    letter || "A",
    assetId == null ? "" : assetId
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function makeExecutionKey({ organizationId, incidentId, letter, actionType, nonce }) {
  const raw = [
    organizationId,
    incidentId || "none",
    letter || "A",
    actionType,
    nonce || crypto.randomBytes(8).toString("hex")
  ].join(":");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 48);
}

module.exports = { scopeHash, makeExecutionKey };
