const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { escapeHtml } = require("../reports/reportEscape");
const { renderIncidentSummaryHtml } = require("../reports/reportHtmlRenderer");

describe("reportEscape", () => {
  it("escapes HTML injection", () => {
    assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("reportHtmlRenderer", () => {
  it("does not include raw script tags from incident title", () => {
    const html = renderIncidentSummaryHtml({
      reportType: "INCIDENT_SUMMARY",
      reportId: "r1",
      organization: { name: "Org<script>" },
      incident: {
        id: 1,
        title: "<img onerror=alert(1)>",
        state: "OPEN",
        severity: "CRITICAL",
        openedAt: "2026-01-01T00:00:00Z",
        resolvedAt: null
      },
      affectedAsset: null,
      health: { label: "UNKNOWN" },
      timeline: [],
      verifiedEvidence: [],
      unknowns: ["test"],
      generatedAt: "2026-01-01T00:00:00Z",
      dataCutoffAt: "2026-01-01T00:00:00Z",
      templateVersion: "1.0.0"
    });
    assert.match(html, /&lt;img onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<script/i);
  });
});
