"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import API from "@/lib/api";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useAuthStore } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Locale = "es" | "en" | "ca";

type PortalUser = {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  created_at?: string;
  role: string;
  clientVerified: boolean;
};

type AuditCheck = { label: string; status: string; priority?: string };

type WebsiteAudit = {
  status: string;
  score: number | null;
  reviewedAt: string | null;
  websiteUrl: string | null;
  checks: AuditCheck[];
};

type ArgosDiagnosticListItem = {
  id: number;
  score: number;
  max_score: number;
  risk_level: string;
  risk_label: string;
  summary_preview: string;
  created_at: string;
};

type DiagnosticDetailResponse = {
  id: string;
  createdAt: string;
  source: string;
  score: number;
  maxScore: number;
  riskLevel: string;
  riskLabel: string;
  summary: string;
  strengths: string[];
  risks: string[];
  priorities: string[];
  answers: { questionId: string; question: string; answerLabel: string; riskPoints: number }[];
};

type ClientPortalPayload = {
  user: PortalUser;
  roles: string[];
  clientVerified: boolean;
  companyProfile: {
    name: string;
    contactEmail: string;
    status: string;
    nextStep: string;
  };
  activeServices: { slug: string; name: string; status: string; startedAt?: string | null }[];
  websiteAudit: WebsiteAudit;
  suggestedImprovements: string[];
  improvementPanel: { statusOptions: string[]; fields: string[] };
  messages: unknown[];
  submissions: { id: number; data: Record<string, unknown>; status: string; created_at: string }[];
  activity: unknown[];
  argosDiagnostics?: ArgosDiagnosticListItem[];
};

