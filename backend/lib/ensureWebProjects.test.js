const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function extractThrough008(sql) {
  const start = sql.indexOf("CREATE TABLE IF NOT EXISTS web_projects");
  assert.ok(start >= 0, "web_projects DDL missing");
  const marker = sql.indexOf("-- 009");
  const slice = marker === -1 ? sql.slice(start) : sql.slice(start, marker);
  return slice.replace(/\r\n/g, "\n").trim();
}

describe("web projects schema single source of truth", () => {
  it("008 CREATE remains historical and is not rewritten", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "008_web_projects.sql"),
      "utf8"
    );
    assert.match(migration, /CREATE TABLE IF NOT EXISTS web_projects/);
    assert.doesNotMatch(migration, /upload_status/);
  });

  it("schema.sql final document table includes 009 storage columns", () => {
    const schema = fs.readFileSync(path.join(ROOT, "database", "schema.sql"), "utf8");
    assert.match(schema, /upload_status TEXT NOT NULL DEFAULT 'PENDING'/);
    assert.match(schema, /stored_at TIMESTAMPTZ/);
    assert.match(schema, /failed_at TIMESTAMPTZ/);
  });

  it("schema.sql includes 012 brief notes without secrets or object keys", () => {
    const schema = fs.readFileSync(path.join(ROOT, "database", "schema.sql"), "utf8");
    const migration = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "012_web_project_brief_handoff.sql"),
      "utf8"
    );
    assert.match(schema, /CREATE TABLE IF NOT EXISTS web_project_brief_notes/);
    assert.match(schema, /CREATE TABLE IF NOT EXISTS web_project_architecture_handoffs/);
    assert.match(migration, /012_web_project_brief_handoff/);
    assert.doesNotMatch(migration, /object_key/);
    assert.doesNotMatch(migration, /\b(password|token|secret)\b/i);
  });

  it("schema.sql includes 011 invitations without raw token", () => {
    const schema = fs.readFileSync(path.join(ROOT, "database", "schema.sql"), "utf8");
    const migration = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "011_web_project_invitations.sql"),
      "utf8"
    );
    assert.match(schema, /CREATE TABLE IF NOT EXISTS web_project_invitations/);
    assert.match(schema, /token_hash TEXT NOT NULL UNIQUE/);
    assert.doesNotMatch(schema, /raw_token|token_plain/);
    assert.match(migration, /011_web_project_invitations/);
    assert.doesNotMatch(migration, /ALTER TABLE web_projects/);
  });

  it("schema.sql includes 010 review targets and document replacement", () => {
    const schema = fs.readFileSync(path.join(ROOT, "database", "schema.sql"), "utf8");
    assert.match(schema, /target_type TEXT NOT NULL DEFAULT 'PROJECT'/);
    assert.match(schema, /correction_message TEXT/);
    assert.match(schema, /replaces_document_id TEXT/);
    const migration008 = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "008_web_projects.sql"),
      "utf8"
    );
    assert.doesNotMatch(migration008, /target_type/);
    assert.doesNotMatch(migration008, /replaces_document_id/);
  });

  it("ensureWebProjects applies 008 then 009 then 010 then 011 then 012, not inline DDL", () => {
    const source = fs.readFileSync(path.join(__dirname, "ensureWebProjects.js"), "utf8");
    assert.match(source, /008_web_projects\.sql/);
    assert.match(source, /009_web_project_document_storage\.sql/);
    assert.match(source, /010_web_project_review_corrections\.sql/);
    assert.match(source, /011_web_project_invitations\.sql/);
    assert.match(source, /012_web_project_brief_handoff\.sql/);
    assert.doesNotMatch(source, /CREATE TABLE/);
    assert.doesNotMatch(source, /ALTER TABLE/);
  });

  it("credential table has no secret column", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "008_web_projects.sql"),
      "utf8"
    );
    const table = migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS web_project_credential_status"));
    assert.doesNotMatch(table, /\b(secret|password|token|api_key|private_key)\b/i);
    assert.match(table, /RECEIVED_OUT_OF_BAND/);
  });

  it("documentation tree uses RESTRICT, never CASCADE", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "008_web_projects.sql"),
      "utf8"
    );
    const ddl = extractThrough008(migration);
    assert.doesNotMatch(ddl, /ON DELETE CASCADE/);
    assert.match(ddl, /REFERENCES organizations\(id\) ON DELETE RESTRICT/);
    assert.match(ddl, /REFERENCES web_projects\(id\) ON DELETE RESTRICT/);
  });

  it("down files are marked PRE-DATA only", () => {
    const down008 = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "008_web_projects_down.sql"),
      "utf8"
    );
    const down009 = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "009_web_project_document_storage_down.sql"),
      "utf8"
    );
    const down010 = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "010_web_project_review_corrections_down.sql"),
      "utf8"
    );
    const down011 = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "011_web_project_invitations_down.sql"),
      "utf8"
    );
    const down012 = fs.readFileSync(
      path.join(ROOT, "database", "migrations", "012_web_project_brief_handoff_down.sql"),
      "utf8"
    );
    assert.match(down008, /SCHEMA ROLLBACK PRE-DATA ONLY/);
    assert.match(down009, /SCHEMA ROLLBACK PRE-DATA ONLY/);
    assert.match(down010, /SCHEMA ROLLBACK PRE-DATA ONLY/);
    assert.match(down011, /SCHEMA ROLLBACK PRE-DATA ONLY/);
    assert.match(down012, /SCHEMA ROLLBACK PRE-DATA ONLY/);
  });
});
