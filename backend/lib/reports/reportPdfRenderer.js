/**
 * HTML → PDF via Playwright Chromium (worker-only).
 * Security: setContent only, all network requests aborted, no navigation.
 * Set ARGOS_REPORT_PDF_STUB=1 for unit tests without Chromium (never staging/production).
 */
const { isReportPdfStubAllowed } = require("../ops/testSurfacePolicy");

const STUB_HEADER = "%PDF-1.4\n";

async function renderPdfFromHtml(html) {
  if (isReportPdfStubAllowed()) {
    return Buffer.from(`${STUB_HEADER}% ARGOS report stub\n%%EOF\n`, "utf8");
  }
  if (process.env.ARGOS_REPORT_PDF_STUB === "1") {
    const err = new Error("ARGOS_REPORT_PDF_STUB forbidden in staging/production");
    err.code = "PDF_STUB_FORBIDDEN";
    throw err;
  }

  let chromium;
  try {
    chromium = require("playwright").chromium;
  } catch {
    try {
      chromium = require(require("path").join(
        __dirname,
        "..",
        "..",
        "..",
        "node_modules",
        "playwright"
      )).chromium;
    } catch (err) {
      const error = new Error("PDF renderer unavailable: playwright not installed");
      error.code = "RENDERER_UNAVAILABLE";
      throw error;
    }
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"]
  });

  try {
    const context = await browser.newContext();
    await context.route("**/*", (route) => route.abort("blockedbyclient"));
    const page = await context.newPage();
    await page.setContent(String(html), { waitUntil: "domcontentloaded", timeout: 30000 });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
    });
    await context.close();
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

module.exports = { renderPdfFromHtml };
