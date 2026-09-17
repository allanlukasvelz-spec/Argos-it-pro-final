import { expect, type Browser, type Page } from "@playwright/test";
import { resetAuthRateLimits } from "./resetRateLimits";
import { BACKEND } from "./e2eEnv";
import { loginViaUi } from "./loginUi";
import { promoteEmailToAdmin } from "./promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";

const SERVICE_RESPONSES = [
  { fieldKey: "company_trade_name", value: "Demo Services Co" },
  { fieldKey: "company_city", value: "Valencia" },
  { fieldKey: "company_country", value: "España" },
  { fieldKey: "company_phone", value: "+34 600 000 000" },
  { fieldKey: "company_email", value: "hola@demo-services.test" },
  { fieldKey: "company_contact_name", value: "Ana Pérez" },
  { fieldKey: "company_entity_type", value: "company" },
  { fieldKey: "company_multiple_locations", value: "no" },
  { fieldKey: "has_existing_site", value: "no" },
  { fieldKey: "brand_has_logo", value: "no" },
  { fieldKey: "brand_has_manual", value: "no" },
  { fieldKey: "about_who", value: "Equipo demo" },
  { fieldKey: "about_what_you_do", value: "Servicios" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Web clara" },
  { fieldKey: "goals_b2b_b2c", value: "b2b" },
  { fieldKey: "goals_priority", value: "normal" },
  { fieldKey: "offer_kinds", value: ["services"] },
  { fieldKey: "content_has_texts", value: "no" },
  { fieldKey: "content_needs_copy", value: "yes" },
  { fieldKey: "media_has_photos", value: "no" },
  { fieldKey: "media_has_videos", value: "no" },
  { fieldKey: "media_needs_production", value: "yes" },
  { fieldKey: "media_commercial_rights", value: "pending" },
  { fieldKey: "primary_language", value: "es" },
  { fieldKey: "languages_multilingual", value: "no" },
  { fieldKey: "sales_mode", value: "contact_forms" },
  { fieldKey: "legal_notice", value: "yes" },
  { fieldKey: "legal_privacy", value: "yes" },
  { fieldKey: "legal_cookies", value: "yes" },
  { fieldKey: "access_ack_no_secrets", value: "yes" },
  { fieldKey: "confirm_reviewed", value: "yes" },
  { fieldKey: "confirm_use_material", value: "yes" },
  { fieldKey: "confirm_authorization", value: "yes" }
];

export function uniqueEmail(prefix: string) {
  return `argos-e2e-p18-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
}

async function loginCookies(request: Page["request"], email: string) {
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const res = await request.post(`${BACKEND}/api/auth/login`, {
    data: { email, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(res.ok()).toBeTruthy();
  const setCookie = res.headers()["set-cookie"] || "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

export async function completeRequiredPublicationSteps(
  request: Page["request"],
  projectId: number,
  organizationId: number,
  origin: string
) {
  const headers = { Origin: origin, "Content-Type": "application/json" };
  const pub = await (
    await request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/publication?organization_id=${organizationId}`,
      { headers }
    )
  ).json();
  const order = ["READY", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  for (const step of pub.steps.filter(
    (s: { required: boolean; status: string }) => s.required && s.status !== "NOT_APPLICABLE"
  )) {
    let current = step.status;
    if (current === "TODO") {
      await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/publication/steps/${step.id}?organization_id=${organizationId}`,
        { data: { status: "READY" }, headers }
      );
      current = "READY";
    }
    const start = order.indexOf(current as (typeof order)[number]);
    for (let i = Math.max(start + 1, 0); i < order.length; i += 1) {
      await request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/publication/steps/${step.id}?organization_id=${organizationId}`,
        { data: { status: order[i] }, headers }
      );
    }
  }
}

