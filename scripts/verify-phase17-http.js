#!/usr/bin/env node
const http = require("node:http");
const { createMemoryStore } = require("../backend/lib/webProjects/memoryStore");
const { createWebProjectService } = require("../backend/lib/webProjects/service");
const { seedServiceBusiness } = require("../backend/lib/webProjects/phase13.fixtures");
const { bootstrapPublicationPhase } = require("../backend/lib/webProjects/phase17.fixtures");
const createNocWebProjectsRouter = require("../backend/routes/nocWebProjects");
const path = require("node:path");
const express = require(path.join(__dirname, "..", "backend", "node_modules", "express"));
const requireNocAccess = require("../backend/middleware/requireNocAccess");

const ORG = 10;
const ACTOR = 1;

function call(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
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
  const svc = createWebProjectService(createMemoryStore());
  const project = await svc.createProject({
    organizationId: ORG,
    actorUserId: ACTOR,
    title: "HTTP17",
    projectType: "create"
  });
  await seedServiceBusiness(svc, ORG, project.id, ACTOR);
  await bootstrapPublicationPhase(svc, ORG, project.id, ACTOR);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: ACTOR, role: "admin" };
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service: svc }));

  const get = await call(app, "GET", `/api/noc/web-projects/${project.id}/publication?organization_id=${ORG}`);
  const prep = await call(
    app,
    "POST",
    `/api/noc/web-projects/${project.id}/publication/prepare?organization_id=${ORG}`
  );
  const stepId = prep.json.steps[0].id;
  await call(
    app,
    "PATCH",
    `/api/noc/web-projects/${project.id}/publication/steps/${stepId}?organization_id=${ORG}`,
    { status: "READY" }
  );
  const patch = await call(
    app,
    "PATCH",
    `/api/noc/web-projects/${project.id}/publication/steps/${stepId}?organization_id=${ORG}`,
    { status: "IN_PROGRESS" }
  );
  const gate = await call(
    app,
    "POST",
    `/api/noc/web-projects/${project.id}/transition?organization_id=${ORG}`,
    { toStatus: "COMPLETED" }
  );

  const results = [
    { name: "GET publication", ok: get.status === 200 },
    { name: "POST prepare", ok: prep.status === 200 && prep.json.steps.length > 0 },
    { name: "PATCH step", ok: patch.status === 200 },
    { name: "generic COMPLETED blocked", ok: gate.status === 409 && gate.json.code === "COMPLETION_NOT_READY" }
  ];
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ pass: failed.length === 0, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
