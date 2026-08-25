/**
 * Capture NOC Agents UI for Phase 7 validation (admin TEST user).
 */
const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const { Client } = require("../backend/node_modules/pg");
const bcrypt = require("../backend/node_modules/bcrypt");
require("../backend/node_modules/dotenv").config({
  path: path.join(__dirname, "../backend/.env")
});

const BACKEND = "http://127.0.0.1:4000";
const FRONTEND = "http://127.0.0.1:3000";
const OUT = path.join(__dirname, "../docs/architecture/phase7-validation-artifacts");
const PASSWORD = "Phase7NocVisual2026!x";

async function main() {
  const u = process.env.DATABASE_URL || "";
  if (!/127\.0\.0\.1|localhost/.test(u)) throw new Error("non-local db");
  const email = `phase7-noc-visual-${Date.now()}@example.test`;
  const hash = await bcrypt.hash(PASSWORD, 10);
  const pg = new Client({ connectionString: u });
  await pg.connect();
  await pg.query(
    `INSERT INTO users (email, password, name, company, role, client_verified)
     VALUES ($1,$2,'Phase7 NOC','ORG-PHASE7-TEST','admin',true)`,
    [email, hash]
  );
  await pg.end();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(`${FRONTEND}/auth/login`);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login")),
    page.getByRole("button", { name: /Iniciar sesion/i }).click()
  ]);
  await page.waitForTimeout(1000);
  await page.goto(`${FRONTEND}/noc/agents`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, "noc-agents.png"), fullPage: false });
  // Enrollment form visible
  const hasEnroll = await page.getByText(/Crear enrollment/i).count();
  await browser.close();
  fs.writeFileSync(
    path.join(OUT, "noc-visual-meta.json"),
    JSON.stringify({ enrollFormVisible: hasEnroll > 0, at: new Date().toISOString() }, null, 2)
  );
  console.log("NOC_VISUAL_OK", hasEnroll > 0);
}

main().catch((e) => {
  console.error("NOC_VISUAL_FAIL", e.message);
  process.exit(1);
});
