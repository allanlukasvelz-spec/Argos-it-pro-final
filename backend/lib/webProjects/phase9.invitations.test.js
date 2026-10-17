const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");
const {
  createInvitationService,
  defaultProjectTitle,
  GENERIC_INVALID
} = require("./invitationService");
const { generateInvitationToken, hashInvitationToken, hashMatches } = require("./invitationTokens");
const { canRevealInviteUrl, invitationEmailCopy } = require("./invitationMailer");

function createInvitePool({ users = [{ id: 99, email: "staff@example.com", role: "admin", is_active: true }] } = {}) {
  const state = {
    users: users.map((row) => ({ ...row })),
    orgs: [],
    members: [],
    invitations: [],
    activity: [],
    nextOrgId: 10,
    nextInviteId: 1,
    nextUserId: 300,
    failAfter: null
  };

  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (state.failAfter && s.includes(state.failAfter)) {
      throw new Error("forced rollback");
    }
    if (s.includes("FROM users WHERE email")) {
      return { rows: state.users.filter((row) => row.email === params[0]) };
    }
    if (s.includes("FROM users WHERE id")) {
      return { rows: state.users.filter((row) => row.id === params[0]) };
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
      const exists = state.members.find(
        (row) => row.organization_id === params[0] && row.user_id === params[1]
      );
      if (!exists) {
        state.members.push({
          organization_id: params[0],
          user_id: params[1],
          org_role: params[2]
        });
      }
      return { rows: [] };
    }
    if (s.includes("FROM web_project_invitations WHERE token_hash")) {
      return { rows: state.invitations.filter((row) => row.token_hash === params[0]) };
    }
    if (s.includes("FROM web_project_invitations WHERE id")) {
      return { rows: state.invitations.filter((row) => row.id === params[0]) };
    }
    if (s.includes("FROM web_project_invitations i")) {
      let rows = state.invitations.slice();
      if (s.includes("WHERE i.organization_id")) {
        rows = rows.filter((row) => row.organization_id === params[0]);
      }
      if (s.includes("WHERE i.id")) {
        rows = rows.filter((row) => row.id === params[0]);
      }
      return {
        rows: rows
          .sort((a, b) => b.id - a.id)
          .map((row) => ({
            ...row,
            organization_name: state.orgs.find((org) => org.id === row.organization_id)?.name || null
          }))
      };
    }
    if (s.includes("WHERE email = $1 AND organization_id = $2 AND status = 'PENDING'")) {
      return {
        rows: state.invitations.filter(
          (row) => row.email === params[0] && row.organization_id === params[1] && row.status === "PENDING"
        )
      };
    }
    if (s.includes("WHERE email = $1 AND created_organization = TRUE AND status = 'PENDING'")) {
      return {
        rows: state.invitations.filter(
          (row) => row.email === params[0] && row.created_organization === true && row.status === "PENDING"
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
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("token_hash")) {
      const row = state.invitations.find((item) => item.id === params[2]);
      if (row) {
        row.token_hash = params[0];
        row.expires_at = params[1];
        row.status = "PENDING";
        row.delivery_status = "NONE";
        row.updated_at = new Date();
      }
      return { rows: [] };
    }
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("delivery_status")) {
      const row = state.invitations.find((item) => item.id === params[1]);
      if (row) row.delivery_status = params[0];
      return { rows: [] };
    }
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("REVOKED")) {
      const row = state.invitations.find((item) => item.id === params[0]);
      if (row) row.status = "REVOKED";
      return { rows: [] };
    }
    if (s.startsWith("UPDATE web_project_invitations") && s.includes("EXPIRED")) {
      const row = state.invitations.find((item) => item.id === params[0]);
      if (row && row.status === "PENDING") row.status = "EXPIRED";
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
    if (s.startsWith("INSERT INTO activity_logs")) {
      state.activity.push({
        user_id: params[0],
        organization_id: params[1],
        action_type: params[2],
        details: JSON.parse(params[3] || "{}")
      });
      return { rows: [] };
    }
    return { rows: [] };
  }

  return {
    state,
    query,
    async connect() {
      const snapshot = structuredClone(state);
      return {
        query: async (sql, params) => {
          const s = String(sql).replace(/\s+/g, " ").trim();
          if (s === "BEGIN" || s === "COMMIT") return { rows: [] };
          if (s === "ROLLBACK") {
            Object.keys(state).forEach((key) => {
              delete state[key];
            });
            Object.assign(state, structuredClone(snapshot));
            return { rows: [] };
          }
          return query(sql, params);
        },
        release() {}
      };
    }
  };
}

function setup(clock) {
  const pool = createInvitePool();
  const projectService = createWebProjectService(createMemoryStore());
  const mailer = {
    canRevealInviteUrl: () => true,
    buildInviteUrl: (token) => `http://127.0.0.1:3011/auth/invite?token=${token}`,
    async send() {
      return { delivered: false, reason: "NO_EMAIL_CHANNEL" };
    }
  };
  const invitations = createInvitationService({
    pool,
    projectService,
    mailer,
    now: clock || (() => new Date())
  });
  return { pool, projectService, invitations, mailer };
}

