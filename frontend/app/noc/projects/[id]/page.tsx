"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { NocError, NocLoading, NocPageHeader } from "@/components/noc/NocUi";
import { NocOrgChip, NocProjectCrumb } from "@/components/noc/web-projects/NocOrgContext";
import { NocWebProjectArchitecture } from "@/components/noc/web-projects/NocWebProjectArchitecture";
import { NocWebProjectDevelopment } from "@/components/noc/web-projects/NocWebProjectDevelopment";
import { NocWebProjectPublication } from "@/components/noc/web-projects/NocWebProjectPublication";
import { NocWebProjectValidation } from "@/components/noc/web-projects/NocWebProjectValidation";
import { NocWebProjectMockup } from "@/components/noc/web-projects/NocWebProjectMockup";
import { NocWebProjectBrief } from "@/components/noc/web-projects/NocWebProjectBrief";
import { NocWebProjectComments } from "@/components/noc/web-projects/NocWebProjectComments";
import { NocWebProjectDocuments } from "@/components/noc/web-projects/NocWebProjectDocuments";
import {
  NocWebProjectCredentials,
  NocWebProjectFormRead,
  NocWebProjectHeader,
  NocWebProjectItemsRead
} from "@/components/noc/web-projects/NocWebProjectReadSlices";
import { NocWebProjectReviews } from "@/components/noc/web-projects/NocWebProjectReviews";
import { NocWebProjectWorkflow } from "@/components/noc/web-projects/NocWebProjectWorkflow";
import { fetchNocOrganization, fetchNocWebProject, fetchNocWebProjectBrief, type NocOrg } from "@/lib/nocApi";
import { webProjectPageErrorTitle } from "@/lib/webProjects/errors";
import { nocProjectsHref, parseNocOrganizationId } from "@/lib/webProjects/nocWorkflow";
import type { WebProject, WebProjectBriefPayload } from "@/lib/webProjects/types";

export default function NocWebProjectDetailPage() {
  return (
    <Suspense fallback={<NocLoading label="Cargando expediente…" />}>
      <NocWebProjectDetail />
    </Suspense>
  );
}

