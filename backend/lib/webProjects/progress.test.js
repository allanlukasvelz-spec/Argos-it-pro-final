const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { calculateProgress } = require("./progress");
const { FORM_SCHEMA_VERSION_V1 } = require("./constants");

function field(key, value) {
  return { schema_version: FORM_SCHEMA_VERSION_V1, field_key: key, value };
}

describe("web project progress contract", () => {
  it("returns 0% when required fields are unanswered", () => {
    const empty = calculateProgress({});
    assert.ok(empty.required > 0);
    assert.equal(empty.completed, 0);
    assert.equal(empty.pending, empty.required);
    assert.equal(empty.percentage, 0);
    assert.equal(empty.ratio, 0);
  });

  it("marks applicable required fields as pending", () => {
    const pending = calculateProgress({
      responses: [field("has_existing_site", "no")]
    });
    assert.ok(pending.required > 0);
    assert.ok(pending.pending > 0);
    assert.ok(pending.percentage < 100);
    assert.equal(pending.units.some((unit) => unit.key === "existing_url"), false);
  });

  it("excludes NO_APLICA from the denominator", () => {
    const result = calculateProgress({
      responses: [
        field("site_kind", "corporate"),
        field("has_existing_site", "NO_APLICA"),
        field("cms", "NO_APLICA"),
        field("primary_language", "es"),
        field("needs_ecommerce", "NO_APLICA")
      ]
    });
    assert.ok(result.notApplicable >= 3);
    assert.equal(result.units.some((unit) => unit.key === "cms"), false);
    assert.equal(result.completed + result.pending, result.required);
  });

  it("reaches 100% when applicable required units are done", () => {
    const result = calculateProgress({
      responses: [
        field("site_kind", "corporate"),
        field("has_existing_site", "no"),
        field("cms", "wordpress"),
        field("primary_language", "es"),
        field("needs_ecommerce", "no")
      ]
    });
    assert.equal(result.pending, 0);
    assert.equal(result.percentage, 100);
    assert.equal(result.completed, result.required);
  });

  it("is deterministic for the same inputs", () => {
    const input = {
      responses: [field("site_kind", "landing"), field("has_existing_site", "no")]
    };
    assert.deepEqual(calculateProgress(input), calculateProgress(input));
  });
});
