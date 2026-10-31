const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");
const { WEB_PROJECT_NOTIFICATION_EVENTS } = require("./notificationCopy");
const {
  createSelfServiceService,
  defaultProjectTitle,
  GENERIC_START_ERROR
} = require("./selfServiceService");

function createSelfServicePool({
  users = [{ id: 7, email: "demo@example.test", name: "Demo Client", company: "Example Studio", role: "cliente", is_active: true }],
  orgs = [],
  members = [],
  invitations = []
} = {}) {
  const state = {
    users: users.map((row) => ({ ...row })),
    orgs: orgs.map((row) => ({ ...row })),
    members: members.map((row) => ({ ...row })),
    invitations: invitations.map((row) => ({ ...row })),
    activity: [],
    nextOrgId: 80,
    nextMemberId: 1,
    failAfter: null
  };

  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (state.failAfter && s.includes(state.failAfter)) {
      throw new Error("forced rollback");
    }
    if (s.includes("FROM users WHERE id")) {
      return { rows: state.users.filter((row) => Number(row.id) === Number(params[0])) };
    }
    if (s.includes("FROM users WHERE email")) {
      return { rows: state.users.filter((row) => row.email === params[0]) };
    }
    if (s.includes("FROM users") && s.includes("role IN")) {
      return {
        rows: state.users
          .filter((row) => ["admin", "super_admin"].includes(row.role) && row.is_active !== false)
          .map((row) => ({ user_id: row.id, role: row.role }))
      };
    }
    if (s.includes("FROM organization_members m")) {
      return {
        rows: state.members
          .filter((row) => Number(row.user_id) === Number(params[0]))
          .sort((a, b) => a.id - b.id)
          .map((row) => {
            const org = state.orgs.find((item) => Number(item.id) === Number(row.organization_id));
            return {
              organization_id: row.organization_id,
              org_role: row.org_role,
              slug: org?.slug || null,
              name: org?.name || null,
              status: org?.status || "active"
            };
          })
      };
    }
    if (s.includes("FROM organization_members") && s.includes("org_role")) {
      return {
        rows: state.members
          .filter((row) => Number(row.organization_id) === Number(params[0]) && Number(row.user_id) === Number(params[1]))
          .map((row) => ({ org_role: row.org_role }))
      };
    }
    if (s.includes("FROM organizations WHERE id")) {
      return { rows: state.orgs.filter((row) => Number(row.id) === Number(params[0])) };
    }
    if (s.includes("FROM organizations WHERE slug")) {
      return { rows: state.orgs.filter((row) => row.slug === params[0]) };
    }
    if (s.includes("INSERT INTO organizations")) {
      const org = { id: state.nextOrgId++, slug: params[0], name: params[1], status: "active" };
      state.orgs.push(org);
      return { rows: [org] };
    }
    if (s.includes("INSERT INTO organization_members")) {
      const exists = state.members.find(
        (row) => Number(row.organization_id) === Number(params[0]) && Number(row.user_id) === Number(params[1])
      );
      if (!exists) {
        state.members.push({
          id: state.nextMemberId++,
          organization_id: params[0],
          user_id: params[1],
          org_role: params[2] || "org_owner"
        });
      }
      return { rows: [] };
    }
    if (s.includes("FROM activity_logs") && s.includes("WEB_PROJECT_SELF_SERVICE")) {
      return {
        rows: state.activity
          .filter((row) => Number(row.user_id) === Number(params[0]))
          .filter((row) =>
            [
              "WEB_PROJECT_SELF_SERVICE_STARTED",
              "WEB_PROJECT_SELF_SERVICE_ORGANIZATION_CREATED",
              "WEB_PROJECT_SELF_SERVICE_PROJECT_CREATED"
            ].includes(row.action_type)
          )
          .sort((a, b) => b.id - a.id)
          .map((row) => ({
            organization_id: row.organization_id,
            action_type: row.action_type,
            details: row.details
          }))
      };
    }
    if (s.startsWith("INSERT INTO activity_logs")) {
      const details = typeof params[3] === "string" ? JSON.parse(params[3]) : params[3];
      const row = {
        id: state.activity.length + 1,
        user_id: params[0],
        organization_id: params[1],
        action_type: params[2],
        details
      };
      state.activity.push(row);
      return { rows: [row] };
    }
    if (s.includes("FROM web_project_invitations")) {
      return { rows: state.invitations.slice() };
    }
    return { rows: [] };
  }

  return {
    state,
    query,
    connect: async () => {
      const client = {
        query,
        release() {}
      };
      return client;
    }
  };
}

