const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createNocWebProjectInvitationsRouter = require("./nocWebProjectInvitations");
const requireNocAccess = require("../middleware/requireNocAccess");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { createInvitationService } = require("../lib/webProjects/invitationService");

function httpCall(app, method, path, body, user) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: { "content-type": "application/json" }
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode, json: raw ? JSON.parse(raw) : null });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

function createInvitePool() {
  const state = { users: [{ id: 99, email: "staff@example.com" }], orgs: [], members: [], invitations: [], activity: [], nextOrgId: 10, nextInviteId: 1, nextUserId: 300 };
  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s.includes("FROM organizations WHERE id")) return { rows: state.orgs.filter((row) => row.id === params[0]) };
    if (s.includes("FROM organizations WHERE slug")) return { rows: state.orgs.filter((row) => row.slug === params[0]) };
    if (s.startsWith("INSERT INTO organizations")) {
      const org = { id: state.nextOrgId++, slug: params[0], name: params[1], status: "active" };
      state.orgs.push(org);
      return { rows: [org] };
    }
    if (s.includes("FROM web_project_invitations WHERE token_hash")) return { rows: state.invitations.filter((row) => row.token_hash === params[0]) };
    if (s.includes("FROM web_project_invitations WHERE id") || s.includes("WHERE i.id")) {
      return { rows: state.invitations.filter((row) => row.id === params[0]).map((row) => ({ ...row, organization_name: "Demo" })) };
    }
    if (s.includes("FROM web_project_invitations i")) {
      return { rows: state.invitations.map((row) => ({ ...row, organization_name: "Demo" })) };
    }
    if (s.includes("created_organization = TRUE")) {
      return { rows: state.invitations.filter((row) => row.email === params[0] && row.created_organization && row.status === "PENDING") };
    }
    if (s.startsWith("INSERT INTO web_project_invitations")) {
      const row = {
        id: state.nextInviteId++,
        email: params[0],
        display_name: params[1],
        project_type: params[2],
        project_title: params[3],
        organization_id: params[4],
        web_project_id: params[5],
        invited_by: params[6],
        token_hash: params[7],
        status: "PENDING",
        delivery_status: "NONE",
        created_organization: params[8],
        intended_org_role: params[9],
        expires_at: params[10],
        accepted_at: null,
        accepted_by: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      state.invitations.push(row);
      return { rows: [row] };
    }
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("REVOKED")) {
      const row = state.invitations.find((item) => item.id === params[0]);
      if (row) row.status = "REVOKED";
      return { rows: [] };
    }
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("delivery_status")) {
      const row = state.invitations.find((item) => item.id === params[1]);
      if (row) row.delivery_status = params[0];
      return { rows: [] };
    }
    if (s.startsWith("INSERT INTO activity_logs")) return { rows: [] };
    return { rows: [] };
  }
  return { state, query };
}

function createApp(user) {
  const pool = createInvitePool();
  const projectService = createWebProjectService(createMemoryStore());
  const invitations = createInvitationService({
    pool,
    projectService,
    mailer: {
      canRevealInviteUrl: () => true,
      buildInviteUrl: (token) => `http://local.test/auth/invite?token=${token}`,
      async send() {
        return { delivered: false, reason: "NO_EMAIL_CHANNEL" };
      }
    }
  });
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    if (!user) return res.status(401).json({ error: "Token requerido" });
    req.user = user;
    next();
  });
  app.use(
    "/api/noc",
    requireNocAccess,
    createNocWebProjectInvitationsRouter(pool, { projectService, invitations })
  );
  return { app, invitations, pool };
}

describe("NOC web project invitations contract", () => {
  it("2 non-NOC cannot create; admin can", async () => {
    const cliente = createApp({ id: 1, role: "cliente" });
    const admin = createApp({ id: 99, role: "admin" });
    const denied = await httpCall(cliente.app, "POST", "/api/noc/web-project-invitations", {
      email: "x@example.com",
      displayName: "X",
      projectType: "create"
    });
    assert.equal(denied.json.code, "NOC_FORBIDDEN");
    const created = await httpCall(admin.app, "POST", "/api/noc/web-project-invitations", {
      email: "x@example.com",
      displayName: "Cliente Demo",
      projectType: "create"
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.invitation.status, "PENDING");
    assert.equal(created.json.delivery.delivered, false);
    assert.ok(created.json.inviteUrl);
    assert.doesNotMatch(JSON.stringify(created.json.invitation), /token_hash|wpi_/);
  });

  it("list and revoke hide token", async () => {
    const { app } = createApp({ id: 99, role: "admin" });
    const created = await httpCall(app, "POST", "/api/noc/web-project-invitations", {
      email: "y@example.com",
      displayName: "Y",
      projectType: "improve"
    });
    const listed = await httpCall(app, "GET", "/api/noc/web-project-invitations");
    assert.equal(listed.status, 200);
    assert.equal(listed.json.items[0].email, "y@example.com");
    assert.doesNotMatch(JSON.stringify(listed.json), /wpi_/);
    const revoked = await httpCall(
      app,
      "POST",
      `/api/noc/web-project-invitations/${created.json.invitation.id}/revoke`
    );
    assert.equal(revoked.json.invitation.status, "REVOKED");
  });
});