export async function bootstrapCompletedProject(page: Page, browser: Browser) {
  await resetAuthRateLimits();
  const origin = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
  const clientEmail = uniqueEmail("client");
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: clientEmail, password: PASSWORD, name: "Demo Client", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  const clientCookie = await loginCookies(page.request, clientEmail);
  const clientHeaders = { Origin: origin, "Content-Type": "application/json", Cookie: clientCookie };
  const createRes = await page.request.post(`${BACKEND}/api/client/web-projects`, {
    data: { title: "E2E Archive Project", projectType: "create" },
    headers: clientHeaders
  });
  expect(createRes.ok()).toBeTruthy();
  const projectId = Number((await createRes.json()).project.id);
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    data: { responses: SERVICE_RESPONSES },
    headers: clientHeaders
  });
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
    data: { itemType: "service", title: "Demo Service", payload: { summary: "S" } },
    headers: clientHeaders
  });
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/submit-review`, {
    headers: clientHeaders
  });
  const organizationId = Number(
    (await (
      await page.request.get(`${BACKEND}/api/client/web-projects/${projectId}`, {
        headers: { Origin: origin, Cookie: clientCookie }
      })
    ).json()).project.organizationId
  );

  const staffEmail = uniqueEmail("staff");
  await page.request.post(`${BACKEND}/api/auth/register`, {
    data: { email: staffEmail, password: PASSWORD, name: "NOC Staff", company: "ARGOS" },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  promoteEmailToAdmin(staffEmail);

  const staffCtx = await browser.newContext();
  const staffPage = await staffCtx.newPage();
  const staffLogin = await staffPage.request.post(`${BACKEND}/api/auth/login`, {
    data: { email: staffEmail, password: PASSWORD },
    headers: { Origin: origin, "Content-Type": "application/json" }
  });
  expect(staffLogin.ok(), `staff login → ${staffLogin.status()}`).toBeTruthy();
  const nocHeaders = { Origin: origin, "Content-Type": "application/json" };
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-architecture?organization_id=${organizationId}`,
    { data: { acknowledgeOpenItems: true, reason: "E2E P18" }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/architecture/approve?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-mockup?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/mockup/generate?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  const mockup = await (
    await staffPage.request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/mockup?organization_id=${organizationId}`,
      { headers: nocHeaders }
    )
  ).json();
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/mockup/send-client?organization_id=${organizationId}`,
    { data: { mockupId: mockup.mockup.id, acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await page.request.post(`${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`, {
    headers: { Origin: origin, Cookie: clientCookie }
  });
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-development?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/development/prepare?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  const dev = await (
    await staffPage.request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/development?organization_id=${organizationId}`,
      { headers: nocHeaders }
    )
  ).json();
  for (const item of dev.items.filter(
    (i: { required: boolean; status: string }) => i.required && i.status !== "NOT_APPLICABLE"
  )) {
    for (const status of ["READY", "IN_PROGRESS", "REVIEW", "DONE"]) {
      await staffPage.request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/development/items/${item.id}?organization_id=${organizationId}`,
        { data: { status }, headers: nocHeaders }
      );
    }
  }
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-validation?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/validation/prepare?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  const val = await (
    await staffPage.request.get(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation?organization_id=${organizationId}`,
      { headers: nocHeaders }
    )
  ).json();
  for (const check of val.checks.filter((c: { required: boolean }) => c.required)) {
    if (check.status === "NOT_APPLICABLE" || check.status === "PASS") continue;
    if (check.status === "PENDING" || check.status === "BLOCKED" || check.status === "FAIL") {
      await staffPage.request.patch(
        `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
        { data: { status: "IN_PROGRESS" }, headers: nocHeaders }
      );
    }
    const passBody =
      check.category === "BOOKING" || check.category === "ECOMMERCE"
        ? { status: "NOT_APPLICABLE", statusReason: "No aplica en fixture E2E" }
        : { status: "PASS" };
    await staffPage.request.patch(
      `${BACKEND}/api/noc/web-projects/${projectId}/validation/checks/${check.id}?organization_id=${organizationId}`,
      { data: passBody, headers: nocHeaders }
    );
  }
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/start-publication?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/publication/prepare?organization_id=${organizationId}`,
    { headers: nocHeaders }
  );
  await completeRequiredPublicationSteps(staffPage.request, projectId, organizationId, origin);
  const completeRes = await staffPage.request.post(
    `${BACKEND}/api/noc/web-projects/${projectId}/complete?organization_id=${organizationId}`,
    { data: { acknowledgeWarnings: true }, headers: nocHeaders }
  );
  expect(completeRes.ok(), `complete → ${completeRes.status()}`).toBeTruthy();
  await staffCtx.close();

  const nocContext = await browser.newContext();
  const nocPage = await nocContext.newPage();
  await loginViaUi(nocPage, staffEmail, PASSWORD);
  await nocPage.goto(`${origin}/noc/projects/${projectId}?organization_id=${organizationId}`);
  return {
    nocPage,
    nocContext,
    projectId,
    organizationId,
    origin,
    clientCookie,
    clientEmail,
    staffEmail
  };
}
