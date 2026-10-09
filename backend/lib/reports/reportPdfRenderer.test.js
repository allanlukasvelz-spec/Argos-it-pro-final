const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
process.env.ARGOS_REPORT_PDF_STUB = "1";

const { renderPdfFromHtml } = require("./reportPdfRenderer");

describe("reportPdfRenderer stub", () => {
  it("returns PDF stub bytes without chromium", async () => {
    const buf = await renderPdfFromHtml("<html><body>test</body></html>");
    assert.ok(buf.toString("utf8").startsWith("%PDF"));
  });
});
