import { canContributeWebProject, canCreateWebProject, isWebProjectReadOnly } from "./rbac.ts";
import type {
  OrgRole,
  WebProject,
  WebProjectFormDefinition,
  WebProjectFormResponse,
  WebProjectReviewState
} from "./types.ts";
import { isFieldApplicableFromDefinition, unwrapFormValue } from "./formCopy.ts";

export function listCreateCtaVisible(orgRole: OrgRole | null | undefined): boolean {
  return canCreateWebProject(orgRole);
}

export function listMemberHintVisible(orgRole: OrgRole | null | undefined): boolean {
  return orgRole === "org_member";
}

export function listViewerHintVisible(orgRole: OrgRole | null | undefined): boolean {
  return orgRole === "org_viewer";
}

export function projectIsArchived(project: Pick<WebProject, "archivedAt">): boolean {
  return Boolean(project.archivedAt);
}

export function projectIsCompleted(project: Pick<WebProject, "workflowStatus">): boolean {
  return project.workflowStatus === "COMPLETED";
}

export function projectMutationsLocked(
  orgRole: OrgRole | null | undefined,
  project: Pick<WebProject, "archivedAt"> & { workflowStatus?: string }
): boolean {
  return isWebProjectReadOnly(orgRole, project.archivedAt) || project.workflowStatus === "COMPLETED";
}

export function documentUploadVisible(
  orgRole: OrgRole | null | undefined,
  project: Pick<WebProject, "archivedAt"> & { workflowStatus?: string }
): boolean {
  return canContributeWebProject(orgRole) && !project.archivedAt && project.workflowStatus !== "COMPLETED";
}

export function commentCreateVisible(
  orgRole: OrgRole | null | undefined,
  project: Pick<WebProject, "archivedAt"> & { workflowStatus?: string }
): boolean {
  return canContributeWebProject(orgRole) && !project.archivedAt && project.workflowStatus !== "COMPLETED";
}

export function itemCreateVisible(
  orgRole: OrgRole | null | undefined,
  project: Pick<WebProject, "archivedAt"> & { workflowStatus?: string }
): boolean {
  return (
    canContributeWebProject(orgRole) &&
    !project.archivedAt &&
    (!project.workflowStatus || project.workflowStatus === "INTAKE")
  );
}

export function reviewsAreReadOnly(): boolean {
  return true;
}

export function progressCopy(progress: WebProject["progress"]): {
  completed: number;
  required: number;
  pending: number;
  percentage: number;
} {
  return {
    completed: progress?.completed ?? 0,
    required: progress?.required ?? 0,
    pending: progress?.pending ?? 0,
    percentage: progress?.percentage ?? 0
  };
}

export function visibleFormFields(
  definition: WebProjectFormDefinition | null | undefined,
  responses: WebProjectFormResponse[] | undefined,
  context: { projectType?: string | null } = {}
) {
  const fields = definition?.fields || [];
  const values = new Map<string, unknown>();
  const byKey = new Map<string, WebProjectFormResponse>();
  for (const row of responses || []) {
    values.set(row.fieldKey, row.value);
    byKey.set(row.fieldKey, row);
  }
  return fields
    .map((field) => {
      const row = byKey.get(field.key);
      const applicable = row ? row.applicable : isFieldApplicableFromDefinition(field, values, context);
      return { field, row, applicable, value: unwrapFormValue(row?.value) };
    })
    .filter((entry) => entry.applicable);
}

export function reviewStatesOf(project: Pick<WebProject, "reviewStates"> | null | undefined): WebProjectReviewState[] {
  return project?.reviewStates || [];
}

export function reviewStateForField(
  project: Pick<WebProject, "reviewStates"> | null | undefined,
  fieldKey: string
): WebProjectReviewState | null {
  return (
    reviewStatesOf(project).find(
      (state) => state.targetType === "FORM_FIELD" && state.targetKey === fieldKey
    ) || null
  );
}

