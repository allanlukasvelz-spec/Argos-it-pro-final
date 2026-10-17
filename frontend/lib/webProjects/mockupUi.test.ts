import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mockupSectionLabel,
  mockupStatusLabel,
  mockupValidationLabel,
  mockupVariantLabel
} from "./labels.ts";
import { nocGenericTransitionTargets, nextWorkflowStatuses } from "./nocWorkflow.ts";
import {
  effectivePreviewItem,
  isDetailTemplatePage,
  listCompatiblePreviewItems
} from "./mockupPreview.ts";
import type { WebProjectMockupPage } from "./types.ts";

describe("phase 14 mockup UI", () => {
  it("mockup status uses human labels", () => {
    assert.equal(mockupStatusLabel("DRAFT"), "Borrador");
    assert.equal(mockupStatusLabel("CLIENT_REVIEW"), "Revisión cliente");
    assert.equal(mockupStatusLabel("APPROVED"), "Aprobada");
    assert.doesNotMatch(mockupStatusLabel("INTERNAL_REVIEW"), /INTERNAL_REVIEW/);
  });

  it("validation and section labels are staff-facing", () => {
    assert.equal(mockupValidationLabel("INVALID"), "Necesita correcciones");
    assert.equal(mockupValidationLabel("READY"), "Lista");
    assert.equal(mockupSectionLabel("HERO"), "Hero");
    assert.equal(mockupSectionLabel("CONTACT_FORM"), "Formulario de contacto");
    assert.equal(mockupVariantLabel("CENTERED"), "Centrado");
  });

  it("MOCKUP generic buttons omit DEVELOPMENT", () => {
    assert.deepEqual(nextWorkflowStatuses("MOCKUP"), ["ARCHITECTURE", "DEVELOPMENT"]);
    assert.deepEqual(nocGenericTransitionTargets("MOCKUP"), ["ARCHITECTURE"]);
  });

  it("detail template pages expose compatible preview options only", () => {
    const detailPage = {
      id: 1,
      mockupId: 1,
      architecturePageId: 1,
      title: "Detalle",
      route: "/servicios/[slug]",
      pageType: "SERVICE_DETAIL",
      templateType: "DETAIL",
      status: "DRAFT",
      visualNotes: null,
      responsiveSettings: {},
      sortOrder: 1,
      archivedAt: null
    } satisfies WebProjectMockupPage;
    const indexPage = { ...detailPage, id: 2, pageType: "SERVICE_INDEX", templateType: "INDEX" };

    assert.equal(isDetailTemplatePage(detailPage), true);
    assert.equal(isDetailTemplatePage(indexPage), false);
    assert.deepEqual(
      listCompatiblePreviewItems(
        [
          { id: 10, itemType: "service", title: "Demo Service" },
          { id: 11, itemType: "tour", title: "Demo Activity" }
        ],
        detailPage
      ).map((item) => item.title),
      ["Demo Service"]
    );
    assert.equal(
      effectivePreviewItem(detailPage, { id: 11, itemType: "tour", title: "Demo Activity" }),
      null
    );
    assert.equal(
      effectivePreviewItem(detailPage, { id: 10, itemType: "service", title: "Demo Service" })?.title,
      "Demo Service"
    );
    assert.deepEqual(listCompatiblePreviewItems([], detailPage), []);
  });
});
