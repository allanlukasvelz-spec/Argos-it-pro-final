"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NocOrg } from "@/lib/nocApi";
import { nocProjectsHref } from "@/lib/webProjects/nocWorkflow";

export function NocOrgChip({
  organizationId,
  org
}: {
  organizationId: number;
  org?: Pick<NocOrg, "id" | "name" | "slug"> | null;
}) {
  return (
    <p className="noc-org-chip" data-organization-id={organizationId}>
      <span className="noc-chip">{org?.name || `Org ${organizationId}`}</span>
      <span className="noc-disclaimer">
        organization_id={organizationId}
        {org?.slug ? ` · ${org.slug}` : ""}
      </span>
    </p>
  );
}

export function NocOrgSelector({
  orgs,
  organizationId,
  includeArchived,
  disabled
}: {
  orgs: NocOrg[];
  organizationId: number | null;
  includeArchived?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  return (
    <label className="noc-org-select">
      Organización
      <select
        value={organizationId ? String(organizationId) : ""}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          router.push(
            nocProjectsHref(Number.isInteger(next) && next > 0 ? next : null, {
              include_archived: includeArchived ? "1" : ""
            })
          );
        }}
      >
        <option value="">Selecciona una organización</option>
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} · {org.slug} · #{org.id}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NocProjectCrumb({
  organizationId,
  title
}: {
  organizationId: number;
  title: string;
}) {
  return (
    <p className="noc-disclaimer">
      <Link href={nocProjectsHref(organizationId)}>Web Projects</Link>
      {" / "}
      {title}
      {" · "}
      <Link href={`/noc/organizations/${organizationId}`}>Ficha org</Link>
    </p>
  );
}
