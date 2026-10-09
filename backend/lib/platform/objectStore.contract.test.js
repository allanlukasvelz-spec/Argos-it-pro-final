/**
 * Shared ObjectStore contract — run against any adapter implementation.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { buildObjectKey } = require("./objectKey");

function registerObjectStoreContractSuite(name, factory) {
  describe(`ObjectStore contract (${name})`, () => {
    /** @type {import('./localPrivateObjectStore').LocalPrivateObjectStore | import('./s3CompatibleObjectStore').S3CompatibleObjectStore} */
    let store;
    let cleanup;

    beforeEach(async () => {
      const ctx = await factory();
      store = ctx.store;
      cleanup = ctx.cleanup;
    });

    afterEach(async () => {
      if (cleanup) await cleanup();
    });

    it("put → get → head → exists → delete lifecycle", async () => {
      const key = buildObjectKey(10, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
      const payload = Buffer.from('{"contract":true}\n', "utf8");
      const put = await store.put(key, payload);
      assert.equal(put.byteLength, payload.length);
      assert.equal(await store.exists(key), true);
      const head = await store.head(key);
      assert.equal(head.byteLength, payload.length);
      const got = await store.get(key);
      assert.equal(got.toString("utf8"), payload.toString("utf8"));
      assert.equal(await store.delete(key), true);
      assert.equal(await store.exists(key), false);
    });

    it("rejects invalid object keys", async () => {
      await assert.rejects(
        () => store.put("../../../etc/passwd", Buffer.from("x")),
        (err) => err.code === "INVALID_OBJECT_KEY" || err.code === "PATH_TRAVERSAL"
      );
    });

    it("get missing object → NOT_FOUND", async () => {
      const key = buildObjectKey(10, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
      await assert.rejects(() => store.get(key), (err) => err.code === "NOT_FOUND");
    });

    it("duplicate put same key overwrites or replaces bytes", async () => {
      const key = buildObjectKey(10, "cccccccc-cccc-cccc-cccc-cccccccccccc");
      await store.put(key, Buffer.from("v1", "utf8"));
      await store.put(key, Buffer.from("v2-longer", "utf8"));
      const got = await store.get(key);
      assert.equal(got.toString("utf8"), "v2-longer");
    });
  });
}

module.exports = { registerObjectStoreContractSuite };
