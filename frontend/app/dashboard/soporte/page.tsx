"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader
} from "@/components/client/Status";
import { fetchPortal, postImprovement, postMessage } from "@/lib/clientApi";
import type { ClientPortalPayload } from "@/lib/clientTypes";
import { relativeTimeEs } from "@/lib/clientCopy";

export default function SoportePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [portal, setPortal] = useState<ClientPortalPayload | null>(null);
  const [imp, setImp] = useState({ category: "Soporte", title: "", message: "", priority: "Media", page: "" });
  const [msg, setMsg] = useState({ subject: "", message: "", urgency: "Normal" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPortal(await fetchPortal());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onImprovement(e: FormEvent) {
    e.preventDefault();
    try {
      await postImprovement({
        type: "improvement_request",
        category: imp.category,
        title: imp.title,
        message: imp.message,
        priority: imp.priority,
        page: imp.page
      });
      toast.success("Mejora enviada.");
      setImp({ category: "Soporte", title: "", message: "", priority: "Media", page: "" });
      await load();
    } catch {
      toast.error("No se pudo enviar la mejora.");
    }
  }

  async function onMessage(e: FormEvent) {
    e.preventDefault();
    try {
      await postMessage({
        type: "direct_message",
        subject: msg.subject,
        message: msg.message,
        urgency: msg.urgency
      });
      toast.success("Mensaje enviado.");
      setMsg({ subject: "", message: "", urgency: "Normal" });
      await load();
    } catch {
      toast.error("No se pudo enviar el mensaje.");
    }
  }

  if (loading) return <LoadingState label="Cargando soporte…" />;
  if (error || !portal) {
    return <ErrorState title="No se ha podido cargar soporte." onRetry={load} />;
  }

  const submissions = portal.submissions || [];
  const improvements = portal.suggestedImprovements || [];

  return (
    <div>
      <PageHeader
        title="Soporte"
        eyebrow="Contacto"
        meta="Formularios existentes tenant-scoped. No hay plataforma de tickets completa."
      />

      <div className="cp-grid cp-grid--2" style={{ marginBottom: "1rem" }}>
        <form className="cp-card cp-form" onSubmit={onImprovement}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Enviar mejora o idea</h2>
          <label>
            Necesidad
            <select value={imp.category} onChange={(e) => setImp({ ...imp, category: e.target.value })}>
              {["Seguridad", "Soporte", "Web", "Infraestructura", "Otro"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input required value={imp.title} onChange={(e) => setImp({ ...imp, title: e.target.value })} />
          </label>
          <label>
            Mensaje
            <textarea required value={imp.message} onChange={(e) => setImp({ ...imp, message: e.target.value })} />
          </label>
          <label>
            Prioridad
            <select value={imp.priority} onChange={(e) => setImp({ ...imp, priority: e.target.value })}>
              {["Baja", "Media", "Alta"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="cp-btn cp-btn--primary">
            Enviar
          </button>
        </form>

        <form className="cp-card cp-form" onSubmit={onMessage}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Mensajería directa</h2>
          <label>
            Asunto
            <input required value={msg.subject} onChange={(e) => setMsg({ ...msg, subject: e.target.value })} />
          </label>
          <label>
            Mensaje
            <textarea required value={msg.message} onChange={(e) => setMsg({ ...msg, message: e.target.value })} />
          </label>
          <label>
            Urgencia
            <select value={msg.urgency} onChange={(e) => setMsg({ ...msg, urgency: e.target.value })}>
              {["Normal", "Alta", "Urgente"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="cp-btn cp-btn--primary">
            Enviar
          </button>
        </form>
      </div>

      <section className="cp-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Mejoras sugeridas (sistema)</h2>
        {improvements.length === 0 ? (
          <EmptyState title="No hay mejoras pendientes registradas." />
        ) : (
          <ul>
            {improvements.map((t, i) => (
              <li key={`${t}-${i}`}>{t}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="cp-card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Solicitudes recientes</h2>
        {submissions.length === 0 ? (
          <EmptyState title="Aún no hay solicitudes registradas." />
        ) : (
          <ul style={{ paddingLeft: "1.1rem" }}>
            {submissions.map((s) => (
              <li key={s.id}>
                #{s.id} · {s.status} · {relativeTimeEs(s.created_at)} ·{" "}
                {String((s.data as { title?: string; subject?: string })?.title ||
                  (s.data as { subject?: string })?.subject ||
                  "Solicitud")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
