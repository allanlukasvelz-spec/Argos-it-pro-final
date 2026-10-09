/**
 * ObjectStore contract — LocalPrivateObjectStore
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { registerObjectStoreContractSuite } = require("./objectStore.contract.test");
const { LocalPrivateObjectStore } = require("./localPrivateObjectStore");

registerObjectStoreContractSuite("local", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "argos-contract-local-"));
  return {
    store: new LocalPrivateObjectStore({ rootDir: root }),
    cleanup: async () => fs.rmSync(root, { recursive: true, force: true })
  };
});