const copy = {
  es: {
    portal: "Portal de cliente",
    subtitle: "Administra tu cuenta, revisa mejoras y envía nuevas necesidades técnicas.",
    logout: "Cerrar sesión",
    verified: "Cuenta verificada",
    pendingVerification: "Verificación pendiente",
    company: "Empresa",
    website: "Visualización web",
    score: "Puntuación operativa",
    improvements: "Mejoras previstas",
    improvementForm: "Enviar mejora o idea",
    direct: "Mensajería directa",
    send: "Enviar",
    title: "Título",
    message: "Mensaje",
    category: "Necesidad",
    priority: "Prioridad",
    page: "Página o URL afectada",
    subject: "Asunto",
    urgency: "Urgencia",
    recent: "Solicitudes recientes",
    empty: "Aún no hay solicitudes registradas.",
    saved: "Enviado correctamente",
    noAuditChecks: "Aún no hay comprobaciones de auditoría. Cuando exista una auditoría en sistema, aparecerán aquí.",
    noImprovementsList: "No hay mejoras pendientes registradas en base de datos.",
    kindImprovement: "Solicitud de mejora",
    kindMessage: "Mensaje directo",
    kindGeneric: "Solicitud",
    previewNone: "Sin detalle de texto.",
    diagTitle: "Diagnósticos ARGOS",
    diagEmpty: "Aún no hay diagnósticos guardados.",
    diagDate: "Fecha",
    diagRisk: "Nivel de riesgo",
    diagScore: "Puntuación",
    diagSummary: "Resumen",
    diagDetail: "Ver detalle",
    diagHide: "Ocultar detalle",
    diagDetailLoad: "Cargando detalle…",
    diagAnswers: "Respuestas enviadas",
    diagPriorities: "Prioridades",
    diagRisksTitle: "Riesgos detectados",
    diagStrengthsTitle: "Puntos fuertes"
  },
  en: {
    portal: "Client portal",
    subtitle: "Manage your account, review improvements and send technical needs.",
    logout: "Sign out",
    verified: "Verified account",
    pendingVerification: "Verification pending",
    company: "Company",
    website: "Website overview",
    score: "Operational score",
    improvements: "Planned improvements",
    improvementForm: "Send improvement or idea",
    direct: "Direct messaging",
    send: "Send",
    title: "Title",
    message: "Message",
    category: "Need",
    priority: "Priority",
    page: "Affected page or URL",
    subject: "Subject",
    urgency: "Urgency",
    recent: "Recent requests",
    empty: "No requests yet.",
    saved: "Sent successfully",
    noAuditChecks: "No audit checks yet. They will appear here once a website audit exists in the system.",
    noImprovementsList: "No pending improvements in the database.",
    kindImprovement: "Improvement request",
    kindMessage: "Direct message",
    kindGeneric: "Request",
    previewNone: "No text detail.",
    diagTitle: "ARGOS diagnostics",
    diagEmpty: "No saved diagnostics yet.",
    diagDate: "Date",
    diagRisk: "Risk level",
    diagScore: "Score",
    diagSummary: "Summary",
    diagDetail: "View detail",
    diagHide: "Hide detail",
    diagDetailLoad: "Loading detail…",
    diagAnswers: "Answers submitted",
    diagPriorities: "Priorities",
    diagRisksTitle: "Detected risks",
    diagStrengthsTitle: "Strengths"
  },
  ca: {
    portal: "Portal de client",
    subtitle: "Administra el compte, revisa millores i envia necessitats tecniques.",
    logout: "Tancar sessio",
    verified: "Compte verificat",
    pendingVerification: "Verificacio pendent",
    company: "Empresa",
    website: "Visualitzacio web",
    score: "Puntuacio operativa",
    improvements: "Millores previstes",
    improvementForm: "Enviar millora o idea",
    direct: "Missatgeria directa",
    send: "Enviar",
    title: "Titol",
    message: "Missatge",
    category: "Necessitat",
    priority: "Prioritat",
    page: "Pagina o URL afectada",
    subject: "Assumpte",
    urgency: "Urgencia",
    recent: "Sol.licituds recents",
    empty: "Encara no hi ha sol.licituds registrades.",
    saved: "Enviat correctament",
    noAuditChecks: "Encara no hi ha comprovacions d'auditoria.",
    noImprovementsList: "No hi ha millores pendents a la base de dades.",
    kindImprovement: "Sol.licitud de millora",
    kindMessage: "Missatge directe",
    kindGeneric: "Sol.licitud",
    previewNone: "Sense text de detall.",
    diagTitle: "Diagnostics ARGOS",
    diagEmpty: "Encara no hi ha diagnostics guardats.",
    diagDate: "Data",
    diagRisk: "Nivell de risc",
    diagScore: "Puntuacio",
    diagSummary: "Resum",
    diagDetail: "Veure detall",
    diagHide: "Ocultar detall",
    diagDetailLoad: "Carregant detall…",
    diagAnswers: "Respostes enviades",
    diagPriorities: "Prioritats",
    diagRisksTitle: "Riscos detectats",
    diagStrengthsTitle: "Punts forts"
  }
};

const categories = [
  "Seguridad informática",
  "Soporte técnico",
  "WordPress / Hosting",
  "Automatización con IA",
  "SEO y captación",
  "Nueva funcionalidad"
];

function diagRiskChipTone(level: string) {
  switch (level) {
    case "low":
      return "border-emerald-300 bg-emerald-50 text-emerald-950";
    case "medium":
      return "border-amber-300 bg-amber-50 text-amber-950";
    case "high":
      return "border-orange-400 bg-orange-50 text-orange-950";
    case "critical":
      return "border-red-400 bg-red-50 text-red-950";
    default:
      return "border-slate-200 bg-slate-100 text-slate-900";
  }
}

