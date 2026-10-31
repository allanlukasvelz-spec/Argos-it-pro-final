"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { NocEmpty, NocError, NocLoading, NocPageHeader } from "@/components/noc/NocUi";
import { NocOrgChip, NocOrgSelector } from "@/components/noc/web-projects/NocOrgContext";
import { NocInvitationList } from "@/components/noc/web-projects/NocInvitationList";
import { NocInviteClient } from "@/components/noc/web-projects/NocInviteClient";
import { NocWebProjectCreate } from "@/components/noc/web-projects/NocWebProjectCreate";
import {
  fetchNocOrganizations,
  fetchNocWebProjectInvitations,
  fetchNocWebProjects,
  type NocInvitationCreateResult,
  type NocOrg,
  type NocWebProjectInvitation
} from "@/lib/nocApi";
import { invitationCreatedMessage } from "@/lib/webProjects/invitationUi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { projectTypeLabel, workflowLabel } from "@/lib/webProjects/labels";
import { nocProjectHref, nocQueueMixesOrgs, parseNocOrganizationId } from "@/lib/webProjects/nocWorkflow";
import { progressCopy } from "@/lib/webProjects/viewModel";
import type { WebProject } from "@/lib/webProjects/types";

export default function NocWebProjectsQueuePage() {
  return (
    <Suspense fallback={<NocLoading label="Cargando cola de proyectos…" />}>
      <NocWebProjectsQueue />
    </Suspense>
  );
}

function NocWebProjectsQueue() {
  const router = useRouter();
  const search = useSearchParams();
  const organizationId = parseNocOrganizationId(search.get("organization_id"));
  const includeArchived = search.get("include_archived") === "1";
  const [orgs, setOrgs] = useState<NocOrg[]>([]);
  const [items, setItems] = useState<WebProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState<NocWebProjectInvitation[]>([]);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  const selectedOrg = orgs.find((org) => org.id === organizationId) || null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgData = await fetchNocOrganizations(100, 0);
      setOrgs(orgData.organizations || []);
      const inviteData = await fetchNocWebProjectInvitations(organizationId);
      setInvitations(inviteData.items);
      if (!organizationId) {
        setItems([]);
        return;
      }
      const data = await fetchNocWebProjects(organizationId, { includeArchived });
      if (data.organizationId !== organizationId) {
        throw new Error("La cola devolvió otra organización.");
      }
      if (nocQueueMixesOrgs(data.items.map((item) => item.organizationId))) {
        throw new Error("La cola mezcló organizaciones.");
      }
      setItems(data.items);
    } catch (err) {
      setError(webProjectErrorMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [includeArchived, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading label="Cargando cola de proyectos…" />;
  if (error) return <NocError title={error} onRetry={() => void load()} />;

  return (
    <div>
      <NocPageHeader
        title="Web Projects"
        eyebrow="Entrega · scoped por organización"
        meta="Cola de expedientes. Una organización cada vez. El cliente no ve esta vista."
      />
      <div className="noc-toolbar">
        <NocOrgSelector orgs={orgs} organizationId={organizationId} includeArchived={includeArchived} />
        {organizationId ? (
          <label className="noc-check">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                const params = new URLSearchParams();
                params.set("organization_id", String(organizationId));
                if (e.target.checked) params.set("include_archived", "1");
                router.push(`/noc/projects?${params.toString()}`);
              }}
            />
            Incluir archivados
          </label>
        ) : null}
      </div>

      <div className="noc-actions">
        {!inviting ? (
          <button
            type="button"
            className="noc-btn noc-btn--primary"
            onClick={() => {
              setInviting(true);
              setCreating(false);
            }}
          >
            Invitar nuevo cliente
          </button>
        ) : null}
        {organizationId && !creating ? (
          <button type="button" className="noc-btn" onClick={() => setCreating(true)}>
            Crear expediente
          </button>
        ) : null}
      </div>
      {inviteNotice ? <p className="noc-disclaimer">{inviteNotice}</p> : null}
      {inviting ? (
        <NocInviteClient
          organizationId={organizationId}
          onCreated={(result: NocInvitationCreateResult) => {
            setInviteNotice(invitationCreatedMessage(result.delivery));
            setInviting(false);
            void load();
          }}
          onCancel={() => setInviting(false)}
        />
      ) : null}
      <NocInvitationList
        items={invitations}
        onChanged={(result) => {
          if (result) setInviteNotice(invitationCreatedMessage(result.delivery));
          void load();
        }}
      />

      {!organizationId ? (
        <NocEmpty
          title="Selecciona una organización."
          description="La cola NOC no lista proyectos de varios tenants a la vez. Sí puedes invitar a un cliente nuevo sin seleccionarla."
        />
      ) : (
        <>
          <NocOrgChip organizationId={organizationId} org={selectedOrg} />
          {creating ? (
            <NocWebProjectCreate
              organizationId={organizationId}
              onCreated={(id) => router.push(nocProjectHref(id, organizationId))}
              onCancel={() => setCreating(false)}
            />
          ) : null}
          {items.length === 0 ? (
            <NocEmpty
              title="Sin proyectos en esta organización."
              description="El staff puede crear el primer expediente aquí. No hay datos DEMO."
            />
          ) : (
            <div className="noc-panel">
              <div className="noc-table-wrap">
                <table className="noc-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Tipo</th>
                      <th>Fase</th>
                      <th>Progreso</th>
                      <th>Actualizado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((project) => {
                      const progress = progressCopy(project.progress);
                      return (
                        <tr key={project.id}>
                          <td>{project.id}</td>
                          <td>
                            {project.title}
                            {project.archivedAt ? " · archivado" : ""}
                            {project.websiteHostname ? (
                              <span className="noc-disclaimer"> · {project.websiteHostname}</span>
                            ) : null}
                          </td>
                          <td>{projectTypeLabel(project.projectType)}</td>
                          <td>
                            {workflowLabel(project.workflowStatus)}{" "}
                            <code>{project.workflowStatus}</code>
                          </td>
                          <td>
                            {progress.completed}/{progress.required} · {progress.percentage}%
                            {project.reviewSummary?.openCorrections ? (
                              <span className="noc-disclaimer">
                                {" "}
                                · {project.reviewSummary.openCorrections} correcciones pendientes
                              </span>
                            ) : project.reviewSummary && project.reviewSummary.pending > 0 ? (
                              <span className="noc-disclaimer"> · Pendiente de revisión</span>
                            ) : null}
                          </td>
                          <td>{relativeTimeEs(project.updatedAt)}</td>
                          <td>
                            <Link href={nocProjectHref(project.id, organizationId)}>Abrir</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
