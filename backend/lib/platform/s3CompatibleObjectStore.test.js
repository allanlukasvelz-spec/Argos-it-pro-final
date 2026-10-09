/**
 * S3CompatibleObjectStore — mock client, failure injection, optional MinIO integration.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} = require("@aws-sdk/client-s3");
const { S3CompatibleObjectStore, createS3CompatibleObjectStoreFromEnv } = require("./s3CompatibleObjectStore");
const { registerObjectStoreContractSuite } = require("./objectStore.contract.test");
const { buildObjectKey } = require("./objectKey");
const { configureEvidenceStore, setEvidenceStoreForTests, NoopEvidenceStore } = require("./evidenceStore");

class InMemoryS3Mock {
  constructor({ failPut = false, failGet = false, badCredentials = false } = {}) {
    this.objects = new Map();
    this.failPut = failPut;
    this.failGet = failGet;
    this.badCredentials = badCredentials;
  }

  async send(command) {
    if (this.badCredentials) {
      const err = new Error("InvalidAccessKeyId");
      err.name = "InvalidAccessKeyId";
      throw err;
    }
    if (command instanceof PutObjectCommand) {
      if (this.failPut) {
        const err = new Error("Network failure");
        err.code = "ECONNRESET";
        throw err;
      }
      this.objects.set(`${command.input.Bucket}/${command.input.Key}`, Buffer.from(command.input.Body));
      return {};
    }
    if (command instanceof GetObjectCommand) {
      if (this.failGet) {
        const err = new Error("timeout");
        err.name = "TimeoutError";
        throw err;
      }
      const buf = this.objects.get(`${command.input.Bucket}/${command.input.Key}`);
      if (!buf) {
        const err = new Error("NoSuchKey");
        err.name = "NoSuchKey";
        throw err;
      }
      return { Body: buf };
    }
    if (command instanceof HeadObjectCommand) {
      const buf = this.objects.get(`${command.input.Bucket}/${command.input.Key}`);
      if (!buf) {
        const err = new Error("NotFound");
        err.name = "NotFound";
        err.$metadata = { httpStatusCode: 404 };
        throw err;
      }
      return { ContentLength: buf.length };
    }
    if (command instanceof DeleteObjectCommand) {
      this.objects.delete(`${command.input.Bucket}/${command.input.Key}`);
      return {};
    }
    if (command instanceof ListObjectsV2Command) {
      const prefix = command.input.Prefix || "";
      const contents = [];
      for (const [k, _buf] of this.objects) {
        const key = k.split("/").slice(1).join("/");
        if (key.startsWith(prefix)) {
          contents.push({ Key: key });
        }
      }
      return { Contents: contents, IsTruncated: false };
    }
    throw new Error(`Unhandled command ${command.constructor.name}`);
  }
}

registerObjectStoreContractSuite("s3-mock", async () => {
  const mock = new InMemoryS3Mock();
  return {
    store: new S3CompatibleObjectStore({ client: mock, bucket: "test-bucket", readMaxAttempts: 2 }),
    cleanup: async () => {
      mock.objects.clear();
    }
  };
});

describe("S3CompatibleObjectStore failures", () => {
  it("put failure surfaces STORAGE_PUT_FAILED", async () => {
    const mock = new InMemoryS3Mock({ failPut: true });
    const store = new S3CompatibleObjectStore({ client: mock, bucket: "b" });
    const key = buildObjectKey(10, "dddddddd-dddd-dddd-dddd-dddddddddddd");
    await assert.rejects(() => store.put(key, Buffer.from("x")), (err) => err.code === "STORAGE_PUT_FAILED");
  });

  it("bad credentials → STORAGE_AUTH_FAILED", async () => {
    const mock = new InMemoryS3Mock({ badCredentials: true });
    const store = new S3CompatibleObjectStore({ client: mock, bucket: "b" });
    const key = buildObjectKey(10, "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    await assert.rejects(() => store.get(key), (err) => err.code === "STORAGE_AUTH_FAILED");
  });

  it("read retries then succeeds", async () => {
    let attempts = 0;
    const mock = new InMemoryS3Mock();
    const key = buildObjectKey(10, "ffffffff-ffff-ffff-ffff-ffffffffffff");
    const full = `test-bucket/${key}`;
    mock.objects.set(full, Buffer.from("ok", "utf8"));
    const origSend = mock.send.bind(mock);
    mock.send = async (cmd) => {
      if (cmd instanceof GetObjectCommand) {
        attempts += 1;
        if (attempts === 1) {
          const err = new Error("reset");
          err.code = "ECONNRESET";
          throw err;
        }
      }
      return origSend(cmd);
    };
    const store = new S3CompatibleObjectStore({ client: mock, bucket: "test-bucket", readMaxAttempts: 3 });
    const buf = await store.get(key);
    assert.equal(buf.toString("utf8"), "ok");
    assert.equal(attempts, 2);
  });
});

describe("configureEvidenceStore backend selection", () => {
  afterEach(() => {
    setEvidenceStoreForTests(new NoopEvidenceStore());
    delete process.env.ARGOS_EVIDENCE_STORE;
    delete process.env.ARGOS_EVIDENCE_S3_ENDPOINT;
    delete process.env.ARGOS_EVIDENCE_S3_BUCKET;
    delete process.env.ARGOS_EVIDENCE_S3_ACCESS_KEY;
    delete process.env.ARGOS_EVIDENCE_S3_SECRET_KEY;
  });

  it("invalid backend fails closed", () => {
    assert.throws(
      () => configureEvidenceStore({ backend: "minio" }),
      (err) => err.code === "INVALID_BACKEND"
    );
  });

  it("s3 without credentials fails closed (no silent local fallback)", () => {
    process.env.ARGOS_EVIDENCE_STORE = "s3";
    assert.throws(
      () => configureEvidenceStore(),
      (err) => err.code === "EVIDENCE_S3_CONFIG_INCOMPLETE"
    );
  });

  it("s3 configures via injected store without silent local fallback", () => {
    const mock = new InMemoryS3Mock();
    const s3Store = new S3CompatibleObjectStore({ client: mock, bucket: "poc" });
    configureEvidenceStore({ backend: "s3", s3Store });
    const { getConfiguredBackend, isS3EvidenceStore } = require("./evidenceStore");
    assert.equal(getConfiguredBackend(), "s3");
    assert.equal(isS3EvidenceStore(), true);
  });
});
