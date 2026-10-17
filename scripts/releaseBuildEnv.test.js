const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  classifyBackendUrl,
  evaluateReleaseBuild,
  resolvePublicBackendUrl
} = require("./releaseBuildEnv");

describe("release build environment", () => {
  it("skips unless the publication flag is set", () => {
    const result = evaluateReleaseBuild({
      env: {},
      files: { ".env.local": "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000\n" }
    });
    assert.equal(result.status, "SKIPPED");
  });

  it("rejects a local file when publication is requested and the shell does not override it", () => {
    const result = evaluateReleaseBuild({
      env: { ARGOS_RELEASE_BUILD: "1" },
      files: { ".env.local": "NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000\n" }
    });
    assert.equal(result.status, "FAIL");
    assert.equal(result.kind, "LOCAL");
  });

  it("lets an explicit https value override a local file", () => {
    const resolved = resolvePublicBackendUrl({
      env: { NEXT_PUBLIC_BACKEND_URL: "https://api.example.test" },
      files: { ".env.local": "NEXT_PUBLIC_BACKEND_URL=http://localhost:4000\n" }
    });
    assert.equal(classifyBackendUrl(resolved), "PUBLIC_HTTPS");
    const result = evaluateReleaseBuild({
      env: {
        ARGOS_RELEASE_BUILD: "1",
        NEXT_PUBLIC_BACKEND_URL: "https://api.example.test"
      },
      files: { ".env.local": "NEXT_PUBLIC_BACKEND_URL=http://localhost:4000\n" }
    });
    assert.equal(result.status, "PASS");
  });

  it("rejects http and empty publication URLs", () => {
    assert.equal(classifyBackendUrl("http://api.example.test"), "NOT_HTTPS");
    assert.equal(
      evaluateReleaseBuild({ env: { ARGOS_RELEASE_BUILD: "1" }, files: {} }).kind,
      "ABSENT"
    );
  });
});
