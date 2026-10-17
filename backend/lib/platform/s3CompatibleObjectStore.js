/**
 * S3-compatible ObjectStore adapter (MinIO / AWS API) — transport only.
 * EvidenceService owns keys, policy, checksums, and tenant metadata.
 */
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} = require("@aws-sdk/client-s3");
const { assertValidObjectKey, orgPrefix, ObjectStoreError } = require("./objectKey");

const DEFAULT_REGION = "us-east-1";
const DEFAULT_READ_MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitteredBackoffMs(attempt) {
  const base = Math.min(250 * 2 ** attempt, 2000);
  return base + Math.floor(Math.random() * 100);
}

function mapS3Error(err, fallbackCode = "STORAGE_DOWN") {
  const name = String(err?.name || "");
  const code = String(err?.Code || err?.code || "");
  const status = Number(err?.$metadata?.httpStatusCode || 0);

  if (name === "NoSuchKey" || code === "NoSuchKey" || status === 404) {
    return new ObjectStoreError("NOT_FOUND", "Object not found");
  }
  if (
    name === "InvalidAccessKeyId" ||
    name === "SignatureDoesNotMatch" ||
    code === "InvalidAccessKeyId" ||
    code === "SignatureDoesNotMatch" ||
    status === 403
  ) {
    return new ObjectStoreError("STORAGE_AUTH_FAILED", "Object store credentials rejected");
  }
  if (name === "NoSuchBucket" || code === "NoSuchBucket") {
    return new ObjectStoreError("BUCKET_UNAVAILABLE", "Object store bucket unavailable");
  }
  if (name === "TimeoutError" || code === "ETIMEDOUT") {
    return new ObjectStoreError("TIMEOUT", "Object store request timed out");
  }
  if (code === "ECONNRESET" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return new ObjectStoreError(fallbackCode, err?.message || "Object store network failure");
  }
  return new ObjectStoreError(fallbackCode, err?.message || "Object store operation failed");
}

async function streamToBuffer(body) {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

class S3CompatibleObjectStore {
  /**
   * @param {{ client: import('@aws-sdk/client-s3').S3Client, bucket: string, readMaxAttempts?: number }} options
   */
  constructor({ client, bucket, readMaxAttempts = DEFAULT_READ_MAX_ATTEMPTS }) {
    if (!client) throw new Error("S3 client is required");
    if (!bucket) throw new Error("bucket is required");
    this.client = client;
    this.bucket = String(bucket);
    this.readMaxAttempts = Math.max(1, Math.min(Number(readMaxAttempts) || DEFAULT_READ_MAX_ATTEMPTS, 5));
  }

  async put(objectKey, buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new ObjectStoreError("INVALID_PAYLOAD", "Buffer required");
    }
    const key = assertValidObjectKey(objectKey);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentLength: buffer.length
        })
      );
      return { objectKey: key, byteLength: buffer.length };
    } catch (err) {
      throw mapS3Error(err, "STORAGE_PUT_FAILED");
    }
  }

  async _readWithRetry(sendFn) {
    let lastErr;
    for (let attempt = 0; attempt < this.readMaxAttempts; attempt += 1) {
      try {
        return await sendFn();
      } catch (err) {
        lastErr = err;
        const mapped = mapS3Error(err);
        if (mapped.code === "NOT_FOUND" || mapped.code === "STORAGE_AUTH_FAILED") {
          throw mapped;
        }
        if (attempt + 1 >= this.readMaxAttempts) break;
        await sleep(jitteredBackoffMs(attempt));
      }
    }
    throw mapS3Error(lastErr, "STORAGE_DOWN");
  }

  async get(objectKey) {
    const key = assertValidObjectKey(objectKey);
    return this._readWithRetry(async () => {
      const out = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      if (!out.Body) {
        throw new ObjectStoreError("NOT_FOUND", "Object not found");
      }
      return streamToBuffer(out.Body);
    });
  }

  async head(objectKey) {
    const key = assertValidObjectKey(objectKey);
    return this._readWithRetry(async () => {
      const out = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return {
        objectKey: key,
        byteLength: Number(out.ContentLength || 0),
        exists: true
      };
    });
  }

  async delete(objectKey) {
    const key = assertValidObjectKey(objectKey);
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (err) {
      const mapped = mapS3Error(err);
      if (mapped.code === "NOT_FOUND") return false;
      throw mapped;
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
   * Internal reconciliation helper — bounded list under org prefix.
   */
  async listKeysUnderPrefix(prefix, { maxKeys = 500 } = {}) {
    const normalized = String(prefix || "");
    if (!normalized.startsWith("org/")) {
      throw new ObjectStoreError("INVALID_PREFIX", "Invalid list prefix");
    }
    const keys = [];
    let token;
    do {
      const out = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: normalized,
          MaxKeys: Math.min(maxKeys - keys.length, 1000),
          ContinuationToken: token
        })
      );
      for (const item of out.Contents || []) {
        if (item.Key && keys.length < maxKeys) {
          try {
            keys.push(assertValidObjectKey(item.Key));
          } catch {
            /* skip non-evidence keys */
          }
        }
      }
      token = out.IsTruncated ? out.NextContinuationToken : undefined;
    } while (token && keys.length < maxKeys);
    return keys;
  }
}

function parseBool(value, defaultValue) {
  if (value == null || value === "") return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return defaultValue;
}

function createS3CompatibleObjectStoreFromEnv(overrides = {}) {
  const endpoint = String(overrides.endpoint || process.env.ARGOS_EVIDENCE_S3_ENDPOINT || "").trim();
  const bucket = String(overrides.bucket || process.env.ARGOS_EVIDENCE_S3_BUCKET || "").trim();
  const accessKeyId = String(
    overrides.accessKeyId || process.env.ARGOS_EVIDENCE_S3_ACCESS_KEY || ""
  ).trim();
  const secretAccessKey = String(
    overrides.secretAccessKey || process.env.ARGOS_EVIDENCE_S3_SECRET_KEY || ""
  ).trim();
  const region = String(overrides.region || process.env.ARGOS_EVIDENCE_S3_REGION || DEFAULT_REGION).trim();
  const forcePathStyle = parseBool(
    overrides.forcePathStyle ?? process.env.ARGOS_EVIDENCE_S3_FORCE_PATH_STYLE,
    true
  );
  const readMaxAttempts = Number(
    overrides.readMaxAttempts || process.env.ARGOS_EVIDENCE_S3_READ_MAX_ATTEMPTS || DEFAULT_READ_MAX_ATTEMPTS
  );

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    const err = new Error(
      "S3 evidence store requires ARGOS_EVIDENCE_S3_ENDPOINT, ARGOS_EVIDENCE_S3_BUCKET, ARGOS_EVIDENCE_S3_ACCESS_KEY, ARGOS_EVIDENCE_S3_SECRET_KEY"
    );
    err.code = "EVIDENCE_S3_CONFIG_INCOMPLETE";
    throw err;
  }

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey }
  });

  return new S3CompatibleObjectStore({
    client,
    bucket,
    readMaxAttempts
  });
}

module.exports = {
  S3CompatibleObjectStore,
  createS3CompatibleObjectStoreFromEnv,
  orgPrefix
};
