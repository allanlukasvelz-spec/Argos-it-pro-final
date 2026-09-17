"use client";

import { FormEvent, useState } from "react";
import { NocEmpty } from "@/components/noc/NocUi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { downloadNocWebProjectDocument, uploadNocWebProjectDocument } from "@/lib/nocApi";
import { clientFileRejection, DOCUMENT_ACCEPT, formatBytes, isSvgDocument } from "@/lib/webProjects/documents";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import { uploadStatusLabel } from "@/lib/webProjects/labels";
import { matchesNocReviewFilter, nocReviewMutationLocked, reviewStateForDocument } from "@/lib/webProjects/viewModel";
import type { WebProject, WebProjectDocument } from "@/lib/webProjects/types";
import { NocReviewActions } from "./NocReviewActions";

export function NocWebProjectDocuments({
  organizationId,
  project,
  documents,
  filter = "ALL",
  onReload,
  onUpdated
}: {
  organizationId: number;
  project: WebProject;
  documents: WebProjectDocument[];
  filter?: "ALL" | "PENDING" | "APPROVED" | "CORRECTION_REQUIRED";
  onReload: () => Promise<void>;
  onUpdated: (project: WebProject) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canUpload = !nocReviewMutationLocked(project);

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
    try {
      await uploadNocWebProjectDocument(organizationId, project.id, file);
      setStatus("Documento guardado.");
      e.currentTarget.reset();
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
      const { blob, filename } = await downloadNocWebProjectDocument(organizationId, project.id, doc.id);
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
    <section className="noc-panel">
      <div className="noc-panel__head">Documentos</div>
      <div className="noc-panel__body">
        <p className="noc-disclaimer">Máximo 20 MB. SVG se descarga como adjunto; no se incrusta.</p>
        {canUpload ? (
          <form className="noc-form" onSubmit={onUpload}>
            <label>
              Añadir archivo
              <input name="file" type="file" accept={DOCUMENT_ACCEPT} />
            </label>
            <button type="submit" className="noc-btn noc-btn--primary" disabled={busy}>
              {busy ? "Subiendo…" : "Subir"}
            </button>
          </form>
        ) : (
          <p className="noc-disclaimer">Solo lectura / descarga (finalizado o archivado).</p>
        )}
        {status ? <p className="noc-disclaimer">{status}</p> : null}
        {error ? (
          <p className="noc-disclaimer" role="alert">
            {error}
          </p>
        ) : null}
        {documents.length === 0 ? (
          <NocEmpty title="Sin documentos." />
        ) : (
          <ul className="noc-stack">
            {documents
              .filter((doc) =>
                matchesNocReviewFilter(reviewStateForDocument(project, doc.id) || { status: "PENDING" }, filter)
              )
              .map((doc) => (
              <li key={doc.id} className="noc-doc">
                <div>
                  <strong>
                    {isSvgDocument(doc.mimeType, doc.originalFilename) ? "SVG · " : ""}
                    {doc.originalFilename}
                  </strong>
                  <p className="noc-disclaimer">
                    {doc.mimeType} · {formatBytes(Number(doc.byteLength))} · {uploadStatusLabel(doc.uploadStatus)}
                    {doc.storedAt ? ` · ${relativeTimeEs(doc.storedAt)}` : ""}
                    {doc.scanStatus === "SCAN_NOT_AVAILABLE"
                      ? " · Análisis antimalware no disponible"
                      : ""}
                    {doc.replacesDocumentId ? " · Reemplazo" : ""}
                  </p>
                  <NocReviewActions
                    organizationId={organizationId}
                    project={project}
                    state={reviewStateForDocument(project, doc.id)}
                    targetType="DOCUMENT"
                    targetId={doc.id}
                    onUpdated={onUpdated}
                  />
                </div>
                <button type="button" className="noc-btn" onClick={() => void onDownload(doc)}>
                  Descargar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
