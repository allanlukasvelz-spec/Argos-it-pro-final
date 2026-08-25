import API from "@/lib/api";
import type {
  ClientAlert,
  ClientAsset,
  ClientIncident,
  ClientMonitor,
  ClientNotification,
  ClientPortalPayload,
  ClientReport,
  ClientTlsCertificate,
  MonitoringSummary
} from "@/lib/clientTypes";

export async function fetchPortal(): Promise<ClientPortalPayload> {
  const { data } = await API.get<ClientPortalPayload>("/api/client/portal");
  return data;
}

export async function fetchAssets(): Promise<ClientAsset[]> {
  const { data } = await API.get<{ assets: ClientAsset[] }>("/api/client/assets");
  return data.assets || [];
}

export async function fetchTls(): Promise<ClientTlsCertificate[]> {
  const { data } = await API.get<{ certificates: ClientTlsCertificate[] }>("/api/client/tls");
  return data.certificates || [];
}

export async function fetchMonitoring(): Promise<MonitoringSummary> {
  const { data } = await API.get<MonitoringSummary>("/api/client/monitoring");
  return data;
}

export async function fetchMonitors(): Promise<ClientMonitor[]> {
  const { data } = await API.get<{ monitors: ClientMonitor[] }>("/api/client/monitors");
  return data.monitors || [];
}

export async function fetchAlerts(state?: string): Promise<ClientAlert[]> {
  const q = state ? `?state=${encodeURIComponent(state)}` : "";
  const { data } = await API.get<{ alerts: ClientAlert[] }>(`/api/client/alerts${q}`);
  return data.alerts || [];
}

export async function fetchIncidents(): Promise<ClientIncident[]> {
  const { data } = await API.get<{ incidents: ClientIncident[] }>("/api/client/incidents");
  return data.incidents || [];
}

export async function fetchIncident(id: number): Promise<{
  incident: ClientIncident;
  events: { id: number; kind: string; payload: unknown; createdAt: string }[];
}> {
  const { data } = await API.get(`/api/client/incidents/${id}`);
  return data;
}

export async function fetchGuardian(): Promise<{
  chico: {
    role?: string;
    state: string;
    label?: string;
    message: string;
    meta?: Record<string, unknown>;
  };
  agents: { id: number; assetId: number; status: string; lastSeenAt: string | null }[];
  overall: string;
  freshness: string;
}> {
  const { data } = await API.get("/api/client/guardian");
  return data;
}

export async function discoverDomain(hostname: string) {
  const { data } = await API.post("/api/client/domains/discover", { hostname });
  return data;
}

export async function postImprovement(body: Record<string, unknown>) {
  const { data } = await API.post("/api/client/improvements", body);
  return data;
}

export async function postMessage(body: Record<string, unknown>) {
  const { data } = await API.post("/api/client/messages", body);
  return data;
}

export async function fetchReports(): Promise<ClientReport[]> {
  const { data } = await API.get<{ reports: ClientReport[] }>("/api/client/reports");
  return data.reports || [];
}

export async function requestIncidentReport(incidentId: number, idempotencyKey?: string) {
  const { data } = await API.post("/api/client/reports", { incidentId, idempotencyKey });
  return data;
}

export async function downloadReportPdf(reportId: string): Promise<Blob> {
  const { data } = await API.get(`/api/client/reports/${reportId}/content`, {
    responseType: "blob"
  });
  return data as Blob;
}

export async function fetchNotifications(unreadOnly = false): Promise<ClientNotification[]> {
  const q = unreadOnly ? "?unread=1" : "";
  const { data } = await API.get<{ items: ClientNotification[] }>(`/api/client/notifications${q}`);
  return data.items || [];
}

export async function markNotificationRead(id: string) {
  const { data } = await API.patch(`/api/client/notifications/${id}/read`);
  return data;
}

export async function fetchDiagnostic(id: number) {
  const { data } = await API.get(`/api/client/diagnostics/${id}`);
  return data;
}