export function reviewStateForItem(
  project: Pick<WebProject, "reviewStates"> | null | undefined,
  itemId: number
): WebProjectReviewState | null {
  return (
    reviewStatesOf(project).find(
      (state) => state.targetType === "ITEM" && String(state.targetId) === String(itemId)
    ) || null
  );
}

export function reviewStateForDocument(
  project: Pick<WebProject, "reviewStates"> | null | undefined,
  documentId: string
): WebProjectReviewState | null {
  return (
    reviewStatesOf(project).find(
      (state) => state.targetType === "DOCUMENT" && String(state.targetId) === String(documentId)
    ) || null
  );
}

export function openCorrectionStates(project: Pick<WebProject, "reviewStates" | "reviewSummary"> | null | undefined) {
  return reviewStatesOf(project).filter(
    (state) => state.status === "CORRECTION_REQUIRED" && state.targetType !== "PROJECT"
  );
}

export function listCorrectionBadgeVisible(
  project: Pick<WebProject, "reviewSummary" | "reviewStates"> | null | undefined
): boolean {
  if ((project?.reviewSummary?.openCorrections || 0) > 0) return true;
  return openCorrectionStates(project).length > 0;
}

export function listCorrectionBadgeLabel(
  project: Pick<WebProject, "reviewSummary" | "reviewStates"> | null | undefined
): string {
  return "Requiere tu atención";
}

export function correctionsSummaryCopy(
  project: Pick<WebProject, "reviewSummary" | "reviewStates"> | null | undefined
): { count: number; title: string; show: boolean } {
  const count = project?.reviewSummary?.openCorrections ?? openCorrectionStates(project).length;
  return {
    count,
    title: count === 1 ? "Necesitamos que revises 1 elemento" : `Necesitamos que revises ${count} elementos`,
    show: count > 0
  };
}

export function correctionAnchor(state: Pick<WebProjectReviewState, "targetType" | "targetId" | "targetKey">): string {
  if (state.targetType === "FORM_FIELD") return `wp-field-${state.targetKey || "field"}`;
  if (state.targetType === "ITEM") return `wp-item-${state.targetId || "item"}`;
  if (state.targetType === "DOCUMENT") return `wp-doc-${state.targetId || "doc"}`;
  return "wp-reviews";
}

export function matchesNocReviewFilter(
  state: Pick<WebProjectReviewState, "status">,
  filter: "ALL" | "PENDING" | "APPROVED" | "CORRECTION_REQUIRED"
): boolean {
  if (filter === "ALL") return true;
  return state.status === filter;
}

export function nocReviewMutationLocked(
  project: Pick<WebProject, "archivedAt" | "workflowStatus">
): boolean {
  return Boolean(project.archivedAt) || project.workflowStatus === "COMPLETED";
}

export function reviewProgressCopy(project: Pick<WebProject, "reviewSummary"> | null | undefined) {
  const summary = project?.reviewSummary;
  return {
    approved: summary?.approved ?? 0,
    pending: summary?.pending ?? 0,
    correctionRequired: summary?.correctionRequired ?? 0,
    rejected: summary?.rejected ?? 0,
    openCorrections: summary?.openCorrections ?? 0
  };
}

export function notificationHref(notification: {
  eventType?: string | null;
  linkTarget?: string | null;
}): string {
  const raw = String(notification?.linkTarget || "");
  if (raw.startsWith("/dashboard/") || raw === "/dashboard") return raw;
  if (notification?.eventType === "REPORT_READY") return "/dashboard/informes";
  return "/dashboard";
}

export function notificationCopyLooksSafe(text: string | null | undefined): boolean {
  return !/CORRECTION_REQUIRED|CORRECTION_REQUESTED|WEB_PROJECT_|REVIEW_APPROVED|REVIEW_REJECTED/.test(
    String(text || "")
  );
}
