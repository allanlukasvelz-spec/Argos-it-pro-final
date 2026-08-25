/**
 * Evidence object store abstraction (foundation).
 * Bytes live in OBJECT storage; metadata stays TRANSACTIONAL (PG).
 * Default: not configured — fail closed until configureEvidenceStore() runs.
 */
const fs = require("fs");
const path = require("path");
const { LocalPrivateObjectStore } = require("./localPrivateObjectStore");
const { S3CompatibleObjectStore, createS3CompatibleObjectStoreFromEnv } = require("./s3CompatibleObjectStore");

class EvidenceStoreNotConfiguredError extends Error {
  constructor() {
    super("Evidence object store is not configured");
    this.code = "EVIDENCE_STORE_NOT_CONFIGURED";
  }
}

class EvidenceStoreConfigurationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

class NoopEvidenceStore {
  async put() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async get() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async head() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async delete() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async exists() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async signedUrl() {
    throw new EvidenceStoreNotConfiguredError();
  }
}

/** @type {NoopEvidenceStore|LocalPrivateObjectStore|S3CompatibleObjectStore} */
let activeStore = new NoopEvidenceStore();
let configuredRoot = null;
let configuredBackend = null;

const VALID_BACKENDS = Object.freeze(["local", "s3"]);

function getEvidenceStore() {
  return activeStore;
}

function setEvidenceStoreForTests(store) {
  activeStore = store || new NoopEvidenceStore();
  configuredBackend = store ? "test" : null;
  configuredRoot = null;
}

function getDefaultEvidenceRoot() {
  return path.join(__dirname, "..", "..", "data", "evidence");
}

function resolveEvidenceRoot() {
  const configured = String(process.env.ARGOS_EVIDENCE_ROOT || "").trim();
  const root = configured || getDefaultEvidenceRoot();
  return path.resolve(root);
}

function resolveBackendName(options = {}) {
  const raw = String(options.backend || process.env.ARGOS_EVIDENCE_STORE || "local")
    .trim()
    .toLowerCase();
  return raw;
}

function configureEvidenceStore(options = {}) {
  const backend = resolveBackendName(options);
  if (!VALID_BACKENDS.includes(backend)) {
    throw new EvidenceStoreConfigurationError(
      "INVALID_BACKEND",
      `Invalid ARGOS_EVIDENCE_STORE: ${backend}. Allowed: ${VALID_BACKENDS.join(", ")}`
    );
  }

  if (backend === "local") {
    const rootDir = options.rootDir || resolveEvidenceRoot();
    fs.mkdirSync(rootDir, { recursive: true });
    activeStore = new LocalPrivateObjectStore({ rootDir });
    configuredRoot = rootDir;
    configuredBackend = "local";
    return activeStore;
  }

  if (backend === "s3") {
    try {
      activeStore = options.s3Store || createS3CompatibleObjectStoreFromEnv(options);
    } catch (err) {
      throw new EvidenceStoreConfigurationError(
        err.code || "EVIDENCE_S3_CONFIG_FAILED",
        err.message || "Failed to configure S3 evidence store"
      );
    }
    configuredRoot = null;
    configuredBackend = "s3";
    return activeStore;
  }

  throw new EvidenceStoreConfigurationError("INVALID_BACKEND", "Evidence store backend not configured");
}

function getConfiguredEvidenceRoot() {
  return configuredRoot;
}

function getConfiguredBackend() {
  return configuredBackend;
}

function isEvidenceStoreConfigured() {
  return !(activeStore instanceof NoopEvidenceStore);
}

function isLocalEvidenceStore() {
  return activeStore instanceof LocalPrivateObjectStore;
}

function isS3EvidenceStore() {
  return activeStore instanceof S3CompatibleObjectStore;
}

module.exports = {
  EvidenceStoreNotConfiguredError,
  EvidenceStoreConfigurationError,
  NoopEvidenceStore,
  VALID_BACKENDS,
  getEvidenceStore,
  setEvidenceStoreForTests,
  configureEvidenceStore,
  getConfiguredEvidenceRoot,
  getConfiguredBackend,
  isEvidenceStoreConfigured,
  isLocalEvidenceStore,
  isS3EvidenceStore,
  getDefaultEvidenceRoot,
  createS3CompatibleObjectStoreFromEnv
};
