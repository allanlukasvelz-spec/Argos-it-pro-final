const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { STORAGE_CLASSES, assertStorageClass } = require("./storageClasses");
const { getPlatformProcessSnapshot, emitPlatformEvent } = require("./telemetry");
const {
  getEvidenceStore,
  EvidenceStoreNotConfiguredError,
  setEvidenceStoreForTests,
  NoopEvidenceStore
} = require("./evidenceStore");
const { assertNoPublicAdminTargets, listCurrentPorts } = require("./portRegistry");

describe("platform foundation", () => {
  it("storage classes are closed set", () => {
    assert.equal(assertStorageClass(STORAGE_CLASSES.TRANSACTIONAL), "TRANSACTIONAL");
    assert.throws(() => assertStorageClass("HOT_MESS"), /Unknown storage class/);
  });

  it("process snapshot does not claim customer health", () => {
    const s = getPlatformProcessSnapshot();
    assert.ok(s.uptimeSec >= 0);
    assert.match(s.meaning, /Does not imply customer/);
    emitPlatformEvent("test.event", { ok: true });
  });

  it("evidence store fail-closed when not configured", async () => {
    setEvidenceStoreForTests(new NoopEvidenceStore());
    await assert.rejects(() => getEvidenceStore().put({}), (err) => {
      assert.equal(err.code, "EVIDENCE_STORE_NOT_CONFIGURED");
      return err instanceof EvidenceStoreNotConfiguredError;
    });
  });

  it("port registry keeps admin engines private", () => {
    const r = assertNoPublicAdminTargets();
    assert.equal(r.ok, true);
    assert.ok(listCurrentPorts().some((p) => p.service === "backend"));
  });
});
