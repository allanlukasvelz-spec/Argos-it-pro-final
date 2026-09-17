#!/usr/bin/env node
/**
 * Provision a web project through the same service as NOC.
 * No product tenant names. Values come from env/args only.
 *
 *   ORG_SLUG=acme PROJECT_TITLE="Renovación web" WEBSITE_HOSTNAME=www.example.com \
 *   PROJECT_TYPE=improve ACTOR_USER_ID=1 node backend/scripts/provision-web-project.js
 *
 * Optional org create (still generic):
 *   CREATE_ORG=1 ORG_NAME="Acme" OWNER_USER_ID=1 ...
 *
 * Refuses non-local DATABASE_URL unless ALLOW_REMOTE_PROVISION=1.
 */
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Pool } = require("pg");
const { createSqlStore } = require("../lib/webProjects/sqlStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { WebProjectError } = require("../lib/webProjects/errors");
const {
  provisionWebProject,
  databaseUrlLooksLocal
} = require("../lib/webProjects/provision");

function parseArgs(argv) {
  const out = {};
  for (const token of argv.slice(2)) {
    const match = token.match(/^--([a-zA-Z0-9-]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    out[key] = match[2];
  }
  return out;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL requerido");
    process.exit(2);
  }
  if (!databaseUrlLooksLocal(databaseUrl) && process.env.ALLOW_REMOTE_PROVISION !== "1") {
    console.error("DATABASE_URL no es local. Abortado. Usa ALLOW_REMOTE_PROVISION=1 solo de forma explícita.");
    process.exit(2);
  }

  const input = { ...process.env, ...parseArgs(process.argv) };
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const service = createWebProjectService(createSqlStore(pool));
    const result = await provisionWebProject(pool, service, input);
    console.log(
      JSON.stringify(
        {
          created: result.created,
          reused: result.reused,
          organizationId: result.organization.id,
          organizationSlug: result.organization.slug,
          projectId: result.project.id,
          title: result.project.title,
          websiteHostname: result.project.websiteHostname,
          workflowStatus: result.project.workflowStatus
        },
        null,
        2
      )
    );
  } catch (err) {
    if (err instanceof WebProjectError) {
      console.error(JSON.stringify({ error: err.message, code: err.code, status: err.status }));
      process.exit(err.status === 404 || err.status === 409 ? 3 : 2);
    }
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
