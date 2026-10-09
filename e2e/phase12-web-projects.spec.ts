import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { resetAuthRateLimits } from "./helpers/resetRateLimits";
import { BACKEND, e2eAuthHeaders } from "./helpers/e2eEnv";
import { gotoE2e } from "./helpers/e2eNav";
import { dismissCookieBanner, loginViaUi } from "./helpers/loginUi";
import { promoteEmailToAdmin } from "./helpers/promoteNocAdmin";

const PASSWORD = "E2eSecure2026!x";
const SHOT_DIR = path.join(process.cwd(), "artifacts/phase12-web-projects");

test.beforeEach(async () => {
  await resetAuthRateLimits();
  mkdirSync(SHOT_DIR, { recursive: true });
});

function uniqueEmail(): string {
  return `argos-e2e-p12-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

const MIN_RESPONSES = [
  { fieldKey: "company_trade_name", value: "Demo Activities" },
  { fieldKey: "company_city", value: "Valencia" },
  { fieldKey: "company_country", value: "España" },
  { fieldKey: "company_phone", value: "+34 600 000 000" },
  { fieldKey: "company_email", value: "hola@demo-activities.test" },
  { fieldKey: "company_contact_name", value: "Ana Pérez" },
  { fieldKey: "company_entity_type", value: "company" },
  { fieldKey: "company_multiple_locations", value: "no" },
  { fieldKey: "has_existing_site", value: "no" },
  { fieldKey: "brand_has_logo", value: "no" },
  { fieldKey: "brand_has_manual", value: "no" },
  { fieldKey: "about_who", value: "Equipo de actividades de ejemplo" },
  { fieldKey: "about_what_you_do", value: "Diseñamos y operamos actividades de equipo" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Una web clara para reservar actividades" },
  { fieldKey: "goals_b2b_b2c", value: "b2c" },
  { fieldKey: "goals_priority", value: "normal" },
  { fieldKey: "offer_kinds", value: ["services", "experiences"] },
  { fieldKey: "content_has_texts", value: "no" },
  { fieldKey: "content_needs_copy", value: "yes" },
  { fieldKey: "media_has_photos", value: "no" },
  { fieldKey: "media_has_videos", value: "no" },
  { fieldKey: "media_needs_production", value: "yes" },
  { fieldKey: "media_commercial_rights", value: "pending" },
  { fieldKey: "primary_language", value: "es" },
  { fieldKey: "languages_multilingual", value: "no" },
  { fieldKey: "sales_mode", value: "contact_forms" },
  { fieldKey: "access_ack_no_secrets", value: "yes" },
  { fieldKey: "confirm_reviewed", value: "yes" },
  { fieldKey: "confirm_use_material", value: "yes" },
  { fieldKey: "confirm_authorization", value: "yes" }
];

async function registerViaAPI(request: APIRequestContext, email: string, name = "ARGOS Staff") {
  const res = await request.post(`${BACKEND}/api/auth/register`, {
    data: { email, password: PASSWORD, name, company: "ARGOS" },
    headers: e2eAuthHeaders()
  });
  expect(res.status()).toBe(201);
}

async function saveField(page: Page, key: string, value: string) {
  const root = page.locator(`#wp-field-${key}`);
  const control = root.locator("textarea, input:not([type=radio]):not([type=checkbox]), select").first();
  await control.fill(value);
  await root.getByRole("button", { name: "Guardar" }).click();
  await expect(root.getByText("Guardado")).toBeVisible({ timeout: 15000 });
}

async function addNocBriefNote(page: Page, type: string, content: string) {
  const form = page.locator("#noc-brief-notes form");
  await form.locator("select").first().selectOption(type);
  if (type === "RISK") {
    await expect(form.getByText("Severidad")).toBeVisible();
  }
  if (type === "DECISION_REQUIRED") {
    await expect(form.getByText("Bloquea arquitectura")).toBeVisible();
    await form.getByRole("checkbox").check();
  }
  const contentBox = page.locator("#noc-brief-note-content");
  await contentBox.click();
  await contentBox.fill(content);
  await expect(contentBox).toHaveValue(content);

  const noteCreated = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      /\/api\/noc\/web-projects\/\d+\/brief\/notes/.test(r.url()) &&
      r.status() === 201,
    { timeout: 15000 }
  );
  const briefReloaded = page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      /\/api\/noc\/web-projects\/\d+\/brief\?/.test(r.url()) &&
      r.status() === 200,
    { timeout: 15000 }
  );
  await page.locator("#noc-brief-note-submit").click();
  const postRes = await noteCreated;
  await briefReloaded;
  const { note } = (await postRes.json()) as { note: { id: number } };
  await expect(page.locator(`#noc-note-${note.id}`)).toContainText(content, { timeout: 15000 });
}