function NocWebProjectDetail() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const projectId = Number(params.id);
  const organizationId = parseNocOrganizationId(search.get("organization_id"));
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "CORRECTION_REQUIRED">("ALL");
  const [project, setProject] = useState<WebProject | null>(null);
  const [brief, setBrief] = useState<WebProjectBriefPayload | null>(null);
  const [org, setOrg] = useState<NocOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setError("Falta organization_id. El detalle NOC no infiere el tenant.");
      setProject(null);
      setLoading(false);
      return;
    }
    if (!Number.isInteger(projectId) || projectId <= 0) {
      setError("Identificador de proyecto no válido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [detail, orgData, briefData] = await Promise.all([
        fetchNocWebProject(organizationId, projectId),
        fetchNocOrganization(organizationId).catch(() => null),
        fetchNocWebProjectBrief(organizationId, projectId)
      ]);
      if (detail.organizationId !== organizationId) {
        throw new Error("El proyecto no pertenece a la organización pedida.");
      }
      setProject(detail);
      setBrief(briefData);
      setOrg((orgData?.organization as NocOrg) || null);
    } catch (err) {
      setError(webProjectPageErrorTitle(err));
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading label="Cargando expediente…" />;
  if (error || !project || !organizationId) {
    return (
      <div>
        <NocError title={error || "No se ha podido cargar el expediente."} onRetry={() => void load()} />
        <p className="noc-disclaimer">
          <Link href={nocProjectsHref(organizationId)}>Volver a la cola</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="noc-wp-detail">
      <NocProjectCrumb organizationId={organizationId} title={project.title} />
      <NocPageHeader
        title={project.title}
        eyebrow="Entrega · expediente staff"
        meta={
          project.archivedAt
            ? "Proyecto archivado. Lectura y descarga; sin mutaciones."
            : project.completedAt
              ? `Finalizado ${project.completedAt}. COMPLETED no equivale a archivado.`
              : "El cliente no controla transiciones. El progreso viene del backend."
        }
      />
      <NocOrgChip organizationId={organizationId} org={org} />
      <nav className="noc-wp-toc" aria-label="Secciones del expediente">
        <a href="#noc-resumen">Resumen</a>
        <a href="#noc-cuestionario">Cuestionario</a>
        <a href="#noc-contenido">Contenido</a>
        <a href="#noc-documentos">Documentos</a>
        <a href="#noc-revision">Revisión</a>
        <a href="#noc-brief">Brief del proyecto</a>
        <a href="#noc-arquitectura">Arquitectura</a>
        <a href="#noc-maqueta">Maqueta</a>
        <a href="#noc-desarrollo">Desarrollo</a>
        <a href="#noc-validacion">Validación</a>
        <a href="#noc-publicacion">Publicación</a>
        <a href="#noc-actividad">Actividad</a>
      </nav>
      <div id="noc-resumen">
        <NocWebProjectHeader project={project} />
      </div>
      <NocWebProjectWorkflow organizationId={organizationId} project={project} onUpdated={setProject} />
      <NocWebProjectBrief
        organizationId={organizationId}
        project={project}
        payload={brief}
        onProjectUpdated={setProject}
        onBriefUpdated={setBrief}
      />
      <NocWebProjectArchitecture
        organizationId={organizationId}
        project={project}
        onProjectUpdated={setProject}
      />
      <NocWebProjectMockup
        organizationId={organizationId}
        project={project}
        onProjectUpdated={setProject}
      />
      <NocWebProjectDevelopment
        organizationId={organizationId}
        project={project}
        onProjectUpdated={setProject}
      />
      <NocWebProjectValidation
        organizationId={organizationId}
        project={project}
        onProjectUpdated={setProject}
      />
      <NocWebProjectPublication
        organizationId={organizationId}
        project={project}
        onProjectUpdated={setProject}
      />
      <section className="noc-panel">
        <div className="noc-panel__head">Filtro de revisión</div>
        <div className="noc-panel__body">
          <label>
            Estado
            <select
              value={reviewFilter}
              onChange={(e) =>
                setReviewFilter(e.target.value as "ALL" | "PENDING" | "APPROVED" | "CORRECTION_REQUIRED")
              }
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobados</option>
              <option value="CORRECTION_REQUIRED">Corrección requerida</option>
            </select>
          </label>
        </div>
      </section>
      <section className="noc-panel" id="noc-cuestionario">
        <div className="noc-panel__head">Cuestionario (solo lectura)</div>
        <div className="noc-panel__body">
          <p className="noc-disclaimer">
            ARGOS revisa. No se edita la respuesta del cliente desde NOC.
          </p>
          <NocWebProjectFormRead
            organizationId={organizationId}
            project={project}
            filter={reviewFilter}
            onUpdated={setProject}
          />
        </div>
      </section>
      <section className="noc-panel" id="noc-contenido">
        <div className="noc-panel__head">Items</div>
        <div className="noc-panel__body">
          <NocWebProjectItemsRead
            organizationId={organizationId}
            project={project}
            filter={reviewFilter}
            onUpdated={setProject}
          />
        </div>
      </section>
      <div id="noc-documentos">
        <NocWebProjectDocuments
          organizationId={organizationId}
          project={project}
          documents={project.documents || []}
          filter={reviewFilter}
          onReload={async () => setProject(await fetchNocWebProject(organizationId, project.id))}
          onUpdated={setProject}
        />
      </div>
      <div id="noc-revision">
        <NocWebProjectReviews
          organizationId={organizationId}
          project={project}
          reviews={project.reviews || []}
          onUpdated={setProject}
        />
      </div>
      <div id="noc-actividad">
        <NocWebProjectComments
          organizationId={organizationId}
          project={project}
          comments={project.comments || []}
          onReload={async () => setProject(await fetchNocWebProject(organizationId, project.id))}
        />
      </div>
      <NocWebProjectCredentials organizationId={organizationId} project={project} onUpdated={setProject} />
    </div>
  );
}
