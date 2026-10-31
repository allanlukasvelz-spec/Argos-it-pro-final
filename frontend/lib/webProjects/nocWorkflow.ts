import { workflowLabel } from "./labels.ts";
import type { WebProject, WebProjectWorkflowStatus } from "./types.ts";

/** Mirror of backend/lib/webProjects/workflow.js — UI only, backend enforces. */
export const NOC_TRANSITIONS: Record<WebProjectWorkflowStatus, WebProjectWorkflowStatus[]> = {
  INTAKE: ["REVIEW"],
  REVIEW: ["INTAKE", "ARCHITECTURE"],
  ARCHITECTURE: ["REVIEW", "MOCKUP"],
  MOCKUP: ["ARCHITECTURE", "DEVELOPMENT"],
  DEVELOPMENT: ["MOCKUP", "VALIDATION"],
  VALIDATION: ["DEVELOPMENT", "PUBLICATION"],
  PUBLICATION: ["VALIDATION", "DEVELOPMENT", "COMPLETED"],
  COMPLETED: []
};

export function parseNocOrganizationId(raw: string | number | null | undefined): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function nocProjectsHref(organizationId: number | null, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (organizationId) params.set("organization_id", String(organizationId));
  for (const [key, value] of Object.entries(extra || {})) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/noc/projects?${qs}` : "/noc/projects";
}

export function nocProjectHref(projectId: number, organizationId: number): string {
  return `/noc/projects/${projectId}?organization_id=${organizationId}`;
}

export function nextWorkflowStatuses(
  status: string | null | undefined,
  archivedAt?: string | null
): WebProjectWorkflowStatus[] {
  if (archivedAt) return [];
  return NOC_TRANSITIONS[status as WebProjectWorkflowStatus] || [];
}

/** Generic workflow buttons. REVIEW → ARCHITECTURE lives in Brief; ARCHITECTURE → MOCKUP in Arquitectura. */
export function nocGenericTransitionTargets(
  status: string | null | undefined,
  archivedAt?: string | null
): WebProjectWorkflowStatus[] {
  return nextWorkflowStatuses(status, archivedAt).filter((item) => {
    if (status === "REVIEW" && item === "ARCHITECTURE") return false;
    if (status === "ARCHITECTURE" && item === "MOCKUP") return false;
    if (status === "MOCKUP" && item === "DEVELOPMENT") return false;
    return true;
  });
}

export function nocQueueMixesOrgs(organizationIds: Array<number | null | undefined>): boolean {
  const unique = new Set(organizationIds.filter((id): id is number => Number.isInteger(id) && (id as number) > 0));
  return unique.size > 1;
}

export function nocTransitionLabel(from: string | null | undefined, to: string): string {
  if (from === "PUBLICATION" && to === "DEVELOPMENT") return "Reabrir para correcciones";
  return `→ ${workflowLabel(to)}`;
}

export function nocArchiveActionVisible(
  project: Pick<WebProject, "workflowStatus" | "archivedAt">
): boolean {
  return project.workflowStatus === "COMPLETED" && !project.archivedAt;
}
