const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validateContactBody } = require("./validateContact");

const validBody = {
  name: "Ana Test",
  email: "ana@example.com",
  phone: "+34 600 000 000",
  company: "Empresa demo",
  service: "consultoria-it",
  message: "Necesitamos revisar nuestra infraestructura.",
  website: ""
};

describe("validateContactBody", () => {
  it("flags honeypot submissions", () => {
    const result = validateContactBody({ ...validBody, website: "https://spam.example" });
    assert.equal(result.honeypot, true);
  });

  it("requires mandatory fields", () => {
    const result = validateContactBody({ website: "" });
    assert.equal(result.honeypot, false);
    assert.ok(result.errors.includes("name"));
    assert.ok(result.errors.includes("message"));
  });

  it("accepts a valid payload", () => {
    const result = validateContactBody(validBody);
    assert.equal(result.honeypot, false);
    assert.deepEqual(result.errors, []);
    assert.equal(result.payload.email, "ana@example.com");
  });
});
