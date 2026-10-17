"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  createNocMockupRevision,
  fetchNocWebProjectMockup,
  generateNocWebProjectMockup,
  sendNocMockupToClient,
  startNocMockupInternalReview,
  startNocWebProjectDevelopment,
  updateNocMockupSection,
  updateNocWebProjectMockup,
  validateNocWebProjectMockup
} from "@/lib/nocApi";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  mockupAlignmentLabel,
  mockupDensityLabel,
  mockupSectionLabel,
  mockupStatusLabel,
  mockupValidationLabel,
  mockupVariantLabel
} from "@/lib/webProjects/labels";
import {
  effectivePreviewItem,
  isDetailTemplatePage,
  listCompatiblePreviewItems
} from "@/lib/webProjects/mockupPreview";
import type {
  MockupDesignTokens,
  MockupVisualDirection,
  WebProject,
  WebProjectMockupPayload,
  WebProjectMockupSection
} from "@/lib/webProjects/types";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTH: Record<Viewport, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 390
};

const EDITABLE_STATUSES = new Set(["DRAFT", "INTERNAL_REVIEW"]);
const REVISION_BASE_STATUSES = new Set(["CHANGES_REQUESTED", "CLIENT_REVIEW", "APPROVED"]);

function pageSections(
  sections: WebProjectMockupSection[],
  pageId: number | null
): WebProjectMockupSection[] {
  if (!pageId) return [];
  return sections
    .filter((s) => s.mockupPageId === pageId && !s.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

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
  const isHeader = section.sectionType === "HEADER";
  const isFooter = section.sectionType === "FOOTER";
  return (
    <div
      className={`noc-mockup-section${isHero ? " noc-mockup-section--hero" : ""}${isHeader ? " noc-mockup-section--header" : ""}${isFooter ? " noc-mockup-section--footer" : ""}`}
      data-align={section.alignment}
      data-density={section.density}
    >
      <span className="noc-mockup-section__label">
        {mockupSectionLabel(section.sectionType)} · {mockupVariantLabel(section.variant)}
      </span>
      <p className="noc-mockup-section__copy">
        {section.placeholderText || `[${mockupSectionLabel(section.sectionType)}]`}
      </p>
    </div>
  );
}

export function NocWebProjectMockup({
  organizationId,
  project,
  onProjectUpdated
}: {
  organizationId: number;
  project: WebProject;
  onProjectUpdated: (project: WebProject) => void;
}) {
  const [payload, setPayload] = useState<WebProjectMockupPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [sendOpen, setSendOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNocWebProjectMockup(organizationId, project.id);
      setPayload(data);
      if (!selectedPageId && data.pages[0]) setSelectedPageId(data.pages[0].id);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [organizationId, project.id, selectedPageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mockup = payload?.mockup || null;
  const validation = payload?.validation;
  const canEdit =
    project.workflowStatus === "MOCKUP" &&
    Boolean(mockup && EDITABLE_STATUSES.has(mockup.status)) &&
    !project.archivedAt;
  const pages = useMemo(
    () => (payload?.pages || []).filter((p) => !p.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder),
    [payload?.pages]
  );
  const selectedPage = pages.find((p) => p.id === selectedPageId) || null;
  const sections = useMemo(
    () => pageSections(payload?.sections || [], selectedPageId),
    [payload?.sections, selectedPageId]
  );
  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;
  const previewStyle = tokenStyle(mockup?.designTokens);
  const detailPage = selectedPage && isDetailTemplatePage(selectedPage) ? selectedPage : null;
  const compatiblePreviewItems = useMemo(
    () => listCompatiblePreviewItems(payload?.contentPreviewItems, detailPage),
    [payload?.contentPreviewItems, detailPage]
  );
  const activePreviewItem = useMemo(
    () => effectivePreviewItem(detailPage, payload?.previewItem || null),
    [detailPage, payload?.previewItem]
  );

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
      const data = await generateNocWebProjectMockup(organizationId, project.id);
      setPayload(data);
      if (data.pages[0]) setSelectedPageId(data.pages[0].id);
    });
  }

  async function onValidate() {
    if (!mockup) return;
    await run(async () => {
      const data = await validateNocWebProjectMockup(organizationId, project.id, mockup.id);
      setPayload((prev) => (prev ? { ...prev, validation: data.validation } : data));
    });
  }

  async function onInternalReview() {
    if (!mockup) return;
    await run(async () => {
      await startNocMockupInternalReview(organizationId, project.id, mockup.id);
    });
  }

  async function onSendClient(acknowledgeWarnings = false) {
    if (!mockup) return;
    await run(async () => {
      await sendNocMockupToClient(organizationId, project.id, mockup.id, { acknowledgeWarnings });
      setSendOpen(false);
    });
  }

  async function onRevision() {
    await run(async () => {
      const data = await createNocMockupRevision(organizationId, project.id);
      setPayload(data);
      if (data.pages[0]) setSelectedPageId(data.pages[0].id);
      setSelectedSectionId(null);
    });
  }

  async function onStartDevelopment() {
    await run(async () => {
      const updated = await startNocWebProjectDevelopment(organizationId, project.id);
      onProjectUpdated(updated);
      setDevOpen(false);
    });
  }

  async function savePreviewItem(previewItemId: number | null) {
    if (!mockup || !detailPage) return;
    await run(async () => {
      await updateNocWebProjectMockup(organizationId, project.id, mockup.id, {
        previewItemId,
        previewPageId: detailPage.id
      });
    });
  }

  async function saveMockup(patch: {
    visualDirection?: MockupVisualDirection;
    designTokens?: MockupDesignTokens;
    headerVariant?: string;
    footerVariant?: string;
    internalNotes?: string;
  }) {
    if (!mockup) return;
    await run(async () => {
      await updateNocWebProjectMockup(organizationId, project.id, mockup.id, patch);
    });
  }

  async function saveSection(
    section: WebProjectMockupSection,
    patch: Partial<WebProjectMockupSection>
  ) {
    await run(async () => {
      await updateNocMockupSection(organizationId, project.id, section.id, patch);
    });
  }

  const canSend =
    mockup && ["DRAFT", "INTERNAL_REVIEW"].includes(mockup.status) && validation?.state !== "INVALID";
  const canInternalReview = mockup?.status === "DRAFT" && validation?.state !== "INVALID";
  const canRevision =
    mockup && REVISION_BASE_STATUSES.has(mockup.status) && project.workflowStatus === "MOCKUP";
  const canStartDev =
    mockup?.status === "APPROVED" && project.workflowStatus === "MOCKUP" && !project.archivedAt;

  return (
    <section className="noc-panel noc-mockup" id="noc-maqueta">
      <div className="noc-panel__head">
        <h2>Maqueta</h2>
        {mockup ? (
          <span className="noc-badge">
            v{mockup.version} · {mockupStatusLabel(mockup.status)} ·{" "}
            {mockupValidationLabel(validation?.state)}
          </span>
        ) : null}
      </div>
      <div className="noc-panel__body">
        {loading ? <p>Cargando maqueta…</p> : null}
        {error ? (
          <p className="noc-error" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !mockup && project.workflowStatus === "MOCKUP" && !project.archivedAt ? (
          <div className="noc-mockup-empty">
            <p>Todavía no hay una maqueta para este proyecto.</p>
            <button type="button" className="noc-btn" disabled={busy} onClick={() => void onGenerate()}>
              Generar maqueta desde arquitectura
            </button>
          </div>
        ) : null}

        {!loading && !mockup && project.workflowStatus !== "MOCKUP" ? (
          <p className="noc-disclaimer">La maqueta estará disponible cuando el proyecto entre en fase Maqueta.</p>
        ) : null}

        {mockup ? (
          <div className="noc-mockup-layout">
            <div className="noc-mockup-toolbar noc-no-print">
              <button type="button" className="noc-btn noc-btn--ghost" disabled={busy} onClick={() => void onValidate()}>
                Validar
              </button>
              {canInternalReview && canEdit ? (
                <button type="button" className="noc-btn noc-btn--ghost" disabled={busy} onClick={() => void onInternalReview()}>
                  Revisión interna
                </button>
              ) : null}
              {canSend ? (
                <button type="button" className="noc-btn" disabled={busy} onClick={() => setSendOpen(true)}>
                  Enviar al cliente
                </button>
              ) : null}
              {canRevision ? (
                <button type="button" className="noc-btn noc-btn--ghost" disabled={busy} onClick={() => void onRevision()}>
                  Nueva revisión
                </button>
              ) : null}
              {canStartDev ? (
                <button type="button" className="noc-btn" disabled={busy} onClick={() => setDevOpen(true)}>
                  Iniciar desarrollo
                </button>
              ) : null}
            </div>

            {validation ? (
              <div className="noc-mockup-validation" aria-live="polite">
                <strong>{mockupValidationLabel(validation.state)}</strong>
                <span>
                  {validation.metrics.pages} páginas · {validation.metrics.sections} secciones
                </span>
                {validation.errors.length > 0 ? (
                  <ul className="noc-mockup-errors">
                    {validation.errors.map((item) => (
                      <li key={`${item.code}-${item.message}`}>{item.message}</li>
                    ))}
                  </ul>
                ) : null}
                {validation.warnings.length > 0 ? (
                  <ul className="noc-mockup-warnings">
                    {validation.warnings.map((item) => (
                      <li key={`${item.code}-${item.message}`}>{item.message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="noc-mockup-grid">
              <div className="noc-mockup-nav">
                <h3>Páginas</h3>
                <ul className="noc-mockup-nav-list">
                  {pages.map((page) => (
                    <li key={page.id}>
                      <button
                        type="button"
                        className={selectedPageId === page.id ? "is-active" : ""}
                        onClick={() => {
                          setSelectedPageId(page.id);
                          setSelectedSectionId(null);
                        }}
                      >
                        <span>{page.title}</span>
                        <span className="noc-mockup-meta">{page.route}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {selectedPage ? (
                  <>
                    <h4>Secciones</h4>
                    <ul className="noc-mockup-section-list">
                      {sections.map((section) => (
                        <li key={section.id}>
                          <button
                            type="button"
                            className={selectedSectionId === section.id ? "is-active" : ""}
                            onClick={() => setSelectedSectionId(section.id)}
                          >
                            {mockupSectionLabel(section.sectionType)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>

              <div className="noc-mockup-preview-wrap">
                {detailPage ? (
                  <div className="noc-mockup-preview-selector noc-no-print">
                    <label htmlFor="mockup-preview-item">Preview</label>
                    {compatiblePreviewItems.length > 0 ? (
                      <select
                        id="mockup-preview-item"
                        className="noc-mockup-preview-select"
                        value={activePreviewItem?.id ?? ""}
                        disabled={!canEdit || busy}
                        onChange={(e) => {
                          const next = e.target.value ? Number(e.target.value) : null;
                          void savePreviewItem(next);
                        }}
                      >
                        <option value="">Seleccionar item…</option>
                        {compatiblePreviewItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="noc-disclaimer" id="mockup-preview-item">
                        No hay contenido disponible para previsualizar esta plantilla.
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="noc-mockup-viewports noc-no-print" role="tablist" aria-label="Viewport">
                  {(["desktop", "tablet", "mobile"] as Viewport[]).map((vp) => (
                    <button
                      key={vp}
                      type="button"
                      role="tab"
                      aria-selected={viewport === vp}
                      className={viewport === vp ? "is-active" : ""}
                      onClick={() => setViewport(vp)}
                    >
                      {vp === "desktop" ? "Escritorio" : vp === "tablet" ? "Tablet" : "Móvil"}
                      <span className="noc-mockup-meta">{VIEWPORT_WIDTH[vp]}px</span>
                    </button>
                  ))}
                </div>
                <div className="noc-mockup-preview-stage">
                  <div
                    className="noc-mockup-preview"
                    style={{ ...previewStyle, width: `${VIEWPORT_WIDTH[viewport]}px`, maxWidth: "100%" }}
                  >
                    {selectedPage ? (
                      <>
                        <header className="noc-mockup-preview__chrome">
                          {selectedPage.title} · {selectedPage.route}
                          {activePreviewItem ? (
                            <span className="noc-mockup-preview__sample">
                              Preview: {activePreviewItem.title}
                            </span>
                          ) : null}
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
              </div>

              <div className="noc-mockup-props">
                <h3>Propiedades</h3>
                {selectedSection ? (
                  <SectionEditor
                    section={selectedSection}
                    canEdit={canEdit}
                    busy={busy}
                    onSave={(patch) => void saveSection(selectedSection, patch)}
                  />
                ) : (
                  <MockupEditor
                    mockup={mockup}
                    canEdit={canEdit}
                    busy={busy}
                    onSave={(patch) => void saveMockup(patch)}
                  />
                )}
              </div>
            </div>

            {payload?.versions && payload.versions.length > 1 ? (
              <div className="noc-mockup-history">
                <h3>Historial</h3>
                <ul>
                  {payload.versions.map((v) => (
                    <li key={v.id}>
                      v{v.version} — {mockupStatusLabel(v.status)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {sendOpen && mockup ? (
          <dialog open className="noc-dialog" aria-labelledby="send-mockup-title">
            <h3 id="send-mockup-title">Enviar maqueta al cliente</h3>
            <p>
              v{mockup.version} · {mockupValidationLabel(validation?.state)}
            </p>
            {validation?.warnings.length ? (
              <ul>
                {validation.warnings.map((w) => (
                  <li key={w.message}>{w.message}</li>
                ))}
              </ul>
            ) : null}
            <div className="noc-dialog-actions">
              <button type="button" className="noc-btn noc-btn--ghost" onClick={() => setSendOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="noc-btn"
                disabled={busy}
                onClick={() =>
                  void onSendClient(validation?.state === "READY_WITH_WARNINGS")
                }
              >
                Confirmar envío
              </button>
            </div>
          </dialog>
        ) : null}

        {devOpen && mockup ? (
          <dialog open className="noc-dialog" aria-labelledby="dev-mockup-title">
            <h3 id="dev-mockup-title">Iniciar desarrollo</h3>
            <p>
              Maqueta v{mockup.version} aprobada. El proyecto pasará a fase Desarrollo.
            </p>
            <div className="noc-dialog-actions">
              <button type="button" className="noc-btn noc-btn--ghost" onClick={() => setDevOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="noc-btn" disabled={busy} onClick={() => void onStartDevelopment()}>
                Confirmar
              </button>
            </div>
          </dialog>
        ) : null}
      </div>
    </section>
  );
}

function MockupEditor({
  mockup,
  canEdit,
  busy,
  onSave
}: {
  mockup: NonNullable<WebProjectMockupPayload["mockup"]>;
  canEdit: boolean;
  busy: boolean;
  onSave: (patch: {
    visualDirection?: MockupVisualDirection;
    designTokens?: MockupDesignTokens;
    headerVariant?: string;
    footerVariant?: string;
    internalNotes?: string;
  }) => void;
}) {
  const vd = mockup.visualDirection || {};
  const tokens = mockup.designTokens || {};
  const [primaryColor, setPrimaryColor] = useState(tokens.colors?.primary || "#1a365d");
  const [tone, setTone] = useState(String(vd.tone || ""));
  const [headerVariant, setHeaderVariant] = useState(mockup.headerVariant || "STANDARD");
  const [footerVariant, setFooterVariant] = useState(mockup.footerVariant || "STANDARD");
  const [internalNotes, setInternalNotes] = useState(mockup.internalNotes || "");

  useEffect(() => {
    setPrimaryColor(tokens.colors?.primary || "#1a365d");
    setTone(String(vd.tone || ""));
    setHeaderVariant(mockup.headerVariant || "STANDARD");
    setFooterVariant(mockup.footerVariant || "STANDARD");
    setInternalNotes(mockup.internalNotes || "");
  }, [mockup.id, tokens.colors?.primary, vd.tone, mockup.headerVariant, mockup.footerVariant, mockup.internalNotes]);

  return (
    <form
      className="noc-mockup-form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSave({
          visualDirection: { ...vd, tone: tone || vd.tone },
          designTokens: {
            ...tokens,
            colors: { ...tokens.colors, primary: primaryColor }
          },
          headerVariant,
          footerVariant,
          internalNotes: internalNotes.trim() || undefined
        });
      }}
    >
      <p className="noc-disclaimer">
        Dirección visual: {vd.source === "CLIENT_BRAND" ? "Marca del cliente" : "Propuesta ARGOS"}
      </p>
      {vd.logo?.label ? <p>Logo: {vd.logo.label}</p> : null}
      <label>
        Tono de marca
        <input value={tone} disabled={!canEdit || busy} onChange={(e) => setTone(e.target.value)} />
      </label>
      <label>
        Color primario
        <input
          type="color"
          value={primaryColor}
          disabled={!canEdit || busy}
          onChange={(e) => setPrimaryColor(e.target.value)}
        />
      </label>
      <label>
        Variante cabecera
        <select value={headerVariant} disabled={!canEdit || busy} onChange={(e) => setHeaderVariant(e.target.value)}>
          {["STANDARD", "MINIMAL", "EXPANDED"].map((value) => (
            <option key={value} value={value}>
              {mockupVariantLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Variante pie
        <select value={footerVariant} disabled={!canEdit || busy} onChange={(e) => setFooterVariant(e.target.value)}>
          {["STANDARD", "MINIMAL", "EXPANDED"].map((value) => (
            <option key={value} value={value}>
              {mockupVariantLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notas internas
        <textarea
          value={internalNotes}
          disabled={!canEdit || busy}
          rows={3}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
      </label>
      {canEdit ? (
        <button type="submit" className="noc-btn" disabled={busy}>
          Guardar dirección visual
        </button>
      ) : null}
    </form>
  );
}

function SectionEditor({
  section,
  canEdit,
  busy,
  onSave
}: {
  section: WebProjectMockupSection;
  canEdit: boolean;
  busy: boolean;
  onSave: (patch: Partial<WebProjectMockupSection>) => void;
}) {
  const [variant, setVariant] = useState(section.variant);
  const [alignment, setAlignment] = useState(section.alignment);
  const [density, setDensity] = useState(section.density);
  const [placeholderText, setPlaceholderText] = useState(section.placeholderText || "");

  useEffect(() => {
    setVariant(section.variant);
    setAlignment(section.alignment);
    setDensity(section.density);
    setPlaceholderText(section.placeholderText || "");
  }, [section]);

  const variantOptions = useMemo(() => {
    const base = ["DEFAULT", "STANDARD", "CENTERED", "CARDS", "BANNER", "INLINE", "LIST", "GRID", "SPLIT"];
    if (!base.includes(variant)) return [...base, variant];
    return base;
  }, [variant]);

  return (
    <form
      className="noc-mockup-form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSave({ variant, alignment, density, placeholderText: placeholderText || null });
      }}
    >
      <p>
        <strong>{mockupSectionLabel(section.sectionType)}</strong>
      </p>
      <label>
        Variante
        <select value={variant} disabled={!canEdit || busy} onChange={(e) => setVariant(e.target.value)}>
          {variantOptions.map((value) => (
            <option key={value} value={value}>
              {mockupVariantLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Alineación
        <select value={alignment} disabled={!canEdit || busy} onChange={(e) => setAlignment(e.target.value)}>
          {["LEFT", "CENTER", "RIGHT"].map((value) => (
            <option key={value} value={value}>
              {mockupAlignmentLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Densidad
        <select value={density} disabled={!canEdit || busy} onChange={(e) => setDensity(e.target.value)}>
          {["COMPACT", "NORMAL", "SPACIOUS"].map((value) => (
            <option key={value} value={value}>
              {mockupDensityLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Texto placeholder
        <textarea
          value={placeholderText}
          disabled={!canEdit || busy}
          rows={3}
          onChange={(e) => setPlaceholderText(e.target.value)}
        />
      </label>
      {canEdit ? (
        <button type="submit" className="noc-btn" disabled={busy}>
          Guardar sección
        </button>
      ) : null}
    </form>
  );
}