function harness(poolOptions) {
  const pool = createSelfServicePool(poolOptions);
  const store = createMemoryStore();
  const notifications = { emitted: [], fail: false };
  notifications.emitWebProject = async (payload) => {
    if (notifications.fail) throw new Error("smtp down");
    notifications.emitted.push(payload);
    return { created: 1, skipped: false };
  };
  const projectService = createWebProjectService(store);
  const selfService = createSelfServiceService(pool, { projectService, notifications });
  return { pool, store, projectService, selfService, notifications };
}

describe("phase 10 web project self-service", () => {
  it("01 new user without org creates org owner membership and INTAKE project", async () => {
    const { selfService, pool, notifications } = harness();
    const result = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      organizationName: "Example Studio",
      idempotencyKey: "ss-new-user-01"
    });
    assert.equal(result.created, true);
    assert.equal(result.project.workflowStatus, "INTAKE");
    assert.equal(result.project.projectType, "create");
    assert.equal(result.organization.created, true);
    assert.equal(pool.state.members[0].org_role, "org_owner");
    assert.equal(pool.state.invitations.length, 0);
    assert.equal(notifications.emitted[0].kind, WEB_PROJECT_NOTIFICATION_EVENTS.SELF_SERVICE_STARTED);
    assert.equal(notifications.emitted[0].audience, "staff");
    assert.match(JSON.stringify(pool.state.activity), /WEB_PROJECT_SELF_SERVICE_STARTED/);
    assert.match(JSON.stringify(pool.state.activity), /WEB_PROJECT_SELF_SERVICE_ORGANIZATION_CREATED/);
    assert.match(JSON.stringify(pool.state.activity), /WEB_PROJECT_SELF_SERVICE_PROJECT_CREATED/);
    assert.equal(JSON.stringify(pool.state).includes("BonaBarcelona"), false);
  });

  it("02-03 existing writable org is reused and does not duplicate org or membership", async () => {
    const { selfService, pool } = harness({
      orgs: [{ id: 80, slug: "example-studio", name: "Example Studio", status: "active" }],
      members: [{ id: 1, organization_id: 80, user_id: 7, org_role: "org_owner" }]
    });
    const first = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "improve",
      idempotencyKey: "ss-existing-02"
    });
    assert.equal(first.organization.id, 80);
    assert.equal(first.organization.created, false);
    assert.equal(first.project.projectType, "improve");
    assert.equal(pool.state.orgs.length, 1);
    assert.equal(pool.state.members.length, 1);
  });

  it("05 slug collision is retried until unique", async () => {
    const orig = crypto.randomBytes;
    let calls = 0;
    crypto.randomBytes = (size) => {
      if (size === 3) {
        calls += 1;
        return Buffer.from(calls === 1 ? "aaaaaa" : "bbbbbb", "hex");
      }
      return orig.call(crypto, size);
    };
    try {
      const { selfService, pool } = harness({
        orgs: [{ id: 11, slug: "example-studio-aaaaaa", name: "Taken", status: "active" }]
      });
      const result = await selfService.startSelfService({
        actorUserId: 7,
        projectType: "create",
        organizationName: "Example Studio",
        idempotencyKey: "ss-slug-05"
      });
      assert.equal(result.organization.created, true);
      assert.equal(pool.state.orgs.at(-1).slug, "example-studio-bbbbbb");
    } finally {
      crypto.randomBytes = orig;
    }
  });

  it("07 existing org member is not escalated", async () => {
    const { selfService, pool } = harness({
      orgs: [{ id: 80, slug: "acme", name: "Acme", status: "active" }],
      members: [{ id: 1, organization_id: 80, user_id: 7, org_role: "org_member" }]
    });
    await assert.rejects(
      () =>
        selfService.startSelfService({
          actorUserId: 7,
          projectType: "create",
          organizationId: 80,
          idempotencyKey: "ss-member-07"
        }),
      (err) => err instanceof WebProjectError && err.status === 403 && err.code === ERROR_CODES.FORBIDDEN
    );
    assert.equal(pool.state.members[0].org_role, "org_member");
  });

  it("08-11 createProject is used with INTAKE and create/improve", async () => {
    const { selfService, store } = harness();
    const created = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      title: "Sitio de Example Studio",
      idempotencyKey: "ss-create-10"
    });
    const improved = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "improve",
      createOrganization: true,
      organizationName: "Example Studio 2",
      idempotencyKey: "ss-improve-11"
    });
    assert.equal(created.project.workflowStatus, "INTAKE");
    assert.equal(improved.project.workflowStatus, "INTAKE");
    assert.equal(store.state.projects.every((row) => row.workflow_status === "INTAKE"), true);
    assert.equal(
      store.state.activity.some((row) => row.details?.source === "self_service"),
      true
    );
  });

  it("12-14 protected payload and foreign org are rejected", async () => {
    const { selfService } = harness({
      users: [
        { id: 7, email: "demo@example.test", name: "Demo Client", role: "cliente", is_active: true },
        { id: 8, email: "other@example.test", name: "Other", role: "cliente", is_active: true }
      ],
      orgs: [
        { id: 80, slug: "mine", name: "Mine", status: "active" },
        { id: 90, slug: "theirs", name: "Theirs", status: "active" }
      ],
      members: [
        { id: 1, organization_id: 80, user_id: 7, org_role: "org_owner" },
        { id: 2, organization_id: 90, user_id: 8, org_role: "org_owner" }
      ]
    });
    const ok = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      workflowStatus: "COMPLETED",
      organization_id: 90,
      createdBy: 99,
      idempotencyKey: "ss-protected-12"
    });
    assert.equal(ok.project.workflowStatus, "INTAKE");
    assert.equal(ok.organization.id, 80);
    await assert.rejects(
      () =>
        selfService.startSelfService({
          actorUserId: 7,
          projectType: "create",
          organizationId: 90,
          idempotencyKey: "ss-spoof-13"
        }),
      (err) => err instanceof WebProjectError && err.status === 404 && err.code === ERROR_CODES.NOT_FOUND
    );
  });

  it("15-16 retry with same idempotency key does not duplicate", async () => {
    const { selfService, store } = harness();
    const first = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-retry-15"
    });
    const second = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-retry-15"
    });
    assert.equal(second.reused, true);
    assert.equal(second.project.id, first.project.id);
    assert.equal(store.state.projects.length, 1);
  });

  it("17 explicit second project is allowed", async () => {
    const { selfService, store } = harness({
      orgs: [{ id: 80, slug: "example-studio", name: "Example Studio", status: "active" }],
      members: [{ id: 1, organization_id: 80, user_id: 7, org_role: "org_owner" }]
    });
    const a = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-second-a"
    });
    const b = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "improve",
      idempotencyKey: "ss-second-b"
    });
    assert.notEqual(a.project.id, b.project.id);
    assert.equal(store.state.projects.length, 2);
  });

  it("20-21 audit and notification are meaningful without duplicate spam on retry", async () => {
    const { selfService, notifications } = harness();
    await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-notify-21"
    });
    await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-notify-21"
    });
    assert.equal(notifications.emitted.length, 1);
  });

  it("22 notify failure does not corrupt the project", async () => {
    const { selfService, notifications, store } = harness();
    notifications.fail = true;
    const result = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-notify-fail-22"
    });
    assert.equal(result.project.workflowStatus, "INTAKE");
    assert.equal(store.state.projects.length, 1);
  });

  it("23-25 invitation compatibility — no fabricated invite row", async () => {
    const { selfService, pool } = harness();
    await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      idempotencyKey: "ss-invite-compat-23"
    });
    assert.equal(pool.state.invitations.length, 0);
    assert.equal(pool.state.users.filter((row) => row.email === "demo@example.test").length, 1);
  });

  it("27 validation rejects missing type", async () => {
    const { selfService } = harness();
    await assert.rejects(
      () =>
        selfService.startSelfService({
          actorUserId: 7,
          idempotencyKey: "ss-invalid-27"
        }),
      (err) => err instanceof WebProjectError && err.status === 400
    );
  });

  it("28 project failure after org insert is retried on the same org", async () => {
    const { pool, notifications } = harness();
    const store = createMemoryStore();
    const originalInsert = store.insertProject.bind(store);
    let fails = 1;
    store.insertProject = async (...args) => {
      if (fails > 0) {
        fails -= 1;
        throw new Error("forced project failure");
      }
      return originalInsert(...args);
    };
    const projectService = createWebProjectService(store);
    const selfService = createSelfServiceService(pool, { projectService, notifications });
    await assert.rejects(
      () =>
        selfService.startSelfService({
          actorUserId: 7,
          projectType: "create",
          organizationName: "Example Studio",
          idempotencyKey: "ss-rollback-28"
        }),
      /forced project failure/
    );
    assert.equal(pool.state.orgs.length, 1);
    const retry = await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      organizationName: "Example Studio",
      idempotencyKey: "ss-rollback-28"
    });
    assert.equal(retry.project.workflowStatus, "INTAKE");
    assert.equal(pool.state.orgs.length, 1);
    assert.equal(store.state.projects.length, 1);
  });

  it("29 archived org cannot be selected", async () => {
    const { selfService } = harness({
      orgs: [{ id: 80, slug: "old", name: "Old", status: "archived" }],
      members: [{ id: 1, organization_id: 80, user_id: 7, org_role: "org_owner" }]
    });
    await assert.rejects(
      () =>
        selfService.startSelfService({
          actorUserId: 7,
          projectType: "create",
          organizationId: 80,
          idempotencyKey: "ss-archived-29"
        }),
      (err) => err instanceof WebProjectError && err.status === 403
    );
  });

  it("30 context lists writable orgs and INTAKE resume without jargon", async () => {
    const { selfService } = harness({
      orgs: [
        { id: 80, slug: "a", name: "Example Studio", status: "active" },
        { id: 81, slug: "b", name: "Other Studio", status: "active" }
      ],
      members: [
        { id: 1, organization_id: 80, user_id: 7, org_role: "org_owner" },
        { id: 2, organization_id: 81, user_id: 7, org_role: "org_admin" }
      ]
    });
    await selfService.startSelfService({
      actorUserId: 7,
      projectType: "create",
      organizationId: 80,
      idempotencyKey: "ss-context-30"
    });
    await assert.rejects(
      () =>
        selfService.startSelfService({
          actorUserId: 7,
          projectType: "improve",
          idempotencyKey: "ss-select-30"
        }),
      (err) =>
        err instanceof WebProjectError &&
        err.status === 409 &&
        err.code === ERROR_CODES.ORG_SELECTION_REQUIRED &&
        err.organizations.length === 2
    );
    const context = await selfService.getContext(7);
    assert.equal(context.organizations.length, 2);
    assert.equal(context.intakeProjects.length, 1);
    assert.equal(context.defaultOrganizationId, null);
    assert.equal(defaultProjectTitle("Demo Client"), "Web de Demo Client");
    assert.match(GENERIC_START_ERROR, /iniciar el proyecto/);
  });
});
