const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { escapeHtml } = require("../reports/reportEscape");
const { renderIncidentSummaryHtml } = require("../reports/reportHtmlRenderer");

describe("reportEscape", () => {
  it("escapes HTML injection", () => {
    assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("reportHtmlRenderer adversarial", () => {
  const vectors = [
    "<script>alert(1)</script>",
    '<img src="http://127.0.0.1/x" onerror=alert(1)>',
    "javascript:alert(1)",
    "file:///etc/passwd",
    "data:text/html,<script>alert(1)</script>",
    "url(http://localhost/admin)"
  ];

  for (const payload of vectors) {
    it(`neutralizes payload: ${payload.slice(0, 40)}`, () => {
      const html = renderIncidentSummaryHtml({
        reportType: "INCIDENT_SUMMARY",
        reportId: "r1",
        organization: { name: payload },
        incident: {
          id: 1,
          title: payload,
          state: "OPEN",
          severity: "CRITICAL",
          openedAt: "2026-01-01T00:00:00Z",
          resolvedAt: null
        },
        affectedAsset: null,
        health: { label: "UNKNOWN" },
        timeline: [{ at: "2026-01-01", kind: "X", summary: payload }],
        verifiedEvidence: [],
        unknowns: [payload],
        generatedAt: "2026-01-01T00:00:00Z",
        dataCutoffAt: "2026-01-01T00:00:00Z",
        templateVersion: "1.0.0"
      });
      assert.doesNotMatch(html, /<script/i);
      assert.doesNotMatch(html, /<img[^>]*onerror/i);
      assert.doesNotMatch(html, /href\s*=\s*["']javascript:/i);
      if (payload.includes("<")) {
        assert.match(html, /&lt;/);
      }
    });
  }
});
