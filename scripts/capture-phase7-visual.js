/**
 * Phase 7 visual capture — Playwright local screenshots.
 * Creates a fresh TEST user/org; does not print secrets.
 */
const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const BACKEND = "http://127.0.0.1:4000";
const FRONTEND = "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "../docs/architecture/phase7-validation-artifacts");
const PASSWORD = "Phase7Visual2026!x";

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const email = `phase7-visual-${Date.now()}@example.test`;

  // Register client
  const reg = await fetch(`${BACKEND}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: FRONTEND },
    body: JSON.stringify({
      email,
      password: PASSWORD,
      name: "Phase7 Visual",
      company: "ORG-PHASE7-TEST"
    })
  });
  if (reg.status !== 201 && reg.status !== 200) {
    throw new Error(`register failed ${reg.status}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(`${FRONTEND}/auth/login`);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"),
    page.getByRole("button", { name: /Iniciar sesion/i }).click()
  ]);
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(OUT, "chico-dashboard-unknown.png"),
    fullPage: false
  });

  for (const route of ["seguridad", "alertas", "incidentes", "monitorizacion"]) {
    await page.goto(`${FRONTEND}/dashboard/${route}`);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUT, `chico-${route}.png`),
      fullPage: false
    });
  }

  // Admin NOC — promote via note: use separate admin session if cookies allow.
  // Visual NOC requires admin role — skip if only client; document limitation.
  await browser.close();
  fs.writeFileSync(
    path.join(OUT, "visual-capture-meta.json"),
    JSON.stringify(
      {
        captured: [
          "chico-dashboard-unknown.png",
          "chico-seguridad.png",
          "chico-alertas.png",
          "chico-incidentes.png",
          "chico-monitorizacion.png"
        ],
        note: "Client CHICO UNKNOWN screenshots (no monitors). NOC admin UI captured separately if admin session available.",
        at: new Date().toISOString()
      },
      null,
      2
    )
  );
  console.log("VISUAL_CAPTURE_OK");
}

main().catch((e) => {
  console.error("VISUAL_CAPTURE_FAIL", e.message);
  process.exit(1);
});
