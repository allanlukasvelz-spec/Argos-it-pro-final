"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState, PageHeader } from "@/components/client/Status";
import { WebProjectCreateForm } from "@/components/web-projects/WebProjectCreateForm";
import { WebProjectEmptyState } from "@/components/web-projects/WebProjectEmptyState";
import { fetchPortal, fetchWebProjects } from "@/lib/clientApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectPageErrorTitle } from "@/lib/webProjects/errors";
import { projectTypeLabel, workflowLabel } from "@/lib/webProjects/labels";
import type { OrgRole, WebProject } from "@/lib/webProjects/types";
import {
  listCreateCtaVisible,
  listMemberHintVisible,
  listViewerHintVisible,
  listCorrectionBadgeLabel,
  listCorrectionBadgeVisible,
  progressCopy
} from "@/lib/webProjects/viewModel";

export default function WebProjectsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WebProject[]>([]);
  const [orgRole, setOrgRole] = useState<OrgRole | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [portal, projects] = await Promise.all([fetchPortal(), fetchWebProjects()]);
      setOrgRole(portal.organization?.orgRole || null);
      setItems(projects.items);
    } catch (err) {
      setError(webProjectPageErrorTitle(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Cargando proyectos…" />;
  if (error) return <ErrorState title={error} onRetry={() => void load()} />;

  const canCreate = listCreateCtaVisible(orgRole);

  return (
    <div>
      <PageHeader
        title="Proyectos"
        eyebrow="Crea / mejora con nosotros tu web"
        meta="Expedientes reales de tu organización. ARGOS te guía para reunir la información necesaria."
      />

      {canCreate && items.length > 0 && !creating ? (
        <div className="wp-toolbar">
          <button type="button" className="cp-btn cp-btn--primary" onClick={() => setCreating(true)}>
            Iniciar proyecto web
          </button>
        </div>
      ) : null}

      {creating ? (
        <WebProjectCreateForm
          onCreated={(id) => router.push(`/dashboard/proyectos/${id}`)}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {items.length === 0 && !creating ? (
        <WebProjectEmptyState
          canCreate={canCreate}
          memberHint={listMemberHintVisible(orgRole)}
          viewerHint={listViewerHintVisible(orgRole)}
          onCreate={() => setCreating(true)}
        />
      ) : null}

      {items.length > 0 ? (
        <ul className="wp-cards">
          {items.map((project) => {
            const progress = progressCopy(project.progress);
            return (
              <li key={project.id} className="cp-card wp-card">
                <div>
                  <h2>{project.title}</h2>
                  <p className="cp-disclaimer">
                    {projectTypeLabel(project.projectType)}
                    {project.websiteHostname ? ` · ${project.websiteHostname}` : ""} ·{" "}
                    {workflowLabel(project.workflowStatus)}
                    {project.archivedAt ? " · Archivado" : ""}
                  </p>
                  <p>
                    {progress.completed} de {progress.required} · {progress.percentage} % · {progress.pending}{" "}
                    pendientes
                  </p>
                  <p className="cp-disclaimer">Actualizado {relativeTimeEs(project.updatedAt)}</p>
                  {listCorrectionBadgeVisible(project) ? (
                    <p className="wp-attention" role="status">
                      ⚠ {listCorrectionBadgeLabel(project)}
                    </p>
                  ) : null}
                </div>
                <Link className="cp-btn cp-btn--secondary" href={`/dashboard/proyectos/${project.id}`}>
                  {project.archivedAt || project.workflowStatus === "COMPLETED" ? "Ver proyecto" : "Continuar"}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
