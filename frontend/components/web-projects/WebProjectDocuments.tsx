"use client";

import { FormEvent, useState } from "react";
import { EmptyState } from "@/components/client/Status";
import { downloadWebProjectDocument, replaceWebProjectDocument, uploadWebProjectDocument } from "@/lib/clientApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import {
  DOCUMENT_ACCEPT,
  clientFileRejection,
  formatBytes,
  isSvgDocument
} from "@/lib/webProjects/documents";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { optionLabel } from "@/lib/webProjects/formCopy";
import { uploadStatusLabel } from "@/lib/webProjects/labels";
import { reviewStateForDocument } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectDocument } from "@/lib/webProjects/types";
import { WebProjectReviewStatus } from "./WebProjectReviewStatus";

export function WebProjectDocuments({
  project,
  documents,
  canUpload,
  onReload
}: {
  project: WebProject;
  documents: WebProjectDocument[];
  canUpload: boolean;
  onReload: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    const rejection = clientFileRejection(file);
    if (rejection || !file) {
      setError(rejection || "Selecciona un archivo.");
      setStatus(null);
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Subiendo…");
    const form = e.currentTarget;
    try {
      const category = String((form.elements.namedItem("requirementKey") as HTMLSelectElement | null)?.value || "");
      await uploadWebProjectDocument(project.id, file, category || null);
      form.reset();
      setStatus("Documento guardado.");
      await onReload();
    } catch (err) {
      setStatus(null);
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onReplace(doc: WebProjectDocument, file: File | null) {
    const rejection = clientFileRejection(file);
    if (rejection || !file) {
      setError(rejection || "Selecciona un archivo.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Subiendo nueva versión…");
    try {
      await replaceWebProjectDocument(project.id, doc.id, file);
      setStatus("Nueva versión enviada. Queda pendiente de revisión.");
      setReplacingId(null);
      await onReload();
    } catch (err) {
      setStatus(null);
      setError(webProjectErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload(doc: WebProjectDocument) {
    setError(null);
    try {
      const { blob, filename } = await downloadWebProjectDocument(project.id, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || doc.originalFilename || "documento";
      a.rel = "noopener";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    }
  }

  return (
    <section className="cp-card" aria-labelledby="wp-docs-heading">
      <h2 id="wp-docs-heading" className="wp-section-title">
        Documentación
      </h2>
      <p className="cp-disclaimer">Máximo 20 MB por archivo. PDF, Office, texto e imágenes habituales.</p>
      {canUpload ? (
        <form className="cp-form wp-nested" onSubmit={(e) => void onUpload(e)}>
          <label>
            Añadir archivo
            <input name="file" type="file" accept={DOCUMENT_ACCEPT} disabled={busy} />
          </label>
          <label>
            Categoría
            <select name="requirementKey" defaultValue="">
              <option value="">Sin categoría</option>
              {[
                "LOGO",
                "BRAND_MANUAL",
                "GRAPHIC",
                "TEXT",
                "CATALOG",
                "PRICE_LIST",
                "BROCHURE",
                "PRESENTATION",
                "FAQ",
                "CASE_STUDY",
                "OTHER_CONTENT",
                "TEAM",
                "LOCATION",
                "SERVICE",
                "PRODUCT",
                "TOUR",
                "CORPORATE",
                "VIDEO",
                "LEGAL",
                "OTHER"
              ].map((key) => (
                <option key={key} value={key}>
                  {optionLabel(key)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="cp-btn cp-btn--primary" disabled={busy}>
            {busy ? "Subiendo…" : "Subir documento"}
          </button>
        </form>
      ) : (
        <p className="cp-disclaimer">Puedes descargar los documentos existentes. No puedes subir archivos.</p>
      )}
      {status ? (
        <p className="wp-save" aria-live="polite">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="wp-field-error" role="alert">
          {error}
        </p>
      ) : null}
      {documents.length === 0 ? (
        <EmptyState title="Aún no hay documentos." />
      ) : (
        <ul className="wp-list">
          {documents.map((doc) => {
            const review = reviewStateForDocument(project, doc.id);
            const needsCorrection = review?.status === "CORRECTION_REQUIRED";
            return (
            <li
              key={doc.id}
              id={`wp-doc-${doc.id}`}
              className={needsCorrection ? "wp-list__item wp-field--correction" : "wp-list__item"}
            >
              <div>
                <strong>{doc.originalFilename}</strong>
                <WebProjectReviewStatus state={review} emphasizeCorrection />
                {needsCorrection && review?.correctionMessage ? (
                  <p className="wp-correction-msg" role="status">
                    Mensaje ARGOS: {review.correctionMessage}
                  </p>
                ) : null}
                <p className="cp-disclaimer">
                  {doc.requirementKey ? `${optionLabel(doc.requirementKey)} · ` : ""}
                  {isSvgDocument(doc.mimeType, doc.originalFilename) ? "Imagen vectorial" : doc.mimeType} ·{" "}
                  {formatBytes(doc.byteLength)} · {uploadStatusLabel(doc.uploadStatus)}
                  {doc.storedAt ? ` · ${relativeTimeEs(doc.storedAt)}` : ""}
                  {doc.replacesDocumentId ? " · Nueva versión" : ""}
                </p>
              </div>
              <div className="wp-actions">
              {doc.uploadStatus === "STORED" ? (
                <button type="button" className="cp-btn cp-btn--secondary" onClick={() => void onDownload(doc)}>
                  Descargar
                </button>
              ) : null}
              {canUpload && needsCorrection ? (
                replacingId === doc.id ? (
                  <label>
                    Subir nueva versión
                    <input
                      type="file"
                      accept={DOCUMENT_ACCEPT}
                      disabled={busy}
                      onChange={(e) => void onReplace(doc, e.target.files?.[0] || null)}
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    className="cp-btn cp-btn--primary"
                    onClick={() => setReplacingId(doc.id)}
                  >
                    Subir nueva versión
                  </button>
                )
              ) : null}
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
