const { ObjectStoreError } = require("../platform/objectKey");

function createMemoryObjectStore() {
  const objects = new Map();
  const state = {
    deleted: [],
    failPut: false,
    failDelete: false,
    failGet: false
  };

  return {
    state,
    objects,
    async put(objectKey, buffer) {
      if (state.failPut) {
        throw new ObjectStoreError("STORAGE_DOWN", "Object store unavailable");
      }
      if (!Buffer.isBuffer(buffer)) {
        throw new ObjectStoreError("INVALID_PAYLOAD", "Buffer required");
      }
      objects.set(objectKey, Buffer.from(buffer));
      return { objectKey, byteLength: buffer.length };
    },
    async get(objectKey) {
      if (state.failGet) {
        throw new ObjectStoreError("STORAGE_DOWN", "Object store unavailable");
      }
      if (!objects.has(objectKey)) {
        throw new ObjectStoreError("NOT_FOUND", "Object not found");
      }
      return Buffer.from(objects.get(objectKey));
    },
    async head(objectKey) {
      if (!objects.has(objectKey)) {
        throw new ObjectStoreError("NOT_FOUND", "Object not found");
      }
      return { objectKey, byteLength: objects.get(objectKey).length, exists: true };
    },
    async exists(objectKey) {
      return objects.has(objectKey);
    },
    async delete(objectKey) {
      if (state.failDelete) {
        throw new ObjectStoreError("STORAGE_DOWN", "Compensation delete failed");
      }
      const had = objects.delete(objectKey);
      state.deleted.push(objectKey);
      return had;
    }
  };
}

module.exports = { createMemoryObjectStore };
