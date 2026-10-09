/**
 * Local private ObjectStore adapter — replaceable by S3-compatible backend.
 * Opaque server-generated keys only; never expose physical paths.
 */
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const {
  ObjectStoreError,
  OBJECT_KEY_PATTERN,
  assertValidObjectKey,
  buildObjectKey
} = require("./objectKey");

class LocalPrivateObjectStore {
  constructor({ rootDir }) {
    if (!rootDir) {
      throw new Error("rootDir is required");
    }
    this.rootDir = path.resolve(rootDir);
  }

  resolvePhysicalPath(objectKey) {
    const normalized = assertValidObjectKey(objectKey);
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

  async head(objectKey) {
    const target = this.resolvePhysicalPath(objectKey);
    try {
      const stat = await fsp.lstat(target);
      if (stat.isSymbolicLink()) {
        throw new ObjectStoreError("SYMLINK_ESCAPE", "Symlink escape rejected");
      }
      if (!stat.isFile()) {
        throw new ObjectStoreError("NOT_FOUND", "Object not found");
      }
      return { objectKey, byteLength: stat.size, exists: true };
    } catch (err) {
      if (err instanceof ObjectStoreError) throw err;
      if (err && err.code === "ENOENT") {
        throw new ObjectStoreError("NOT_FOUND", "Object not found");
      }
      throw err;
    }
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
      await this.head(objectKey);
      return true;
    } catch (err) {
      if (err instanceof ObjectStoreError && err.code === "NOT_FOUND") {
        return false;
      }
      throw err;
    }
  }

  /**
   * Internal reconciliation helper — lists keys under org prefix (bounded).
   * @param {string} prefix e.g. org/10/ev/
   * @param {{ maxKeys?: number }} options
   */
  async listKeysUnderPrefix(prefix, { maxKeys = 500 } = {}) {
    const normalized = String(prefix || "").replace(/\\/g, "/");
    if (!normalized.startsWith("org/") || normalized.includes("..")) {
      throw new ObjectStoreError("INVALID_PREFIX", "Invalid list prefix");
    }
    const base = path.resolve(this.rootDir, normalized);
    const rootWithSep = this.rootDir.endsWith(path.sep) ? this.rootDir : `${this.rootDir}${path.sep}`;
    if (!base.startsWith(rootWithSep)) {
      throw new ObjectStoreError("PATH_TRAVERSAL", "Path traversal rejected");
    }
    const keys = [];
    async function walk(dir, relPrefix) {
      if (keys.length >= maxKeys) return;
      let entries;
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
      } catch (err) {
        if (err && err.code === "ENOENT") return;
        throw err;
      }
      for (const entry of entries) {
        if (keys.length >= maxKeys) break;
        const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full, rel);
        } else if (entry.isFile() && !entry.name.endsWith(".tmp")) {
          const key = rel.replace(/\\/g, "/");
          if (OBJECT_KEY_PATTERN.test(key)) {
            keys.push(key);
          }
        }
      }
    }
    await walk(base, normalized.replace(/\/$/, ""));
    return keys;
  }
}

module.exports = {
  LocalPrivateObjectStore,
  ObjectStoreError,
  OBJECT_KEY_PATTERN,
  buildObjectKey
};
