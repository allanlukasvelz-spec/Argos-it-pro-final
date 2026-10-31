import type { OrgRole } from "./types.ts";

export function canCreateWebProject(orgRole: OrgRole | null | undefined): boolean {
  return orgRole === "org_owner" || orgRole === "org_admin";
}

export function canContributeWebProject(orgRole: OrgRole | null | undefined): boolean {
  return orgRole === "org_owner" || orgRole === "org_admin" || orgRole === "org_member";
}

export function canReadWebProject(orgRole: OrgRole | null | undefined): boolean {
  return (
    orgRole === "org_owner" ||
    orgRole === "org_admin" ||
    orgRole === "org_member" ||
    orgRole === "org_viewer"
  );
}

export function isWebProjectReadOnly(
  orgRole: OrgRole | null | undefined,
  archivedAt: string | null | undefined
): boolean {
  if (archivedAt) return true;
  return !canContributeWebProject(orgRole);
}
