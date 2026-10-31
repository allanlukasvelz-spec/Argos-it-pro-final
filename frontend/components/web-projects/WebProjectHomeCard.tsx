"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWebProjects } from "@/lib/clientApi";
import { workflowLabel } from "@/lib/webProjects/labels";
import type { WebProject } from "@/lib/webProjects/types";
import { progressCopy } from "@/lib/webProjects/viewModel";

export function WebProjectHomeCard() {
  const [project, setProject] = useState<WebProject | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items } = await fetchWebProjects();
        if (cancelled) return;
        const active = items.find((item) => !item.archivedAt) || items[0] || null;
        setProject(active);
      } catch {
        if (!cancelled) setProject(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (project === undefined) return null;

  if (!project) {
    return (
      <div className="cp-card">
        <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Proyecto web</h2>
        <p className="cp-disclaimer">Crea o mejora con nosotros tu web.</p>
        <Link className="cp-btn cp-btn--secondary" href="/dashboard/proyectos">
          Ver proyectos
        </Link>
      </div>
    );
  }

  const progress = progressCopy(project.progress);
  return (
    <div className="cp-card">
      <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Proyecto web</h2>
      <p>
        {workflowLabel(project.workflowStatus)} · {progress.percentage} %
      </p>
      <p className="cp-disclaimer">{project.title}</p>
      <Link className="cp-btn cp-btn--secondary" href={`/dashboard/proyectos/${project.id}`}>
        Continuar
      </Link>
    </div>
  );
}
