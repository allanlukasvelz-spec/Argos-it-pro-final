import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { webProjectErrorMessage, webProjectPageErrorTitle } from "./errors.ts";
import {
  nextWorkflowStatuses,
  nocArchiveActionVisible,
  nocGenericTransitionTargets,
  nocProjectHref,
  nocProjectsHref,
  nocQueueMixesOrgs,
  nocTransitionLabel,
  parseNocOrganizationId
} from "./nocWorkflow.ts";
import { reviewStatusLabel } from "./labels.ts";
import { matchesNocReviewFilter, nocReviewMutationLocked } from "./viewModel.ts";

describe("NOC web projects UI", () => {
  it("1 queue requires a positive organization_id", () => {
    assert.equal(parseNocOrganizationId(""), null);
    assert.equal(parseNocOrganizationId("0"), null);
    assert.equal(parseNocOrganizationId("-3"), null);
    assert.equal(parseNocOrganizationId("198"), 198);
  });

  it("2 missing org id keeps the list URL without a fake tenant", () => {
    assert.equal(nocProjectsHref(null), "/noc/projects");
  });

  it("3 queue and detail URLs always carry organization_id when known", () => {
    assert.equal(nocProjectsHref(198), "/noc/projects?organization_id=198");
    assert.equal(nocProjectHref(1, 198), "/noc/projects/1?organization_id=198");
  });

  it("4 INTAKE can only go to REVIEW", () => {
    assert.deepEqual(nextWorkflowStatuses("INTAKE"), ["REVIEW"]);
  });

  it("4b REVIEW generic buttons omit ARCHITECTURE", () => {
    assert.deepEqual(nocGenericTransitionTargets("REVIEW"), ["INTAKE"]);
  });

  it("4c ARCHITECTURE generic buttons omit MOCKUP", () => {
    assert.deepEqual(nocGenericTransitionTargets("ARCHITECTURE"), ["REVIEW"]);
  });

  it("4d MOCKUP generic buttons omit DEVELOPMENT", () => {
    assert.deepEqual(nocGenericTransitionTargets("MOCKUP"), ["ARCHITECTURE"]);
  });

  it("5 COMPLETED has no transitions", () => {
    assert.deepEqual(nextWorkflowStatuses("COMPLETED"), []);
  });

  it("6 archived project hides transitions", () => {
    assert.deepEqual(nextWorkflowStatuses("REVIEW", "2026-01-01T00:00:00.000Z"), []);
  });

  it("6b archive action only on COMPLETED non-archived", () => {
    assert.equal(nocArchiveActionVisible({ workflowStatus: "COMPLETED", archivedAt: null }), true);
    assert.equal(nocArchiveActionVisible({ workflowStatus: "REVIEW", archivedAt: null }), false);
    assert.equal(
      nocArchiveActionVisible({ workflowStatus: "COMPLETED", archivedAt: "2026-01-01T00:00:00.000Z" }),
      false
    );
  });

  it("7 queue must not mix organizations", () => {
    assert.equal(nocQueueMixesOrgs([198, 198]), false);
    assert.equal(nocQueueMixesOrgs([198, 12]), true);
  });

  it("8 TENANT_REQUIRED is humanized", () => {
    const err = {
      isAxiosError: true,
      response: { status: 400, data: { code: "TENANT_REQUIRED", error: "organization_id requerido" } }
    };
    assert.match(webProjectErrorMessage(err), /organización/);
  });

  it("9 invalid transition does not look like archived", () => {
    const err = {
      isAxiosError: true,
      response: { status: 409, data: { code: "INVALID_TRANSITION", error: "Transición no permitida" } }
    };
    assert.match(webProjectErrorMessage(err), /transición/i);
    assert.doesNotMatch(webProjectErrorMessage(err), /archivado/);
  });

  it("10 404 stays tenant-safe", () => {
    const err = { isAxiosError: true, response: { status: 404, data: { code: "NOT_FOUND" } } };
    assert.match(webProjectPageErrorTitle(err), /no existe/);
  });

  it("p6-11 approve field stays a NOC-only mutation helper", () => {
    assert.equal(nocReviewMutationLocked({ archivedAt: null, workflowStatus: "REVIEW" }), false);
  });

  it("p6-12 correction requires a reason code", () => {
    const err = {
      isAxiosError: true,
      response: { status: 400, data: { code: "CORRECTION_MESSAGE_REQUIRED", error: "motivo" } }
    };
    assert.match(webProjectErrorMessage(err), /corregir/);
  });

  it("p6-13 review state is shown with client-facing labels", () => {
    assert.equal(reviewStatusLabel("CORRECTION_REQUIRED"), "Necesita corrección");
    assert.doesNotMatch(reviewStatusLabel("CORRECTION_REQUIRED"), /CORRECTION_REQUIRED/);
  });

  it("p6-14 approve item uses the same lock as field reviews", () => {
    assert.equal(nocReviewMutationLocked({ archivedAt: null, workflowStatus: "INTAKE" }), false);
  });

  it("p6-15 correct item filter matches correction required", () => {
    assert.equal(matchesNocReviewFilter({ status: "CORRECTION_REQUIRED" }, "CORRECTION_REQUIRED"), true);
    assert.equal(matchesNocReviewFilter({ status: "APPROVED" }, "CORRECTION_REQUIRED"), false);
  });

  it("p6-16 approve document filter matches approved", () => {
    assert.equal(matchesNocReviewFilter({ status: "APPROVED" }, "APPROVED"), true);
  });

  it("p6-17 request replacement stays available unless locked", () => {
    assert.equal(nocReviewMutationLocked({ archivedAt: null, workflowStatus: "REVIEW" }), false);
  });

  it("p6-18 filter review states includes all", () => {
    assert.equal(matchesNocReviewFilter({ status: "PENDING" }, "ALL"), true);
    assert.equal(matchesNocReviewFilter({ status: "PENDING" }, "PENDING"), true);
  });

  it("p6-19 wrong org remains tenant-safe 404 copy", () => {
    const err = { isAxiosError: true, response: { status: 404, data: { code: "NOT_FOUND" } } };
    assert.match(webProjectPageErrorTitle(err), /no existe/);
  });

  it("p6-20 completed blocks review mutation", () => {
    assert.equal(nocReviewMutationLocked({ archivedAt: null, workflowStatus: "COMPLETED" }), true);
    assert.equal(nocTransitionLabel("PUBLICATION", "DEVELOPMENT"), "Reabrir para correcciones");
    assert.notEqual(nocTransitionLabel("PUBLICATION", "DEVELOPMENT"), "→ Desarrollo");
  });
});
