const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const createPublicWebProjectInvitationsRouter = require("./publicWebProjectInvitations");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { createInvitationService } = require("../lib/webProjects/invitationService");
const { GENERIC_INVALID } = require("../lib/webProjects/invitationService");

function httpCall(app, method, path, { body, cookies, origin } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const headers = { "content-type": "application/json" };
      if (origin) headers.origin = origin;
      if (cookies) headers.cookie = cookies;
      const req = http.request(
        { host: "127.0.0.1", port, path, method, headers },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            server.close();
            resolve({
              status: res.statusCode,
              json: raw ? JSON.parse(raw) : null,
              headers: res.headers
            });
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
  const state = {
    users: [{ id: 99, email: "staff@example.com", role: "admin", is_active: true }],
    orgs: [],
    members: [],
    invitations: [],
    activity: [],
    refresh: [],
    nextOrgId: 10,
    nextInviteId: 1,
    nextUserId: 300
  };

  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s.includes("FROM users WHERE email")) {
      return { rows: state.users.filter((row) => row.email === params[0]) };
    }
    if (s.startsWith("INSERT INTO users")) {
      const user = {
        id: state.nextUserId++,
        email: params[0],
        password: params[1],
        name: params[2],
        company: params[3],
        role: "cliente",
        is_active: true
      };
      state.users.push(user);
      return { rows: [user] };
    }
    if (s.includes("FROM organizations WHERE id")) {
      return { rows: state.orgs.filter((row) => row.id === params[0]) };
    }
    if (s.includes("FROM organizations WHERE slug")) {
      return { rows: state.orgs.filter((row) => row.slug === params[0]) };
    }
    if (s.startsWith("INSERT INTO organizations")) {
      const org = { id: state.nextOrgId++, slug: params[0], name: params[1], status: "active" };
      state.orgs.push(org);
      return { rows: [org] };
    }
    if (s.includes("FROM organization_members") && s.includes("org_role")) {
      return {
        rows: state.members
          .filter((row) => row.organization_id === params[0] && row.user_id === params[1])
          .map((row) => ({ org_role: row.org_role }))
      };
    }
    if (s.startsWith("INSERT INTO organization_members")) {
      state.members.push({
        organization_id: params[0],
        user_id: params[1],
        org_role: params[2]
      });
      return { rows: [] };
    }
    if (s.includes("FROM web_project_invitations WHERE token_hash")) {
      return { rows: state.invitations.filter((row) => row.token_hash === params[0]) };
    }
    if (s.includes("FROM web_project_invitations WHERE id")) {
      return { rows: state.invitations.filter((row) => row.id === params[0]) };
    }
    if (s.includes("created_organization = TRUE")) {
      return {
        rows: state.invitations.filter(
          (row) => row.email === params[0] && row.created_organization === true && row.status === "PENDING"
        )
      };
    }
    if (s.includes("email = $1 AND organization_id = $2")) {
      return {
        rows: state.invitations.filter(
          (row) => row.email === params[0] && row.organization_id === params[1] && row.status === "PENDING"
        )
      };
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
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("delivery_status")) {
      const row = state.invitations.find((item) => item.id === params[1]);
      if (row) row.delivery_status = params[0];
      return { rows: [] };
    }
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("ACCEPTED")) {
      const row = state.invitations.find((item) => item.id === params[0]);
      if (row && row.status === "PENDING") {
        row.status = "ACCEPTED";
        row.accepted_at = new Date();
        row.accepted_by = params[1];
      }
      return { rows: [] };
    }
    if (s.startsWith("INSERT INTO activity_logs")) return { rows: [] };
    if (s.startsWith("INSERT INTO refresh_sessions")) {
      state.refresh.push({ user_id: params[0], jti: params[1] });
      return { rows: [] };
    }
    return { rows: [] };
  }

  return {
    state,
    query,
    async connect() {
      return {
        query: async (sql, params) => {
          const s = String(sql).replace(/\s+/g, " ").trim();
          if (s === "BEGIN" || s === "COMMIT" || s === "ROLLBACK") return { rows: [] };
          return query(sql, params);
        },
        release() {}
      };
    }
  };
}

function createApp() {
  const pool = createInvitePool();
  const projectService = createWebProjectService(createMemoryStore());
  const invitations = createInvitationService({
    pool,
    projectService,
    mailer: {
      canRevealInviteUrl: () => true,
      buildInviteUrl: (token) => `http://127.0.0.1:3011/auth/invite?token=${token}`,
      async send() {
        return { delivered: false, reason: "NO_EMAIL_CHANNEL" };
      }
    }
  });
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    "/api/web-project-invitations",
    createPublicWebProjectInvitationsRouter(pool, { projectService, invitations })
  );
  return { app, invitations, pool };
}

describe("public web project invitations contract", () => {
  before(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "phase9-test-jwt-secret-value-32chars";
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || "phase9-test-refresh-secret-value-32c";
  });

  it("resolve returns only public fields; invalid token is generic", async () => {
    const { app, invitations } = createApp();
    const created = await invitations.createInvitation({
      email: "nuevo@example.com",
      displayName: "Cliente Demo",
      projectType: "improve",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const ok = await httpCall(app, "GET", `/api/web-project-invitations/resolve?token=${encodeURIComponent(token)}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.invitation.displayName, "Cliente Demo");
    assert.equal(ok.json.invitation.projectType, "improve");
    assert.equal(ok.headers["referrer-policy"], "no-referrer");
    assert.doesNotMatch(JSON.stringify(ok.json), /token_hash|nuevo@example|organization_id|wpi_/i);

    const bad = await httpCall(app, "GET", "/api/web-project-invitations/resolve?token=wpi_not-a-real-token-value-xxxxxx");
    assert.equal(bad.status, 404);
    assert.equal(bad.json.error, GENERIC_INVALID);
    assert.doesNotMatch(JSON.stringify(bad.json), /usuario|organizaci/i);
  });

  it("accept new user redirects internally and does not echo token", async () => {
    const { app, invitations } = createApp();
    const created = await invitations.createInvitation({
      email: "alta@example.com",
      displayName: "Alta",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const accepted = await httpCall(app, "POST", "/api/web-project-invitations/accept", {
      body: { token, password: "ClaveValida1" }
    });
    assert.equal(accepted.status, 200);
    assert.match(accepted.json.redirectTo, /^\/dashboard\/proyectos\/\d+$/);
    assert.doesNotMatch(JSON.stringify(accepted.json), /wpi_|token_hash|password/i);
    assert.match(String(accepted.headers["set-cookie"] || ""), /argos_access/);
  });

  it("wrong logged account cannot accept", async () => {
    const { app, invitations } = createApp();
    const created = await invitations.createInvitation({
      email: "destino@example.com",
      displayName: "Destino",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const otherJwt = jwt.sign(
      { id: 1, email: "otro@example.com", role: "cliente" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const denied = await httpCall(app, "POST", "/api/web-project-invitations/accept", {
      body: { token },
      cookies: `argos_access=${otherJwt}`
    });
    assert.equal(denied.status, 409);
    assert.equal(denied.json.code, "WRONG_ACCOUNT");
    assert.doesNotMatch(JSON.stringify(denied.json), /destino@example|id 1/i);
  });
});
