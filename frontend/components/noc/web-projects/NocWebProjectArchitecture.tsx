"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  approveNocWebProjectArchitecture,
  createNocArchitectureBlock,
  createNocArchitectureRevision,
  fetchNocWebProjectArchitecture,
  generateNocWebProjectArchitecture,
  startNocWebProjectMockup,
  updateNocArchitectureBlock,
  updateNocArchitecturePage
} from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  architectureBlockLabel,
  architectureNavLabel,
  architecturePageTypeLabel,
  architectureStatusLabel,
  architectureTemplateLabel,
  architectureValidationLabel
} from "@/lib/webProjects/labels";
import type {
  WebProject,
  WebProjectArchitectureBlock,
  WebProjectArchitecturePage,
  WebProjectArchitecturePayload
} from "@/lib/webProjects/types";

type TreeNode = {
  page: WebProjectArchitecturePage;
  children: TreeNode[];
};

function flattenTree(nodes: TreeNode[], depth = 0): Array<{ node: TreeNode; depth: number }> {
  const out: Array<{ node: TreeNode; depth: number }> = [];
  for (const node of nodes) {
    out.push({ node, depth });
    out.push(...flattenTree(node.children as TreeNode[], depth + 1));
  }
  return out;
}

export function NocWebProjectArchitecture({
  organizationId,
  project,
  onProjectUpdated,
  onArchitectureUpdated
}: {
  organizationId: number;
  project: WebProject;
  onProjectUpdated: (project: WebProject) => void;
  onArchitectureUpdated?: (payload: WebProjectArchitecturePayload) => void;
}) {
  const [payload, setPayload] = useState<WebProjectArchitecturePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [mockupOpen, setMockupOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNocWebProjectArchitecture(organizationId, project.id);
      setPayload(data);
      onArchitectureUpdated?.(data);
      if (!selectedPageId && data.pages[0]) setSelectedPageId(data.pages[0].id);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [organizationId, project.id, onArchitectureUpdated, selectedPageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const architecture = payload?.architecture || null;
  const validation = payload?.validation;
  const isDraft = architecture?.status === "DRAFT";
  const canEdit = project.workflowStatus === "ARCHITECTURE" && isDraft && !project.archivedAt;
  const treeRows = useMemo(
    () => flattenTree((payload?.tree as TreeNode[]) || []),
    [payload?.tree]
  );
  const selectedPage = payload?.pages.find((p) => p.id === selectedPageId) || null;
  const pageBlocks = useMemo(
    () =>
      (payload?.blocks || [])
        .filter((b) => b.architecturePageId === selectedPageId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [payload?.blocks, selectedPageId]
  );
  const wireframePreview = useMemo(() => {
    if (!selectedPage) return "";
    const blocks = pageBlocks
      .map((b) => `[ ${architectureBlockLabel(b.blockType).toUpperCase()} ]`)
      .join("\n\n");
    return [
      "HEADER",
      "────────────────",
      "NAVIGATION",
      "────────────────",
      selectedPage.pageType,
      "",
      blocks,
      "",
      "FOOTER"
    ].join("\n");
  }, [selectedPage, pageBlocks]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    await run(async () => {
      const data = await generateNocWebProjectArchitecture(organizationId, project.id);
      setPayload(data);
      if (data.pages[0]) setSelectedPageId(data.pages[0].id);
    });
  }

  async function onApprove(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      await approveNocWebProjectArchitecture(organizationId, project.id, {
        acknowledgeWarnings: validation?.state === "READY_WITH_WARNINGS"
      });
    });
  }

  async function onRevision() {
    await run(async () => {
      await createNocArchitectureRevision(organizationId, project.id);
    });
  }

  async function onStartMockup() {
    await run(async () => {
      const updated = await startNocWebProjectMockup(organizationId, project.id);
      onProjectUpdated(updated);
      setMockupOpen(false);
    });
  }

  async function moveBlock(block: WebProjectArchitectureBlock, direction: -1 | 1) {
    if (!canEdit) return;
    const peer = pageBlocks.find((b) => b.sortOrder === block.sortOrder + direction);
    await run(async () => {
      await updateNocArchitectureBlock(organizationId, project.id, block.id, {
        sortOrder: block.sortOrder + direction
      } as Partial<WebProjectArchitectureBlock>);
      if (peer) {
        await updateNocArchitectureBlock(organizationId, project.id, peer.id, {
          sortOrder: peer.sortOrder - direction
        } as Partial<WebProjectArchitectureBlock>);
      }
    });
  }

  return (
    <section className="noc-panel noc-architecture" id="noc-arquitectura">
      <div className="noc-panel__head">
        <h2>Arquitectura</h2>
        {architecture ? (
          <span className="noc-badge">
            v{architecture.version} · {architectureStatusLabel(architecture.status)} ·{" "}
            {architectureValidationLabel(validation?.state)}
          </span>
        ) : null}
      </div>
      <div className="noc-panel__body">
        {loading ? <p>Cargando arquitectura…</p> : null}
        {error ? (
          <p className="noc-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !architecture && project.workflowStatus === "ARCHITECTURE" && !project.archivedAt ? (
          <div className="noc-arch-empty" id="noc-arch-empty">
            <p>Todavía no hay una arquitectura para este proyecto.</p>
            <button type="button" className="noc-btn" disabled={busy} onClick={() => void onGenerate()}>
              Crear propuesta de arquitectura
            </button>
          </div>
        ) : null}

        {!loading && !architecture && project.workflowStatus !== "ARCHITECTURE" ? (
          <p className="noc-disclaimer">La arquitectura estará disponible cuando el proyecto entre en fase Arquitectura.</p>
        ) : null}

        {architecture ? (
          <div className="noc-arch-layout">
            <div className="noc-arch-toolbar noc-no-print">
              {canEdit ? (
                <button type="button" className="noc-btn noc-btn--ghost" disabled={busy} onClick={() => void load()}>
                  Revalidar
                </button>
              ) : null}
              {isDraft && canEdit ? (
                <button type="button" className="noc-btn" disabled={busy || validation?.state === "INVALID"} onClick={(e) => void onApprove(e)}>
                  Aprobar arquitectura
                </button>
              ) : null}
              {architecture.status === "APPROVED" && project.workflowStatus === "ARCHITECTURE" ? (
                <>
                  <button type="button" className="noc-btn noc-btn--ghost" disabled={busy} onClick={() => void onRevision()}>
                    Crear revisión
                  </button>
                  <button type="button" className="noc-btn" disabled={busy} onClick={() => setMockupOpen(true)}>
                    Pasar a maqueta
                  </button>
                </>
              ) : null}
            </div>

            {validation ? (
              <div className="noc-arch-validation" aria-live="polite">
                <strong>{architectureValidationLabel(validation.state)}</strong>
                <span>
                  {validation.metrics.pages} páginas · {validation.metrics.templates} plantillas ·{" "}
                  {validation.metrics.blocks} bloques
                </span>
                {validation.errors.length > 0 ? (
                  <ul className="noc-arch-errors">
                    {validation.errors.map((item) => (
                      <li key={`${item.code}-${item.message}`}>{item.message}</li>
                    ))}
                  </ul>
                ) : null}
                {validation.warnings.length > 0 ? (
                  <ul className="noc-arch-warnings">
                    {validation.warnings.map((item) => (
                      <li key={`${item.code}-${item.message}`}>{item.message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="noc-arch-grid">
              <div className="noc-arch-tree" id="noc-arch-tree">
                <h3>Sitemap</h3>
                <ul className="noc-arch-tree-list">
                  {treeRows.map(({ node, depth }) => (
                    <li key={node.page.id} style={{ paddingLeft: `${depth}rem` }}>
                      <button
                        type="button"
                        className={selectedPageId === node.page.id ? "is-active" : ""}
                        onClick={() => setSelectedPageId(node.page.id)}
                      >
                        <span>{node.page.title}</span>
                        <span className="noc-arch-meta">
                          {node.page.route}{" "}
                          <em>{architectureTemplateLabel(node.page.templateType)}</em>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="noc-arch-editor">
                {selectedPage ? (
                  <>
                    <h3>Editor de página</h3>
                    <PageEditor
                      page={selectedPage}
                      pages={payload?.pages || []}
                      canEdit={canEdit}
                      busy={busy}
                      onSave={async (patch) => {
                        await run(async () => {
                          await updateNocArchitecturePage(organizationId, project.id, selectedPage.id, patch);
                        });
                      }}
                    />
                    <h4>Bloques</h4>
                    <ul className="noc-arch-blocks">
                      {pageBlocks.map((block) => (
                        <li key={block.id}>
                          <strong>{architectureBlockLabel(block.blockType)}</strong>
                          {block.purpose ? <p>{block.purpose}</p> : null}
                          {canEdit ? (
                            <div className="noc-arch-block-actions">
                              <button type="button" aria-label="Subir bloque" disabled={busy} onClick={() => void moveBlock(block, -1)}>
                                ↑
                              </button>
                              <button type="button" aria-label="Bajar bloque" disabled={busy} onClick={() => void moveBlock(block, 1)}>
                                ↓
                              </button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {canEdit ? (
                      <button
                        type="button"
                        className="noc-btn noc-btn--ghost"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await createNocArchitectureBlock(organizationId, project.id, selectedPage.id, {
                              blockType: "CUSTOM",
                              purpose: "Bloque personalizado pendiente de definir."
                            });
                          })
                        }
                      >
                        + Añadir bloque
                      </button>
                    ) : null}

                    <div className="noc-arch-preview">
                      <h4>Vista estructural</h4>
                      <pre className="noc-arch-wireframe" aria-label="Vista estructural">
                        {wireframePreview}
                      </pre>
                    </div>
                  </>
                ) : (
                  <p>Selecciona una página del sitemap.</p>
                )}
              </div>
            </div>

            {payload?.versions && payload.versions.length > 1 ? (
              <div className="noc-arch-history">
                <h3>Historial</h3>
                <ul>
                  {payload.versions.map((v) => (
                    <li key={v.id}>
                      v{v.version} — {architectureStatusLabel(v.status)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {mockupOpen && architecture ? (
          <dialog open className="noc-dialog" aria-labelledby="mockup-title">
            <h3 id="mockup-title">Pasar a maqueta</h3>
            <p>
              Arquitectura v{architecture.version} · {validation?.metrics.pages} páginas ·{" "}
              {validation?.metrics.templates} plantillas · {validation?.metrics.blocks} bloques
            </p>
            {validation?.warnings.length ? (
              <ul>
                {validation.warnings.map((w) => (
                  <li key={w.message}>{w.message}</li>
                ))}
              </ul>
            ) : null}
            <div className="noc-dialog-actions">
              <button type="button" className="noc-btn noc-btn--ghost" onClick={() => setMockupOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="noc-btn" disabled={busy} onClick={() => void onStartMockup()}>
                Confirmar
              </button>
            </div>
          </dialog>
        ) : null}
      </div>
    </section>
  );
}

function PageEditor({
  page,
  pages,
  canEdit,
  busy,
  onSave
}: {
  page: WebProjectArchitecturePage;
  pages: WebProjectArchitecturePage[];
  canEdit: boolean;
  busy: boolean;
  onSave: (patch: Partial<WebProjectArchitecturePage>) => Promise<void>;
}) {
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [purpose, setPurpose] = useState(page.purpose || "");
  const [primaryCta, setPrimaryCta] = useState(page.primaryCta || "");
  const [seoPriority, setSeoPriority] = useState(page.seoPriority);
  const [navigationPlacement, setNavigationPlacement] = useState(page.navigationPlacement);
  const [parentPageId, setParentPageId] = useState(page.parentPageId ? String(page.parentPageId) : "");

  useEffect(() => {
    setTitle(page.title);
    setSlug(page.slug);
    setPurpose(page.purpose || "");
    setPrimaryCta(page.primaryCta || "");
    setSeoPriority(page.seoPriority);
    setNavigationPlacement(page.navigationPlacement);
    setParentPageId(page.parentPageId ? String(page.parentPageId) : "");
  }, [page]);

  return (
    <form
      className="noc-arch-page-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          title,
          slug,
          purpose,
          primaryCta,
          seoPriority,
          navigationPlacement,
          parentPageId: parentPageId ? Number(parentPageId) : null
        } as Partial<WebProjectArchitecturePage>);
      }}
    >
      <p>
        <strong>Tipo:</strong> {architecturePageTypeLabel(page.pageType)} ·{" "}
        {architectureTemplateLabel(page.templateType)}
      </p>
      <p>
        <strong>Ruta:</strong> <code>{page.route}</code>
      </p>
      <label>
        Título
        <input value={title} disabled={!canEdit || busy} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Slug
        <input value={slug} disabled={!canEdit || busy || page.pageType === "HOME"} onChange={(e) => setSlug(e.target.value)} />
      </label>
      <label>
        Página superior
        <select
          value={parentPageId}
          disabled={!canEdit || busy || page.pageType === "HOME"}
          onChange={(e) => setParentPageId(e.target.value)}
        >
          <option value="">— Raíz —</option>
          {pages
            .filter((p) => p.id !== page.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        Navegación
        <select
          value={navigationPlacement}
          disabled={!canEdit || busy}
          onChange={(e) => setNavigationPlacement(e.target.value)}
        >
          {["PRIMARY", "SECONDARY", "UTILITY", "FOOTER", "HIDDEN", "NONE"].map((value) => (
            <option key={value} value={value}>
              {architectureNavLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Objetivo
        <textarea value={purpose} disabled={!canEdit || busy} onChange={(e) => setPurpose(e.target.value)} rows={3} />
      </label>
      <label>
        CTA principal
        <input value={primaryCta} disabled={!canEdit || busy} onChange={(e) => setPrimaryCta(e.target.value)} />
      </label>
      <label>
        Prioridad SEO
        <select value={seoPriority} disabled={!canEdit || busy} onChange={(e) => setSeoPriority(e.target.value)}>
          {["HIGH", "MEDIUM", "LOW", "NONE"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      {canEdit ? (
        <button type="submit" className="noc-btn" disabled={busy}>
          Guardar página
        </button>
      ) : null}
    </form>
  );
}