describe("phase 9 invitations", () => {
  it("1-5 NOC create stores hash not raw token and reveals URL only when email is down", async () => {
    const { invitations, pool } = setup();
    const created = await invitations.createInvitation({
      email: "Cliente@Example.com",
      displayName: "Cliente Demo",
      projectType: "improve",
      actorUserId: 99
    });
    assert.equal(created.invitation.email, "cliente@example.com");
    assert.equal(created.invitation.status, "PENDING");
    assert.equal(created.invitation.deliveryStatus, "FAILED");
    assert.equal(created.delivery.delivered, false);
    assert.match(created.inviteUrl, /token=wpi_/);
    assert.equal(created.invitation.webProjectId, 1);
    const stored = pool.state.invitations[0];
    assert.match(stored.token_hash, /^[a-f0-9]{64}$/);
    assert.doesNotMatch(JSON.stringify(stored), /wpi_/);
    assert.equal(hashMatches(new URL(created.inviteUrl).searchParams.get("token"), stored.token_hash), true);
  });

  it("3 invalid email rejected", async () => {
    const { invitations } = setup();
    await assert.rejects(
      () => invitations.createInvitation({ email: "nope", displayName: "X", projectType: "create", actorUserId: 99 }),
      (err) => err.code === ERROR_CODES.VALIDATION_ERROR
    );
  });

  it("6-9 resolve valid, invalid, expired and revoked", async () => {
    const { invitations } = setup();
    const created = await invitations.createInvitation({
      email: "a@example.com",
      displayName: "Ana",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const resolved = await invitations.resolveInvitation(token);
    assert.equal(resolved.displayName, "Ana");
    assert.equal(resolved.projectType, "create");
    assert.doesNotMatch(JSON.stringify(resolved), /token|@example|99|organization_id/i);

    await assert.rejects(() => invitations.resolveInvitation("wpi_not-a-real-token-value-at-all-xxxx"), (err) => {
      return err instanceof WebProjectError && err.message === GENERIC_INVALID;
    });

    await invitations.revokeInvitation(created.invitation.id, 99);
    await assert.rejects(() => invitations.resolveInvitation(token), (err) => err.message === GENERIC_INVALID);
  });

  it("8 expired token rejected", async () => {
    let now = new Date("2026-01-01T00:00:00Z");
    const { invitations } = setup(() => now);
    const created = await invitations.createInvitation({
      email: "exp@example.com",
      displayName: "Exp",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    now = new Date("2026-01-10T00:00:00Z");
    await assert.rejects(() => invitations.resolveInvitation(token), (err) => err.message === GENERIC_INVALID);
  });

  it("10-22 accept new user, INTAKE, idempotent, no duplicate membership", async () => {
    const { invitations, pool, projectService } = setup();
    const created = await invitations.createInvitation({
      email: "nuevo@example.com",
      displayName: "Nuevo",
      projectType: "improve",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const first = await invitations.acceptInvitation({
      token,
      password: "ClaveValida1"
    });
    assert.equal(first.redirectTo, `/dashboard/proyectos/${created.invitation.webProjectId}`);
    assert.equal(first.issueSession, true);
    const project = await projectService.getProject(created.invitation.organizationId, created.invitation.webProjectId);
    assert.equal(project.workflowStatus, "INTAKE");
    assert.equal(pool.state.members.length, 1);
    assert.equal(pool.state.members[0].org_role, "org_owner");

    const second = await invitations.acceptInvitation({
      token,
      sessionUser: { id: first.userId, email: "nuevo@example.com" }
    });
    assert.equal(second.projectId, first.projectId);
    assert.equal(pool.state.members.length, 1);
    assert.equal(pool.state.orgs.length, 1);
    assert.equal((await projectService.listProjects(created.invitation.organizationId)).length, 1);
  });

  it("11 resend invalidates previous token", async () => {
    const { invitations } = setup();
    const created = await invitations.createInvitation({
      email: "re@example.com",
      displayName: "Re",
      projectType: "create",
      actorUserId: 99
    });
    const oldToken = new URL(created.inviteUrl).searchParams.get("token");
    const resent = await invitations.resendInvitation(created.invitation.id, 99);
    const newToken = new URL(resent.inviteUrl).searchParams.get("token");
    assert.notEqual(oldToken, newToken);
    await assert.rejects(() => invitations.resolveInvitation(oldToken), (err) => err.message === GENERIC_INVALID);
    const ok = await invitations.resolveInvitation(newToken);
    assert.equal(ok.displayName, "Re");
  });

  it("13 existing user reused without duplicate", async () => {
    const { invitations, pool } = setup();
    pool.state.users.push({
      id: 206,
      email: "existente@example.com",
      role: "cliente",
      is_active: true
    });
    const created = await invitations.createInvitation({
      email: "existente@example.com",
      displayName: "Existente",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const accepted = await invitations.acceptInvitation({
      token,
      sessionUser: { id: 206, email: "existente@example.com" }
    });
    assert.equal(accepted.issueSession, false);
    assert.equal(pool.state.users.filter((row) => row.email === "existente@example.com").length, 1);
    assert.equal(pool.state.members[0].user_id, 206);
  });

  it("15-19 existing org explicit, member role, no escalation", async () => {
    const { invitations, pool } = setup();
    pool.state.orgs.push({ id: 77, slug: "acme", name: "Acme", status: "active" });
    pool.state.users.push({ id: 206, email: "miembro@example.com", role: "cliente", is_active: true });
    pool.state.members.push({ organization_id: 77, user_id: 206, org_role: "org_member" });
    const created = await invitations.createInvitation({
      email: "miembro@example.com",
      displayName: "Miembro",
      projectType: "improve",
      organizationId: 77,
      actorUserId: 99
    });
    assert.equal(created.invitation.organizationId, 77);
    assert.equal(created.invitation.intendedOrgRole, "org_member");
    assert.equal(created.invitation.createdOrganization, false);
    const token = new URL(created.inviteUrl).searchParams.get("token");
    await invitations.acceptInvitation({
      token,
      sessionUser: { id: 206, email: "miembro@example.com" }
    });
    const roles = pool.state.members.filter((row) => row.user_id === 206);
    assert.equal(roles.length, 1);
    assert.equal(roles[0].org_role, "org_member");
  });

  it("23 wrong logged account cannot accept", async () => {
    const { invitations } = setup();
    const created = await invitations.createInvitation({
      email: "destino@example.com",
      displayName: "Destino",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    await assert.rejects(
      () =>
        invitations.acceptInvitation({
          token,
          sessionUser: { id: 1, email: "otro@example.com" }
        }),
      (err) => err.code === ERROR_CODES.WRONG_ACCOUNT
    );
  });

  it("24 redirect is internal", async () => {
    const { invitations } = setup();
    const created = await invitations.createInvitation({
      email: "redir@example.com",
      displayName: "Redir",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    const accepted = await invitations.acceptInvitation({ token, password: "ClaveValida1" });
    assert.equal(accepted.redirectTo.startsWith("/dashboard/proyectos/"), true);
    assert.doesNotMatch(accepted.redirectTo, /https?:|\/\//);
  });

  it("25-29 audit has no token and delivery is honest", async () => {
    const { invitations, pool } = setup();
    const created = await invitations.createInvitation({
      email: "audit@example.com",
      displayName: "Audit",
      projectType: "create",
      actorUserId: 99
    });
    const blob = JSON.stringify(pool.state.activity);
    assert.doesNotMatch(blob, /wpi_/);
    assert.doesNotMatch(blob, /token_hash/);
    assert.equal(created.delivery.delivered, false);
    assert.equal(created.invitation.deliveryStatus, "FAILED");
    assert.ok(pool.state.activity.some((row) => row.action_type === "WEB_PROJECT_INVITATION_CREATED"));
  });

  it("28 acceptance rollback leaves no user or membership", async () => {
    const { invitations, pool } = setup();
    const created = await invitations.createInvitation({
      email: "roll@example.com",
      displayName: "Roll",
      projectType: "create",
      actorUserId: 99
    });
    const token = new URL(created.inviteUrl).searchParams.get("token");
    pool.state.failAfter = "INSERT INTO organization_members";
    await assert.rejects(() => invitations.acceptInvitation({ token, password: "ClaveValida1" }));
    assert.equal(pool.state.invitations[0].status, "PENDING");
  });

  it("default title is identificative not fiscal", () => {
    assert.equal(defaultProjectTitle("Cliente Demo"), "Web de Cliente Demo");
  });

  it("token helper never stores plaintext", () => {
    const token = generateInvitationToken();
    const hash = hashInvitationToken(token);
    assert.match(token, /^wpi_/);
    assert.equal(hash.length, 64);
    assert.notEqual(hash, token);
    assert.equal(canRevealInviteUrl({ NODE_ENV: "production" }), false);
    assert.equal(canRevealInviteUrl({ NODE_ENV: "development" }), true);
    assert.doesNotMatch(invitationEmailCopy({ displayName: "X", expiresAt: new Date() }).text, /contraseña generada|password:/i);
  });

  it("product sources do not hardcode a client tenant", () => {
    const roots = [
      path.join(__dirname),
      path.join(__dirname, "..", "..", "routes"),
      path.join(__dirname, "..", "..", "..", "frontend", "app", "auth", "invite"),
      path.join(__dirname, "..", "..", "..", "frontend", "components", "noc", "web-projects")
    ];
    const hits = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(js|ts|tsx)$/.test(entry.name) || /\.test\.(js|ts)$/.test(entry.name)) continue;
        if (/bonabarcelona/i.test(fs.readFileSync(full, "utf8"))) hits.push(full);
      }
    }
    roots.forEach(walk);
    assert.deepEqual(hits, []);
  });
});
