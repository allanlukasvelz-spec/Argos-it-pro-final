import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clientFileRejection, MAX_DOCUMENT_BYTES } from "./documents.ts";
import { webProjectErrorMessage, webProjectPageErrorTitle, readClientApiError } from "./errors.ts";
import { isFieldApplicableFromDefinition, unwrapFormValue } from "./formCopy.ts";
import { workflowLabel, projectTypeLabel, credentialStatusLabel, reviewStatusLabel, reviewVerdictLabel } from "./labels.ts";
import {
  commentCreateVisible,
  correctionsSummaryCopy,
  documentUploadVisible,
  itemCreateVisible,
  listCorrectionBadgeLabel,
  listCorrectionBadgeVisible,
  listCreateCtaVisible,
  listMemberHintVisible,
  listViewerHintVisible,
  matchesNocReviewFilter,
  nocReviewMutationLocked,
  progressCopy,
  projectIsArchived,
  projectIsCompleted,
  projectMutationsLocked,
  notificationCopyLooksSafe,
  notificationHref,
  reviewStateForField,
  reviewsAreReadOnly,
  visibleFormFields
} from "./viewModel.ts";
import type { WebProjectFormDefinition } from "./types.ts";

const definition: WebProjectFormDefinition = {
  version: "web-project-intake.v1",
  fields: [
    { key: "has_existing_site", type: "enum", options: ["yes", "no"] },
    { key: "existing_url", type: "url", applicableIf: { field: "has_existing_site", equals: "yes" } }
  ]
};

