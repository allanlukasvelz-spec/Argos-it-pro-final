/**
 * Shared object store errors and opaque evidence object keys.
 */
class ObjectStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const OBJECT_KEY_PATTERN =
  /^org\/\d+\/ev\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function assertValidObjectKey(objectKey) {
  const normalized = String(objectKey || "").replace(/\\/g, "/").trim();
  if (!OBJECT_KEY_PATTERN.test(normalized)) {
    throw new ObjectStoreError("INVALID_OBJECT_KEY", "Invalid object key");
  }
  if (normalized.includes("..") || normalized.includes("\0")) {
    throw new ObjectStoreError("PATH_TRAVERSAL", "Path traversal rejected");
  }
  return normalized;
}

function buildObjectKey(organizationId, evidenceId) {
  const orgId = Number(organizationId);
  if (!Number.isInteger(orgId) || orgId <= 0) {
    throw new ObjectStoreError("INVALID_ORG", "Invalid organization id");
  }
  const id = String(evidenceId || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    throw new ObjectStoreError("INVALID_EVIDENCE_ID", "Invalid evidence id");
  }
  return `org/${orgId}/ev/${id}`;
}

function orgPrefix(organizationId) {
  const orgId = Number(organizationId);
  if (!Number.isInteger(orgId) || orgId <= 0) {
    throw new ObjectStoreError("INVALID_ORG", "Invalid organization id");
  }
  return `org/${orgId}/ev/`;
}

module.exports = {
  ObjectStoreError,
  OBJECT_KEY_PATTERN,
  assertValidObjectKey,
  buildObjectKey,
  orgPrefix
};
