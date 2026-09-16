const { WebProjectError } = require("./errors");

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const OBJECT_KEY_PATTERN = /^org\/\d+\/wp\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function buildWebProjectObjectKey(organizationId, documentId) {
  const orgId = Number(organizationId);
  if (!Number.isInteger(orgId) || orgId <= 0) {
    throw new WebProjectError(400, "INVALID_ORG", "organization_id inválido");
  }
  const id = String(documentId || "").trim();
  if (!UUID.test(id)) {
    throw new WebProjectError(400, "INVALID_DOCUMENT_ID", "document id inválido");
  }
  return `org/${orgId}/wp/${id}`;
}

function assertWebProjectObjectKey(objectKey, organizationId) {
  const normalized = String(objectKey || "").replace(/\\/g, "/").trim();
  if (normalized.includes("..") || normalized.includes("\0")) {
    throw new WebProjectError(400, "PATH_TRAVERSAL", "Object key rechazada");
  }
  if (!OBJECT_KEY_PATTERN.test(normalized)) {
    throw new WebProjectError(400, "INVALID_OBJECT_KEY", "Object key inválida");
  }
  const orgId = Number(organizationId);
  const prefix = `org/${orgId}/wp/`;
  if (!normalized.startsWith(prefix)) {
    throw new WebProjectError(403, "OBJECT_KEY_ORG_MISMATCH", "Object key no pertenece a la organización");
  }
  return normalized;
}

module.exports = {
  UUID,
  OBJECT_KEY_PATTERN,
  buildWebProjectObjectKey,
  assertWebProjectObjectKey
};