test.describe("PHASE 12 project brief + architecture handoff", () => {
  test.describe.configure({ timeout: 240000 });

  test("Home order frozen 01 project / 07 reality", async ({ page }) => {
    await gotoE2e(page, "/");
    await dismissCookieBanner(page);
    const indexes = page.locator(".argos-corp-section-index");
    await expect(indexes.nth(0)).toHaveText(/01 \/ Proyecto web|01 \/ Projecte web|01 \/ Web project/i);
    await expect(page.getByRole("link", { name: "Comenzar mi proyecto" })).toBeVisible();
    const texts = (await indexes.allTextContents()).map((text) => text.replace(/\s+/g, " ").trim());
    expect(texts.some((text) => /^07 \/ (Realidad del cliente|Realitat del client|Client reality)/.test(text))).toBeTruthy();
  });

  test("FLOW A-E brief, blockers, notes and architecture start", async ({ page, request, browser }) => {
    const email = uniqueEmail();
    const staffEmail = uniqueEmail();
    await gotoE2e(page, "/proyecto-web/comenzar");
    await dismissCookieBanner(page);
    await page.getByRole("radio", { name: /Crear una web nueva/i }).check();
    await page.getByLabel("Nombre").fill("Demo Client");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(/\/dashboard\/proyectos\/\d+/, { timeout: 30000 });

    const origin = new URL(page.url()).origin;
    const id = Number(page.url().match(/proyectos\/(\d+)/)?.[1]);
    const formRes = await page.request.post(`${BACKEND}/api/client/web-projects/${id}/form`, {
      data: { responses: MIN_RESPONSES },
      headers: { Origin: origin, "Content-Type": "application/json" }
    });
    expect(formRes.ok()).toBeTruthy();

    await page.request.post(`${BACKEND}/api/client/web-projects/${id}/items`, {
      data: {
        itemType: "service",
        title: "Consultoría de marca",
        payload: { audience: "Equipos", cta: "Pedir propuesta", summary: "Acompañamos el posicionamiento." }
      },
      headers: { Origin: origin, "Content-Type": "application/json" }
    });
    await page.request.post(`${BACKEND}/api/client/web-projects/${id}/items`, {
      data: {
        itemType: "tour",
        title: "Ruta costera",
        payload: {
          destination: "Costa",
          price_adult: "45",
          availability: "fines de semana",
          meeting_point: "Puerto",
          cancellation: "24 h"
        }
      },
      headers: { Origin: origin, "Content-Type": "application/json" }
    });
    await page.request.post(`${BACKEND}/api/client/web-projects/${id}/items`, {
      data: {
        itemType: "page",
        title: "Inicio",
        payload: { purpose: "Presentar el estudio.", cta: "Contactar", is_new: "yes" }
      },
      headers: { Origin: origin, "Content-Type": "application/json" }
    });

    const submit = await page.request.post(`${BACKEND}/api/client/web-projects/${id}/submit-review`, {
      headers: { Origin: origin, "Content-Type": "application/json" }
    });
    expect(submit.ok()).toBeTruthy();

    const projectRes = await page.request.get(`${BACKEND}/api/client/web-projects/${id}`, {
      headers: { Origin: origin }
    });
    const projectJson = await projectRes.json();
    const organizationId = Number(projectJson.project?.organizationId || projectJson.organizationId);

    await registerViaAPI(request, staffEmail);
    promoteEmailToAdmin(staffEmail);
    const nocPage = await browser.newPage();
    await loginViaUi(nocPage, staffEmail, PASSWORD);
    await nocPage.goto(`/noc/projects/${id}?organization_id=${organizationId}`);
    await expect(nocPage.locator("#noc-brief")).toBeVisible({ timeout: 20000 });
    await expect(nocPage.locator("#noc-brief").getByRole("heading", { name: "Brief del proyecto" })).toBeVisible();
    await expect(nocPage.getByText(/Resumen ejecutivo/i)).toBeVisible();
    await expect(nocPage.getByText(/Inventario de contenido/i)).toBeVisible();
    await expect(nocPage.getByText(/Demo Activities/)).toBeVisible();

    const nocOrigin = new URL(nocPage.url()).origin;
    const briefOk = await nocPage.request.get(
      `${BACKEND}/api/noc/web-projects/${id}/brief?organization_id=${organizationId}`,
      { headers: { Origin: nocOrigin } }
    );
    expect(briefOk.status()).toBe(200);
    const clientNoc = await page.request.get(
      `${BACKEND}/api/noc/web-projects/${id}/brief?organization_id=${organizationId}`,
      { headers: { Origin: origin } }
    );
    expect(clientNoc.status()).toBe(403);
    const wrongOrg = await nocPage.request.get(
      `${BACKEND}/api/noc/web-projects/${id}/brief?organization_id=999999`,
      { headers: { Origin: nocOrigin } }
    );
    expect(wrongOrg.status()).toBe(404);
    const clientBrief = await page.request.get(`${BACKEND}/api/client/web-projects/${id}/brief`, {
      headers: { Origin: origin }
    });
    expect([404, 400]).toContain(clientBrief.status());

    await nocPage.locator("#noc-brief").screenshot({ path: path.join(SHOT_DIR, "01-noc-brief-overview.png") });
    await nocPage.locator('[data-section="scope"]').screenshot({ path: path.join(SHOT_DIR, "04-noc-brief-scope.png") });
    await nocPage
      .locator('[data-section="inventory"]')
      .screenshot({ path: path.join(SHOT_DIR, "05-noc-brief-content-inventory.png") });
    await nocPage.locator('[data-section="pages"]').screenshot({ path: path.join(SHOT_DIR, "06-noc-brief-pages.png") });

    const fieldRow = nocPage.locator("li").filter({ hasText: "company_trade_name" });
    await fieldRow.getByLabel("Motivo de corrección").fill("Usa el nombre comercial público.");
    await fieldRow.getByRole("button", { name: "Solicitar corrección" }).click();
    await nocPage.reload();
    await expect(nocPage.locator("#noc-brief .noc-brief__ready--not_ready")).toBeVisible({
      timeout: 20000
    });
    await expect(nocPage.getByRole("button", { name: "Preparar arquitectura" })).toBeDisabled();
    const blockedStart = await nocPage.request.post(
      `${BACKEND}/api/noc/web-projects/${id}/start-architecture?organization_id=${organizationId}`,
      { data: {}, headers: { Origin: nocOrigin, "Content-Type": "application/json" } }
    );
    expect(blockedStart.status()).toBe(409);
    const blockedJson = await blockedStart.json();
    expect(blockedJson.code).toBe("ARCHITECTURE_NOT_READY");
    await nocPage.locator("#noc-brief").screenshot({ path: path.join(SHOT_DIR, "02-noc-brief-not-ready.png") });
    await nocPage.locator("#noc-brief-open").screenshot({ path: path.join(SHOT_DIR, "03-noc-brief-open-items.png") });

    await page.reload();
    await saveField(page, "company_trade_name", "Demo Activities Public");

    await nocPage.reload();
    await expect(nocPage.locator("#noc-brief .noc-brief__ready--not_ready")).toHaveCount(0);
    await expect(nocPage.getByText(/Listo para arquitectura|Listo con avisos/)).toBeVisible();
    await nocPage.locator("#noc-brief").screenshot({ path: path.join(SHOT_DIR, "08-noc-brief-ready.png") });

    await addNocBriefNote(nocPage, "ASSUMPTION", "El cliente entregará las traducciones.");
    await addNocBriefNote(nocPage, "RISK", "Dependencia de un calendario externo.");
    await addNocBriefNote(nocPage, "DECISION_REQUIRED", "Motor de reservas pendiente de decidir.");
    await expect(nocPage.locator("#noc-brief .noc-brief__ready--not_ready")).toBeVisible();
    await nocPage.locator("#noc-brief-notes").screenshot({ path: path.join(SHOT_DIR, "07-noc-brief-notes-decisions.png") });
    await nocPage
      .locator("#noc-brief-notes li")
      .filter({ hasText: "Motor de reservas pendiente de decidir." })
      .getByRole("button", { name: "Resolver" })
      .click();
    await expect(nocPage.getByText(/Listo para arquitectura|Listo con avisos/)).toBeVisible();

    await nocPage.getByRole("button", { name: "Preparar arquitectura" }).click();
    await expect(nocPage.getByRole("dialog")).toBeVisible();
    const reason = nocPage.getByRole("dialog").locator("textarea");
    if (await reason.count()) {
      await reason.fill("Avisos residuales aceptados para arrancar el mapa.");
    }
    await nocPage.locator("#noc-brief").screenshot({ path: path.join(SHOT_DIR, "09-start-architecture-confirmation.png") });
    await nocPage.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
    await expect(nocPage.locator(".noc-brief__header")).toContainText("Arquitectura");
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "10-project-architecture-state.png"), fullPage: true });

    for (const width of [1440, 1024, 768, 390] as const) {
      await nocPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const overflow = await nocPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `overflow at ${width}`).toBeFalsy();
    }
    await nocPage.setViewportSize({ width: 390, height: 844 });
    await nocPage.locator("#noc-brief").screenshot({ path: path.join(SHOT_DIR, "11-noc-brief-390.png") });
    await nocPage.setViewportSize({ width: 1440, height: 900 });
    await nocPage.emulateMedia({ media: "print" });
    await nocPage.screenshot({ path: path.join(SHOT_DIR, "12-noc-brief-print.png"), fullPage: true });
    await nocPage.close();
  });
});