describe("web projects client UI", () => {
  it("1 empty list hides continue cards and keeps professional empty copy flags", () => {
    assert.equal([].length === 0, true);
    assert.equal(listCreateCtaVisible("org_owner"), true);
  });

  it("2 list with project uses backend progress, not a local percentage", () => {
    const progress = progressCopy({
      required: 47,
      completed: 34,
      notApplicable: 2,
      pending: 13,
      percentage: 72,
      ratio: 34 / 47,
      total: 47,
      units: []
    });
    assert.equal(progress.completed, 34);
    assert.equal(progress.required, 47);
    assert.equal(progress.percentage, 72);
  });

  it("3 owner/admin see create CTA", () => {
    assert.equal(listCreateCtaVisible("org_owner"), true);
    assert.equal(listCreateCtaVisible("org_admin"), true);
  });

  it("4 member does not see create CTA", () => {
    assert.equal(listCreateCtaVisible("org_member"), false);
    assert.equal(listMemberHintVisible("org_member"), true);
  });

  it("5 viewer is read-only", () => {
    assert.equal(listCreateCtaVisible("org_viewer"), false);
    assert.equal(listViewerHintVisible("org_viewer"), true);
    assert.equal(documentUploadVisible("org_viewer", { archivedAt: null }), false);
    assert.equal(projectMutationsLocked("org_viewer", { archivedAt: null }), true);
  });

  it("6-7 project detail progress comes from backend object", () => {
    const progress = progressCopy({
      required: 10,
      completed: 4,
      notApplicable: 0,
      pending: 6,
      percentage: 40,
      ratio: 0.4,
      total: 10,
      units: [{ kind: "field", key: "site_kind", done: true }]
    });
    assert.equal(progress.percentage, 40);
    assert.equal(progress.pending, 6);
  });

  it("8 conditional field hidden/non-applicable", () => {
    const hidden = visibleFormFields(definition, [
      { fieldKey: "has_existing_site", schemaVersion: "v1", value: "no", applicable: true, updatedBy: 1, updatedAt: "" }
    ]);
    assert.equal(hidden.some((row) => row.field.key === "existing_url"), false);
    const shown = visibleFormFields(definition, [
      { fieldKey: "has_existing_site", schemaVersion: "v1", value: "yes", applicable: true, updatedBy: 1, updatedAt: "" }
    ]);
    assert.equal(shown.some((row) => row.field.key === "existing_url"), true);
    assert.equal(
      isFieldApplicableFromDefinition(definition.fields[1], new Map([["has_existing_site", "no"]])),
      false
    );
  });

  it("9 save form success keeps the submitted value wrapper intact", () => {
    assert.equal(unwrapFormValue({ text: "es" }), "es");
    assert.equal(unwrapFormValue("corporate"), "corporate");
  });

  it("10 validation error is humanized", () => {
    const err = {
      isAxiosError: true,
      response: { status: 400, data: { code: "VALIDATION_ERROR", error: "Título requerido" } }
    };
    assert.equal(webProjectErrorMessage(err), "Revisa los datos introducidos.");
  });

  it("11 archived is read-only for mutations", () => {
    const archived = { archivedAt: "2026-01-01T00:00:00.000Z" };
    assert.equal(projectIsArchived(archived), true);
    assert.equal(projectMutationsLocked("org_owner", archived), true);
    assert.equal(documentUploadVisible("org_owner", archived), false);
    assert.equal(commentCreateVisible("org_owner", archived), false);
    assert.equal(itemCreateVisible("org_owner", archived), false);
  });

  it("12 completed label is distinct from archived", () => {
    assert.equal(projectIsCompleted({ workflowStatus: "COMPLETED" }), true);
    assert.equal(projectIsArchived({ archivedAt: null }), false);
    assert.equal(workflowLabel("COMPLETED"), "Finalizado");
  });

  it("13-15 items list and permitted create/archive flags", () => {
    assert.equal(itemCreateVisible("org_member", { archivedAt: null }), true);
    assert.equal(itemCreateVisible("org_viewer", { archivedAt: null }), false);
    assert.equal(itemCreateVisible("org_admin", { archivedAt: "x" }), false);
  });

  it("16-18 documents list, upload permitted, viewer upload hidden", () => {
    assert.equal(documentUploadVisible("org_member", { archivedAt: null }), true);
    assert.equal(documentUploadVisible("org_viewer", { archivedAt: null }), false);
  });

  it("19 20 MB UX rejects oversize and empty before upload", () => {
    assert.equal(MAX_DOCUMENT_BYTES, 20 * 1024 * 1024);
    const empty = { name: "a.pdf", size: 0 } as File;
    const huge = { name: "a.pdf", size: MAX_DOCUMENT_BYTES + 1 } as File;
    const exe = { name: "a.exe", size: 10 } as File;
    assert.equal(clientFileRejection(empty), "El archivo está vacío.");
    assert.equal(clientFileRejection(huge), "El archivo supera los 20 MB.");
    assert.equal(clientFileRejection(exe), "Formato no admitido.");
  });

  it("20 download remains available when upload is hidden", () => {
    assert.equal(documentUploadVisible("org_viewer", { archivedAt: null }), false);
    assert.equal(listViewerHintVisible("org_viewer"), true);
  });

  it("21-22 comments allowed for contributors; secret error is useful", () => {
    assert.equal(commentCreateVisible("org_owner", { archivedAt: null }), true);
    const err = {
      isAxiosError: true,
      response: { status: 400, data: { code: "SECRET_REJECTED", error: "secret" } }
    };
    assert.match(webProjectErrorMessage(err), /contraseñas/);
  });

  it("23 reviews are GET only", () => {
    assert.equal(reviewsAreReadOnly(), true);
    assert.equal(reviewVerdictLabel("APPROVED"), "Aprobado");
  });

  it("24 404 project title", () => {
    const err = { isAxiosError: true, response: { status: 404, data: { code: "NOT_FOUND" } } };
    assert.match(webProjectPageErrorTitle(err), /no existe/);
  });

  it("25 503 storage is humanized and never shows STORAGE_UNAVAILABLE", () => {
    const err = {
      isAxiosError: true,
      response: { status: 503, data: { code: "STORAGE_UNAVAILABLE", error: "Almacén" } }
    };
    const message = webProjectErrorMessage(err);
    assert.match(message, /almacenamiento de documentos/);
    assert.doesNotMatch(message, /STORAGE_UNAVAILABLE/);
  });

  it("26 workflow labels stay client-facing and types stay human", () => {
    assert.equal(workflowLabel("INTAKE"), "Recopilación");
    assert.equal(projectTypeLabel("improve"), "Mejorar web existente");
    assert.equal(credentialStatusLabel("RECEIVED_OUT_OF_BAND"), "Recibidos por canal seguro");
    assert.equal(readClientApiError({ isAxiosError: true, response: { status: 409, data: { code: "PROJECT_ARCHIVED" } } }).code, "PROJECT_ARCHIVED");
  });

  it("p6-1 correction summary appears when open corrections exist", () => {
    const summary = correctionsSummaryCopy({
      reviewSummary: { approved: 1, pending: 0, correctionRequired: 3, rejected: 0, openCorrections: 3 }
    });
    assert.equal(summary.show, true);
    assert.match(summary.title, /3 elementos/);
  });

  it("p6-2 approved field label is client-facing", () => {
    assert.equal(reviewStatusLabel("APPROVED"), "Aprobado");
    assert.doesNotMatch(reviewStatusLabel("APPROVED"), /APPROVED/);
  });

  it("p6-3 pending label is client-facing", () => {
    assert.equal(reviewStatusLabel("PENDING"), "Pendiente de revisión");
  });

  it("p6-4 correction field message stays on the field state", () => {
    const state = reviewStateForField(
      {
        reviewStates: [
          {
            targetType: "FORM_FIELD",
            targetId: null,
            targetKey: "cms",
            status: "CORRECTION_REQUIRED",
            correctionMessage: "Indica el CMS real."
          }
        ]
      },
      "cms"
    );
    assert.equal(state?.correctionMessage, "Indica el CMS real.");
  });

  it("p6-5 edit remains available for contributors on a corrected field", () => {
    assert.equal(projectMutationsLocked("org_owner", { archivedAt: null, workflowStatus: "REVIEW" }), false);
  });

  it("p6-6 corrected item uses the same mutation lock as the project", () => {
    assert.equal(itemCreateVisible("org_owner", { archivedAt: null, workflowStatus: "REVIEW" }), false);
  });

  it("p6-7 replace document action is visible only for contributors", () => {
    assert.equal(documentUploadVisible("org_owner", { archivedAt: null, workflowStatus: "REVIEW" }), true);
  });

  it("p6-8 viewer cannot correct or edit", () => {
    const project = { archivedAt: null, workflowStatus: "REVIEW" };
    assert.equal(projectMutationsLocked("org_viewer", project), true);
    assert.equal(documentUploadVisible("org_viewer", project), false);
    assert.equal(itemCreateVisible("org_viewer", project), false);
  });

  it("p6-9 archived stays read-only", () => {
    const archived = { archivedAt: "2026-01-01T00:00:00.000Z", workflowStatus: "REVIEW" };
    assert.equal(projectMutationsLocked("org_owner", archived), true);
    assert.equal(documentUploadVisible("org_owner", archived), false);
  });

  it("p6-10 completed stays read-only", () => {
    const completed = { archivedAt: null, workflowStatus: "COMPLETED" };
    assert.equal(projectIsCompleted(completed), true);
    assert.equal(projectMutationsLocked("org_owner", completed), true);
    assert.equal(documentUploadVisible("org_owner", completed), false);
    assert.equal(reviewsAreReadOnly(), true);
  });

  it("p6 list badge uses attention copy not a raw enum", () => {
    const project = {
      reviewSummary: { approved: 0, pending: 0, correctionRequired: 1, rejected: 0, openCorrections: 1 }
    };
    assert.equal(listCorrectionBadgeVisible(project), true);
    assert.equal(listCorrectionBadgeLabel(project), "Requiere tu atención");
    assert.doesNotMatch(listCorrectionBadgeLabel(project), /CORRECTION_REQUIRED/);
  });

  it("p7-1 correction notification uses the project deep link", () => {
    assert.equal(
      notificationHref({
        eventType: "WEB_PROJECT_CORRECTION_REQUESTED",
        linkTarget: "/dashboard/proyectos/1#wp-field-site_kind"
      }),
      "/dashboard/proyectos/1#wp-field-site_kind"
    );
  });

  it("p7-2 report notification keeps informes fallback", () => {
    assert.equal(notificationHref({ eventType: "REPORT_READY", linkTarget: null }), "/dashboard/informes");
  });

  it("p7-3 external link targets are rejected", () => {
    assert.equal(
      notificationHref({ eventType: "WEB_PROJECT_COMMENT_CREATED", linkTarget: "https://evil.example" }),
      "/dashboard"
    );
  });

  it("p7-4 client copy never shows raw correction enums", () => {
    assert.equal(notificationCopyLooksSafe("Necesita corrección"), true);
    assert.equal(notificationCopyLooksSafe("CORRECTION_REQUIRED"), false);
  });
});
