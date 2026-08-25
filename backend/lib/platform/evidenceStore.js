/**
 * Evidence object store abstraction (foundation).
 * Bytes live in OBJECT storage later; metadata stays TRANSACTIONAL.
 * Default: not configured — fail closed.
 */

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

/** @type {NoopEvidenceStore} */
let activeStore = new NoopEvidenceStore();

function getEvidenceStore() {
  return activeStore;
}

/** Test-only / future adapter injection */
function setEvidenceStoreForTests(store) {
  activeStore = store || new NoopEvidenceStore();
}

module.exports = {
  EvidenceStoreNotConfiguredError,
  NoopEvidenceStore,
  getEvidenceStore,
  setEvidenceStoreForTests
};
