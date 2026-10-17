"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { approveMockup, fetchMockup, requestMockupChanges } from "@/lib/clientApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { mockupSectionLabel, mockupStatusLabel, mockupVariantLabel } from "@/lib/webProjects/labels";
import type {
  MockupDesignTokens,
  WebProject,
  WebProjectMockupPayload,
  WebProjectMockupSection
} from "@/lib/webProjects/types";

const CLIENT_VISIBLE = new Set(["CLIENT_REVIEW", "APPROVED"]);

function tokenStyle(tokens: MockupDesignTokens | undefined): CSSProperties {
  const colors = tokens?.colors || {};
  return {
    ["--mockup-primary" as string]: colors.primary || "#1a365d",
    ["--mockup-secondary" as string]: colors.secondary || "#2c5282",
    ["--mockup-accent" as string]: colors.accent || "#ed8936",
    ["--mockup-bg" as string]: colors.background || "#ffffff",
    ["--mockup-surface" as string]: colors.surface || "#f7fafc",
    ["--mockup-text" as string]: colors.text || "#1a202c",
    ["--mockup-muted" as string]: colors.muted || "#718096",
    ["--mockup-border" as string]: colors.border || "#e2e8f0",
    ["--mockup-radius" as string]: tokens?.shape?.radius || "0.375rem"
  };
}

function PreviewSection({ section }: { section: WebProjectMockupSection }) {
  const isHero = section.sectionType === "HERO";
  return (
    <div className={`wp-mockup-section${isHero ? " wp-mockup-section--hero" : ""}`} data-align={section.alignment}>
      <span className="wp-mockup-section__label">
        {mockupSectionLabel(section.sectionType)} · {mockupVariantLabel(section.variant)}
      </span>
      <p className="wp-mockup-section__copy">
        {section.placeholderText || `[${mockupSectionLabel(section.sectionType)}]`}
      </p>
    </div>
  );
}

export function WebProjectMockup({
  project,
  canRespond = true,
  onUpdated
}: {
  project: WebProject;
  canRespond?: boolean;
  onUpdated?: (payload: WebProjectMockupPayload) => void;
}) {
  const [payload, setPayload] = useState<WebProjectMockupPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMockup(project.id);
      setPayload(data);
      onUpdated?.(data);
      if (!selectedPageId && data.pages[0]) setSelectedPageId(data.pages[0].id);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [project.id, onUpdated, selectedPageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mockup = payload?.mockup || null;
  const visible = mockup && CLIENT_VISIBLE.has(mockup.status);
  const pages = useMemo(
    () => (payload?.pages || []).filter((p) => !p.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [payload?.pages]
  );
  const selectedPage = pages.find((p) => p.id === selectedPageId) || null;
  const sections = useMemo(() => {
    if (!selectedPageId) return [];
    return (payload?.sections || [])
      .filter((s) => s.mockupPageId === selectedPageId && !s.archivedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [payload?.sections, selectedPageId]);

  if (loading) return null;
  if (!visible || !mockup) return null;

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

  async function onApprove() {
    await run(async () => {
      await approveMockup(project.id);
    });
  }

  async function onRequestChanges(e: FormEvent) {
    e.preventDefault();
    const message = changeMessage.trim();
    if (!message) return;
    await run(async () => {
      await requestMockupChanges(project.id, message);
      setChangesOpen(false);
      setChangeMessage("");
    });
  }

  const previewStyle = tokenStyle(mockup.designTokens);
  const canAct = canRespond && mockup.status === "CLIENT_REVIEW";

  return (
    <section className="wp-section wp-mockup" aria-labelledby="wp-mockup-title">
      <div className="wp-section-head">
        <div>
          <p className="wp-kicker">Vista previa</p>
          <h2 className="wp-section-title" id="wp-mockup-title">
            Maqueta del proyecto
          </h2>
        </div>
        <span className="wp-badge">
          v{mockup.version} · {mockupStatusLabel(mockup.status)}
        </span>
      </div>

      {error ? (
        <p className="wp-field-error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="wp-disclaimer">
        Esta es una vista previa visual de referencia. No es la web final ni incluye contenido real todavía.
      </p>

      <div className="wp-mockup-layout">
        <nav className="wp-mockup-nav" aria-label="Páginas de la maqueta">
          <ul>
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={selectedPageId === page.id ? "is-active" : ""}
                  onClick={() => setSelectedPageId(page.id)}
                >
                  {page.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="wp-mockup-preview" style={previewStyle}>
          {selectedPage ? (
            <>
              <header className="wp-mockup-preview__chrome">
                {selectedPage.title}
              </header>
              {sections.map((section) => (
                <PreviewSection key={section.id} section={section} />
              ))}
            </>
          ) : (
            <p>Selecciona una página.</p>
          )}
        </div>
      </div>

      {canAct ? (
        <div className="wp-actions wp-mockup-actions">
          <button type="button" className="cp-btn cp-btn--primary" disabled={busy} onClick={() => void onApprove()}>
            Aprobar maqueta
          </button>
          <button type="button" className="cp-btn cp-btn--ghost" disabled={busy} onClick={() => setChangesOpen(true)}>
            Solicitar cambios
          </button>
        </div>
      ) : null}

      {mockup.status === "APPROVED" && mockup.approvedAt ? (
        <p className="wp-banner wp-banner--done">Maqueta aprobada el {new Date(mockup.approvedAt).toLocaleDateString("es-ES")}.</p>
      ) : null}

      {changesOpen ? (
        <dialog open className="cp-card wp-mockup-dialog" aria-labelledby="wp-mockup-changes-title">
          <h3 id="wp-mockup-changes-title">Solicitar cambios en la maqueta</h3>
          <form className="cp-form" onSubmit={(e) => void onRequestChanges(e)}>
            <label>
              Describe qué quieres cambiar
              <textarea
                value={changeMessage}
                required
                rows={4}
                disabled={busy}
                onChange={(e) => setChangeMessage(e.target.value)}
              />
            </label>
            <div className="wp-actions">
              <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setChangesOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="cp-btn cp-btn--primary" disabled={busy || !changeMessage.trim()}>
                Enviar comentarios
              </button>
            </div>
          </form>
        </dialog>
      ) : null}
    </section>
  );
}
