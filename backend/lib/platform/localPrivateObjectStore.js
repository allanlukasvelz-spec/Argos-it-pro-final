/**
 * Local private ObjectStore adapter — replaceable by MinIO/S3 later.
 * Opaque server-generated keys only; never expose physical paths.
 */
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const OBJECT_KEY_PATTERN = /^org\/\d+\/ev\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

class ObjectStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

class LocalPrivateObjectStore {
  constructor({ rootDir }) {
    if (!rootDir) {
      throw new Error("rootDir is required");
    }
    this.rootDir = path.resolve(rootDir);
  }

  assertValidObjectKey(objectKey) {
    const normalized = String(objectKey || "").replace(/\\/g, "/").trim();
    if (!OBJECT_KEY_PATTERN.test(normalized)) {
      throw new ObjectStoreError("INVALID_OBJECT_KEY", "Invalid object key");
    }
    if (normalized.includes("..") || normalized.includes("\0")) {
      throw new ObjectStoreError("PATH_TRAVERSAL", "Path traversal rejected");
    }
    return normalized;
  }

  resolvePhysicalPath(objectKey) {
    const normalized = this.assertValidObjectKey(objectKey);
    const fullPath = path.resolve(this.rootDir, normalized);
    const rootWithSep = this.rootDir.endsWith(path.sep) ? this.rootDir : `${this.rootDir}${path.sep}`;
    if (!fullPath.startsWith(rootWithSep)) {
      throw new ObjectStoreError("PATH_TRAVERSAL", "Path traversal rejected");
    }
    return fullPath;
  }

  async put(objectKey, buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new ObjectStoreError("INVALID_PAYLOAD", "Buffer required");
    }
    const target = this.resolvePhysicalPath(objectKey);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    const tmpPath = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fsp.writeFile(tmpPath, buffer, { flag: "wx" });
    await fsp.rename(tmpPath, target);
    return { objectKey, byteLength: buffer.length };
  }

  async get(objectKey) {
    const target = this.resolvePhysicalPath(objectKey);
    let stat;
    try {
      stat = await fsp.lstat(target);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        throw new ObjectStoreError("NOT_FOUND", "Object not found");
      }
      throw err;
    }
    if (stat.isSymbolicLink()) {
      throw new ObjectStoreError("SYMLINK_ESCAPE", "Symlink escape rejected");
    }
    if (!stat.isFile()) {
      throw new ObjectStoreError("NOT_FOUND", "Object not found");
    }
    return fsp.readFile(target);
  }

  async delete(objectKey) {
    const target = this.resolvePhysicalPath(objectKey);
    try {
      await fsp.unlink(target);
      return true;
    } catch (err) {
      if (err && err.code === "ENOENT") {
        return false;
      }
      throw err;
    }
  }

  async exists(objectKey) {
    try {
      const target = this.resolvePhysicalPath(objectKey);
      const stat = await fsp.lstat(target);
      return stat.isFile() && !stat.isSymbolicLink();
    } catch {
      return false;
    }
  }
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

module.exports = {
  LocalPrivateObjectStore,
  ObjectStoreError,
  OBJECT_KEY_PATTERN,
  buildObjectKey
};
