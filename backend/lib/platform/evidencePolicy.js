/**
 * Evidence content policy — MIME allowlist, size limits, retention metadata, quota hooks.
 */

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/json",
  "text/plain"
]);

const RETENTION_DAYS = {
  SHORT: 30,
  STANDARD: 90,
  LONG: 365,
  LEGAL_HOLD: null
};

class EvidencePolicyError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

class QuotaExceededError extends EvidencePolicyError {
  constructor() {
    super("EVIDENCE_QUOTA_EXCEEDED", "Organization evidence quota exceeded");
  }
}

function getMaxBytes() {
  const raw = Number(process.env.ARGOS_EVIDENCE_MAX_BYTES || DEFAULT_MAX_BYTES);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MAX_BYTES;
}

function getOrgQuotaBytes() {
  const raw = Number(process.env.ARGOS_EVIDENCE_QUOTA_BYTES || 0);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

function normalizeMime(mimeType) {
  const normalized = String(mimeType || "")
    .trim()
    .toLowerCase()
    .split(";")[0]
    .trim();
  if (!normalized || normalized.length > 120) {
    throw new EvidencePolicyError("INVALID_MIME", "MIME type is required");
  }
  return normalized;
}

function assertAllowedMime(mimeType) {
  const normalized = normalizeMime(mimeType);
  if (!ALLOWED_MIME_TYPES.has(normalized)) {
    throw new EvidencePolicyError("MIME_NOT_ALLOWED", "MIME type is not allowed");
  }
  return normalized;
}

function sniffMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.slice(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  const textSample = buffer.slice(0, Math.min(buffer.length, 256)).toString("utf8");
  const trimmed = textSample.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "application/json";
  }
  if (/^[\x09\x0a\x0d\x20-\x7e\u0080-\uffff]*$/.test(textSample)) {
    return "text/plain";
  }
  return null;
}

function assertMimeMatchesContent(mimeType, buffer) {
  const declared = assertAllowedMime(mimeType);
  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    return declared;
  }
  if (declared === sniffed) {
    return declared;
  }
  if (declared === "text/plain" && sniffed === "application/json") {
    return declared;
  }
  throw new EvidencePolicyError("MIME_SPOOF", "Declared MIME does not match content");
}

function assertSizeWithinLimit(byteLength) {
  const max = getMaxBytes();
  if (!Number.isFinite(byteLength) || byteLength < 0) {
    throw new EvidencePolicyError("INVALID_SIZE", "Invalid byte length");
  }
  if (byteLength > max) {
    throw new EvidencePolicyError("PAYLOAD_TOO_LARGE", "Evidence payload exceeds size limit");
  }
}

function computeRetentionUntil(retentionClass, fromDate = new Date()) {
  const klass = String(retentionClass || "STANDARD").toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(RETENTION_DAYS, klass)) {
    throw new EvidencePolicyError("INVALID_RETENTION", "Invalid retention class");
  }
  const days = RETENTION_DAYS[klass];
  if (days == null) {
    return null;
  }
  const until = new Date(fromDate);
  until.setUTCDate(until.getUTCDate() + days);
  return until;
}

async function assertOrgQuota(pool, organizationId, additionalBytes) {
  const quota = getOrgQuotaBytes();
  if (quota <= 0) {
    return;
  }
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(byte_length), 0)::bigint AS total
     FROM evidence_objects
     WHERE organization_id = $1 AND status = 'AVAILABLE'`,
    [organizationId]
  );
  const current = BigInt(rows[0]?.total || 0);
  const next = current + BigInt(additionalBytes);
  if (next > BigInt(quota)) {
    throw new QuotaExceededError();
  }
}

/** Placeholder for async malware inspection before client download. */
async function runInspectionHook(_metadata) {
  return { scanStatus: "SKIPPED", quarantined: false };
}

module.exports = {
  ALLOWED_MIME_TYPES,
  DEFAULT_MAX_BYTES,
  EvidencePolicyError,
  QuotaExceededError,
  RETENTION_DAYS,
  assertAllowedMime,
  assertMimeMatchesContent,
  assertOrgQuota,
  assertSizeWithinLimit,
  computeRetentionUntil,
  getMaxBytes,
  getOrgQuotaBytes,
  normalizeMime,
  runInspectionHook,
  sniffMime
};
