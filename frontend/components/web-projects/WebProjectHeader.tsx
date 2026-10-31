import { PageHeader } from "@/components/client/Status";
import { projectTypeLabel, workflowLabel } from "@/lib/webProjects/labels";
import { progressCopy } from "@/lib/webProjects/viewModel";
import type { WebProject } from "@/lib/webProjects/types";
import { relativeTimeEs } from "@/lib/clientCopy";

export function WebProjectHeader({ project }: { project: WebProject }) {
  const progress = progressCopy(project.progress);
  const archived = Boolean(project.archivedAt);
  return (
    <header>
      <PageHeader
        title={project.title}
        eyebrow="Crea / mejora con nosotros tu web"
        meta={
          archived
            ? "Proyecto archivado. Puedes consultar y descargar, pero no editar."
            : project.workflowStatus === "COMPLETED"
              ? `Finalizado${project.completedAt ? ` · ${relativeTimeEs(project.completedAt)}` : ""}`
              : "Expediente real. El progreso lo calcula ARGOS a partir de lo que ya has enviado."
        }
      />
      <div className="wp-header-meta">
        <p>
          <span className="wp-kicker">Tipo</span> {projectTypeLabel(project.projectType)}
        </p>
        <p>
          <span className="wp-kicker">Dominio</span> {project.websiteHostname || "Sin dominio todavía"}
        </p>
        <p>
          <span className="wp-kicker">Fase</span> {workflowLabel(project.workflowStatus)}
        </p>
        <p>
          <span className="wp-kicker">Progreso</span> {progress.completed} de {progress.required} ·{" "}
          {progress.percentage} %
        </p>
      </div>
      {archived ? (
        <p className="wp-banner" role="status">
          Proyecto archivado
        </p>
      ) : null}
      {project.workflowStatus === "COMPLETED" && !archived ? (
        <p className="wp-banner wp-banner--done" role="status">
          Finalizado
        </p>
      ) : null}
    </header>
  );
}
