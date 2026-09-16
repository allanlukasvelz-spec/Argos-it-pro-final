#!/usr/bin/env node
const http = require("node:http");
const path = require("node:path");
const express = require(path.join(__dirname, "..", "backend", "node_modules", "express"));
const { createMemoryStore } = require("../backend/lib/webProjects/memoryStore");
const { createWebProjectService } = require("../backend/lib/webProjects/service");
const { forceProjectCompleted, seedMinimalProject } = require("../backend/lib/webProjects/phase18.fixtures");
const createNocWebProjectsRouter = require("../backend/routes/nocWebProjects");
const requireNocAccess = require("../backend/middleware/requireNocAccess");

const ORG = 10;
const ORG_B = 20;
const ACTOR = 99;

function call(app, method, p, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path: p,
          method,
          headers: { "content-type": "application/json", origin: "http://127.0.0.1:3020" }
        },
        (res) => {
          let raw = "";
          res.on("data", (c) => {
            raw += c;
          });
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode, json: raw ? JSON.parse(raw) : null });
          });
        }
      );
      req.on("error", (e) => {
        server.close();
        reject(e);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

async function main() {
  const store = createMemoryStore();
  const svc = createWebProjectService(store);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: ACTOR, role: "admin" };
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service: svc }));

  const checks = [];
  const expect = (name, ok, detail = "") => {
    checks.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  };

  const project = await svc.createProject({
    organizationId: ORG,
    actorUserId: ACTOR,
    title: "HTTP18",
    projectType: "create"
  });
  const blocked = await call(
    app,
    "POST",
    `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG}`,
    { reason: "early" }
  );
  expect("POST archive non-COMPLETED → 409", blocked.status === 409 && blocked.json?.code === "ARCHIVE_NOT_ELIGIBLE");

  await forceProjectCompleted(store, ORG, project.id);
  const ok = await call(
    app,
    "POST",
    `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG}`,
    { reason: "Cierre" }
  );
  expect("POST archive COMPLETED → 200", ok.status === 200 && ok.json?.project?.archivedAt);
  expect("archive reason persisted", ok.json?.project?.archiveReason === "Cierre");

  const retry = await call(
    app,
    "POST",
    `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG}`,
    { reason: "Retry" }
  );
  expect(
    "POST archive retry idempotent",
    retry.status === 200 && retry.json?.project?.archiveReason === "Cierre"
  );

  const cross = await call(
    app,
    "POST",
    `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG_B}`
  );
  expect("POST cross-tenant archive → 404", cross.status === 404);

  const { project: seeded } = await seedMinimalProject(svc, ORG);
  await forceProjectCompleted(store, ORG, seeded.id);
  const commentBlocked = await call(
    app,
    "POST",
    `/api/noc/web-projects/${seeded.id}/comments?organization_id=${ORG}`,
    { body: "No" }
  );
  expect("comment after COMPLETED → 409", commentBlocked.status === 409);

  const credBlocked = await call(
    app,
    "POST",
    `/api/noc/web-projects/${seeded.id}/credential-status?organization_id=${ORG}`,
    { status: "REQUESTED" }
  );
  expect("credential after COMPLETED → 409", credBlocked.status === 409);

  const read = await call(app, "GET", `/api/noc/web-projects/${project.id}?organization_id=${ORG}`);
  expect("GET archived authorized → 200", read.status === 200);

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) process.exit(1);
  console.log(`\nPHASE 18 HTTP: ${checks.length}/${checks.length} PASS`);
}

main();
