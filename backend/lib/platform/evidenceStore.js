/**
 * Evidence object store abstraction (foundation).
 * Bytes live in OBJECT storage; metadata stays TRANSACTIONAL (PG).
 * Default: not configured — fail closed until configureEvidenceStore() runs.
 */
const fs = require("fs");
const path = require("path");
const { LocalPrivateObjectStore } = require("./localPrivateObjectStore");

class EvidenceStoreNotConfiguredError extends Error {
  constructor() {
    super("Evidence object store is not configured");
    this.code = "EVIDENCE_STORE_NOT_CONFIGURED";
  }
}

class NoopEvidenceStore {
  async put() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async get() {
    throw new EvidenceStoreNotConfiguredError();
  }

  async signedUrl() {
    throw new EvidenceStoreNotConfiguredError();
  }
}

/** @type {NoopEvidenceStore|LocalPrivateObjectStore} */
let activeStore = new NoopEvidenceStore();
let configuredRoot = null;

function getEvidenceStore() {
  return activeStore;
}

/** Test-only / future adapter injection */
function setEvidenceStoreForTests(store) {
  activeStore = store || new NoopEvidenceStore();
}

function getDefaultEvidenceRoot() {
  return path.join(__dirname, "..", "..", "data", "evidence");
}

function resolveEvidenceRoot() {
  const configured = String(process.env.ARGOS_EVIDENCE_ROOT || "").trim();
  const root = configured || getDefaultEvidenceRoot();
  return path.resolve(root);
}

function configureEvidenceStore(options = {}) {
  const rootDir = options.rootDir || resolveEvidenceRoot();
  fs.mkdirSync(rootDir, { recursive: true });
  activeStore = new LocalPrivateObjectStore({ rootDir });
  configuredRoot = rootDir;
  return activeStore;
}

function getConfiguredEvidenceRoot() {
  return configuredRoot;
}

function isEvidenceStoreConfigured() {
  return activeStore instanceof LocalPrivateObjectStore;
}

module.exports = {
  EvidenceStoreNotConfiguredError,
  NoopEvidenceStore,
  getEvidenceStore,
  setEvidenceStoreForTests,
  configureEvidenceStore,
  getConfiguredEvidenceRoot,
  isEvidenceStoreConfigured,
  getDefaultEvidenceRoot
};