export default function Dashboard() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [locale, setLocale] = useState<Locale>("es");
  const [portal, setPortal] = useState<ClientPortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [improvement, setImprovement] = useState({
    category: categories[0],
    priority: "Media",
    pageUrl: "",
    title: "",
    message: ""
  });
  const [directMessage, setDirectMessage] = useState({
    subject: "",
    urgency: "Normal",
    message: ""
  });

  const [diagExpandedId, setDiagExpandedId] = useState<number | null>(null);
  const [diagDetailData, setDiagDetailData] = useState<DiagnosticDetailResponse | null>(null);
  const [diagLoadingId, setDiagLoadingId] = useState<number | null>(null);

  const t = copy[locale];

  const submissionKind = (data: Record<string, unknown>) => {
    const type = String(data?.type || "");
    if (type === "improvement_request") return t.kindImprovement;
    if (type === "direct_message") return t.kindMessage;
    return t.kindGeneric;
  };

  const submissionTitleLine = (data: Record<string, unknown>) => {
    const raw = data?.title ?? data?.subject;
    const s = String(raw || "").trim();
    return s || submissionKind(data);
  };

  const submissionPreview = (data: Record<string, unknown>) => {
    const msg = data?.message;
    if (typeof msg === "string" && msg.trim()) {
      const s = msg.trim();
      return s.length > 160 ? `${s.slice(0, 160)}…` : s;
    }
    return t.previewNone;
  };

  useEffect(() => {
    const language = navigator.language.toLowerCase();
    if (language.startsWith("ca")) setLocale("ca");
    else if (language.startsWith("en")) setLocale("en");
    else setLocale("es");
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    fetchPortal();
  }, [token]);

  const fetchPortal = async () => {
    try {
      const res = await API.get<ClientPortalPayload>("/api/client/portal");
      setPortal(res.data);
    } catch (error) {
      toast.error("No se pudo cargar el portal");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const auditChecks = useMemo(() => portal?.websiteAudit?.checks || [], [portal]);
  const isVerified =
    Boolean(portal?.user?.clientVerified) || Boolean(user?.clientVerified);
  const scoreLabel =
    portal?.websiteAudit?.score != null && !Number.isNaN(portal.websiteAudit.score)
      ? `${portal.websiteAudit.score}/100`
      : "—";

  const submitImprovement = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await API.post("/api/client/improvements", improvement);
      toast.success(t.saved);
      setImprovement({
        category: categories[0],
        priority: "Media",
        pageUrl: "",
        title: "",
        message: ""
      });
      fetchPortal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "No se pudo enviar la mejora");
    }
  };

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await API.post("/api/client/messages", directMessage);
      toast.success(t.saved);
      setDirectMessage({ subject: "", urgency: "Normal", message: "" });
      fetchPortal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "No se pudo enviar el mensaje");
    }
  };

  const argosDiagList = portal?.argosDiagnostics ?? [];

  const toggleDiagDetail = async (id: number) => {
    if (diagExpandedId === id) {
      setDiagExpandedId(null);
      setDiagDetailData(null);
      return;
    }
    setDiagLoadingId(id);
    try {
      const res = await API.get<DiagnosticDetailResponse>(`/api/client/diagnostics/${id}`);
      setDiagDetailData(res.data);
      setDiagExpandedId(id);
    } catch {
      toast.error("No se pudo cargar el detalle del diagnóstico.");
    } finally {
      setDiagLoadingId(null);
    }
  };

  if (loading) {
    return (
      <ArgosPageShell variant="portal">
        <div className="p-8 text-white">Cargando portal...</div>
      </ArgosPageShell>
    );
  }

  return (
    <ArgosPageShell variant="portal">
      <header className="border-b border-white/10 bg-white/[.08] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-[#39F4FF]">ARGOS-IT</p>
            <h1 className="text-3xl font-black text-white">{t.portal}</h1>
            <p className="text-[#D7E8F6]">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-bold text-[#07111F]"
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
              <option value="ca">CA</option>
            </select>
            <span
              className={
                isVerified
                  ? "rounded-md border border-[#18D4F7]/40 bg-[#18D4F7]/10 px-3 py-2 text-sm font-bold text-[#39F4FF]"
                  : "rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm font-bold text-amber-200"
              }
            >
              {isVerified ? t.verified : t.pendingVerification}
            </span>
            <button onClick={handleLogout} className="rounded-md border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8]">
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-black uppercase text-[#2563EB]">{t.company}</p>
              <h2 className="mt-1 text-2xl font-black">{portal?.user?.company || user?.company || "Empresa pendiente"}</h2>
              <p className="text-[#4B5563]">{portal?.user?.email || user?.email}</p>
            </div>
            <div className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-right">
              <p className="text-sm font-bold text-[#2563EB]">{t.score}</p>
              <strong className="text-3xl">{scoreLabel}</strong>
            </div>
          </div>

          <div className="mt-7">
            <h3 className="text-xl font-black">{t.website}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {auditChecks.length === 0 ? (
                <p className="col-span-full text-sm text-[#4B5563]">{t.noAuditChecks}</p>
              ) : (
                auditChecks.map((check) => (
                  <div key={check.label} className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                    <p className="font-bold">{check.label}</p>
                    <p className="text-sm text-[#4B5563]">{check.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-7">
            <h3 className="text-xl font-black">{t.improvements}</h3>
            <div className="mt-4 grid gap-3">
              {(portal?.suggestedImprovements || []).length === 0 ? (
                <p className="text-sm text-[#4B5563]">{t.noImprovementsList}</p>
              ) : (
                (portal?.suggestedImprovements || []).map((item: string) => (
                  <div key={item} className="border-l-4 border-[#2563EB] bg-[#F9FAFB] p-4 font-semibold text-[#111827]">
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">{t.improvementForm}</h2>
          <form onSubmit={submitImprovement} className="mt-5 space-y-4">
            <label className="block text-sm font-bold">
              {t.category}
              <select
                value={improvement.category}
                onChange={(event) => setImprovement({ ...improvement, category: event.target.value })}
                className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
              >
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                {t.priority}
                <select
                  value={improvement.priority}
                  onChange={(event) => setImprovement({ ...improvement, priority: event.target.value })}
                  className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
                >
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </select>
              </label>
              <label className="block text-sm font-bold">
                {t.page}
                <input
                  value={improvement.pageUrl}
                  onChange={(event) => setImprovement({ ...improvement, pageUrl: event.target.value })}
                  className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
                  placeholder="https://..."
                />
              </label>
            </div>
            <label className="block text-sm font-bold">
              {t.title}
              <input
                required
                value={improvement.title}
                onChange={(event) => setImprovement({ ...improvement, title: event.target.value })}
                className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
                placeholder="Ej. Mejorar formulario de contacto"
              />
            </label>
            <label className="block text-sm font-bold">
              {t.message}
              <textarea
                required
                rows={5}
                value={improvement.message}
                onChange={(event) => setImprovement({ ...improvement, message: event.target.value })}
                className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
                placeholder="Describe la necesidad, objetivo y cualquier referencia."
              />
            </label>
            <button className="w-full rounded-md border border-[#2563EB] bg-[#2563EB] px-5 py-3 font-black text-white transition hover:bg-[#1D4ED8]" type="submit">
              {t.send}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">{t.direct}</h2>
          <p className="mt-2 text-[#4B5563]">
            Canal para clientes autenticados. Los mensajes quedan registrados y se notifican al correo de servicio si Formspree está activo.
          </p>
          <form onSubmit={submitMessage} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                {t.subject}
                <input
                  required
                  value={directMessage.subject}
                  onChange={(event) => setDirectMessage({ ...directMessage, subject: event.target.value })}
                  className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
                />
              </label>
              <label className="block text-sm font-bold">
                {t.urgency}
                <select
                  value={directMessage.urgency}
                  onChange={(event) => setDirectMessage({ ...directMessage, urgency: event.target.value })}
                  className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
                >
                  <option>Normal</option>
                  <option>Alta</option>
                  <option>Incidencia critica</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-bold">
              {t.message}
              <textarea
                required
                rows={5}
                value={directMessage.message}
                onChange={(event) => setDirectMessage({ ...directMessage, message: event.target.value })}
                className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-3"
              />
            </label>
            <button className="w-full rounded-md border border-[#2563EB] bg-transparent px-5 py-3 font-black text-[#2563EB] transition hover:bg-[#EFF6FF]" type="submit">
              {t.send}
            </button>
          </form>
        </section>

        <section className="lg:col-span-2 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">{t.diagTitle}</h2>
          <div className="mt-5 space-y-4">
            {argosDiagList.length === 0 ? (
              <p className="text-sm font-semibold text-[#4B5563]">{t.diagEmpty}</p>
            ) : (
              argosDiagList.map((row) => (
                <div key={row.id} className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                        {t.diagDate}: {new Date(row.created_at).toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex rounded-md border px-3 py-1 text-xs font-black ${diagRiskChipTone(row.risk_level)}`}
                      >
                        {row.risk_label}
                      </span>
                      <p className="pt-2 text-sm font-black text-[#111827]">
                        {t.diagScore}: {row.score}/{row.max_score}
                      </p>
                      <p className="mt-2 text-sm text-[#4B5563]">
                        <span className="font-bold">{t.diagSummary}:</span> {row.summary_preview}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleDiagDetail(row.id)}
                      className="shrink-0 rounded-md border border-[#2563EB] px-4 py-2 text-sm font-black text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      {diagExpandedId === row.id ? t.diagHide : t.diagDetail}
                    </button>
                  </div>
                  {diagLoadingId === row.id && (
                    <p className="mt-4 text-xs font-semibold text-[#2563EB]">{t.diagDetailLoad}</p>
                  )}
                  {diagExpandedId === row.id && diagDetailData && diagDetailData.id === String(row.id) && (
                    <div className="mt-5 space-y-5 border-t border-[#E5E7EB] pt-5">
                      <p className="text-sm font-semibold leading-relaxed text-[#111827]">{diagDetailData.summary}</p>
                      <div className="grid gap-5 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-800">{t.diagStrengthsTitle}</p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#374151]">
                            {diagDetailData.strengths.slice(0, 15).map((line, index) => (
                              <li key={`st-${index}-${String(line).slice(0, 40)}`}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-orange-900">{t.diagRisksTitle}</p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#92400e]">
                            {(diagDetailData.risks || []).slice(0, 15).map((line, index) => (
                              <li key={`rk-${index}-${String(line).slice(0, 40)}`}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-cyan-950">{t.diagPriorities}</p>
                          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm font-semibold text-[#374151]">
                            {diagDetailData.priorities.slice(0, 15).map((line, index) => (
                              <li key={`pr-${index}-${String(line).slice(0, 40)}`}>{line}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-800">{t.diagAnswers}</p>
                        <ul className="mt-3 space-y-2 text-sm text-[#374151]">
                          {diagDetailData.answers.map((a) => (
                            <li key={a.questionId} className="rounded border border-[#E5E7EB] bg-white px-3 py-2">
                              <p className="font-bold">{a.question}</p>
                              <p className="text-xs font-semibold text-[#2563EB]">
                                {a.answerLabel}{" "}
                                <span className="text-[#6B7280]">({a.riskPoints} pts de riesgo)</span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">{t.recent}</h2>
          <div className="mt-5 space-y-3">
            {portal?.submissions?.length ? (
              portal.submissions.map((submission) => (
                <div key={submission.id} className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#2563EB]">
                    {submissionKind(submission.data)}
                  </p>
                  <p className="mt-1 font-bold text-[#111827]">{submissionTitleLine(submission.data)}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-[#4B5563]">{submissionPreview(submission.data)}</p>
                  <p className="mt-2 text-xs font-semibold text-[#6B7280]">
                    {submission.status} · {new Date(submission.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[#4B5563]">{t.empty}</p>
            )}
          </div>
        </section>
      </main>
    </ArgosPageShell>
  );
}
