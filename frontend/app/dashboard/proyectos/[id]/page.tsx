"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/client/Status";
import { WebProjectComments } from "@/components/web-projects/WebProjectComments";
import { WebProjectCredentials } from "@/components/web-projects/WebProjectCredentials";
import { WebProjectHeader } from "@/components/web-projects/WebProjectHeader";
import { WebProjectMockup } from "@/components/web-projects/WebProjectMockup";
import { WebProjectCorrectionsBanner } from "@/components/web-projects/WebProjectCorrectionsBanner";
import { WebProjectProgress } from "@/components/web-projects/WebProjectProgress";
import { WebProjectQuestionnaire } from "@/components/web-projects/WebProjectQuestionnaire";
import { WebProjectReviews } from "@/components/web-projects/WebProjectReviews";
import { fetchPortal, fetchWebProject, fetchWebProjectForm } from "@/lib/clientApi";
import { webProjectPageErrorTitle } from "@/lib/webProjects/errors";
import type { OrgRole, WebProject, WebProjectFormDefinition } from "@/lib/webProjects/types";
import {
  commentCreateVisible,
  documentUploadVisible,
  itemCreateVisible,
  projectMutationsLocked
} from "@/lib/webProjects/viewModel";

export default function WebProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<WebProject | null>(null);
  const [formDefinition, setFormDefinition] = useState<WebProjectFormDefinition | null>(null);
  const [orgRole, setOrgRole] = useState<OrgRole | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("Este proyecto no existe o no pertenece a tu organización.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [portal, detail, form] = await Promise.all([
        fetchPortal(),
        fetchWebProject(id),
        fetchWebProjectForm(id)
      ]);
      setOrgRole(portal.organization?.orgRole || null);
      setUserId(portal.user?.id || null);
      setProject({
        ...detail,
        sectionProgress: form.sectionProgress || detail.sectionProgress
      });
      setFormDefinition(form.formDefinition || null);
    } catch (err) {
      setError(webProjectPageErrorTitle(err));
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Cargando proyecto…" />;
  if (error || !project) {
    return (
      <div>
        <ErrorState title={error || "No se ha podido cargar el proyecto."} onRetry={() => void load()} />
        <p style={{ marginTop: "1rem" }}>
          <Link href="/dashboard/proyectos">Volver a proyectos</Link>
        </p>
      </div>
    );
  }

  const readOnly = projectMutationsLocked(orgRole, project);
  const canItems = itemCreateVisible(orgRole, project);
  const canUpload = documentUploadVisible(orgRole, project);
  const canComment = commentCreateVisible(orgRole, project);

  return (
    <div className="wp-detail">
      <p className="wp-crumb">
        <Link href="/dashboard/proyectos">Proyectos</Link>
        <span aria-hidden="true"> / </span>
        <span>{project.title}</span>
      </p>
      <WebProjectHeader project={project} />
      <WebProjectMockup project={project} canRespond={!readOnly} />
      <WebProjectCorrectionsBanner project={project} />
      <WebProjectProgress progress={project.progress} project={project} />
      <WebProjectQuestionnaire
        project={project}
        formDefinition={formDefinition}
        readOnly={readOnly}
        canItems={canItems}
        canUpload={canUpload}
        onUpdated={setProject}
        onReload={async () => {
          setProject(await fetchWebProject(project.id));
        }}
      />
      <WebProjectComments
        project={project}
        comments={project.comments || []}
        currentUserId={userId}
        canCreate={canComment}
        onReload={async () => {
          setProject(await fetchWebProject(project.id));
        }}
      />
      <WebProjectReviews reviews={project.reviews || []} />
      <WebProjectCredentials status={project.credentialStatus} />
    </div>
  );
}
