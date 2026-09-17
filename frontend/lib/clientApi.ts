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
  MonitoringSummary,
  WebProject,
  WebProjectComment,
  WebProjectDocument,
  WebProjectFormDefinition,
  WebProjectItem
} from "@/lib/clientTypes";
import type { WebProjectMockupPayload } from "@/lib/webProjects/types";

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

export async function fetchWebProjects(): Promise<{
  items: WebProject[];
  formDefinition: WebProjectFormDefinition;
}> {
  const { data } = await API.get<{ items: WebProject[]; formDefinition: WebProjectFormDefinition }>(
    "/api/client/web-projects"
  );
  return { items: data.items || [], formDefinition: data.formDefinition };
}

export async function fetchWebProject(id: number): Promise<WebProject> {
  const { data } = await API.get<{ project: WebProject }>(`/api/client/web-projects/${id}`);
  return data.project;
}

export async function fetchWebProjectForm(id: number): Promise<{
  form: WebProject["form"];
  formDefinition: WebProjectFormDefinition;
  progress: WebProject["progress"];
  sectionProgress?: WebProject["sectionProgress"];
}> {
  const { data } = await API.get<{
    form: WebProject["form"];
    formDefinition: WebProjectFormDefinition;
    progress: WebProject["progress"];
    sectionProgress?: WebProject["sectionProgress"];
  }>(`/api/client/web-projects/${id}/form`);
  return data;
}

export async function createWebProject(input: {
  title: string;
  projectType: "create" | "improve";
  websiteHostname?: string | null;
}): Promise<{ project: WebProject; policy: string }> {
  const { data } = await API.post<{ project: WebProject; policy: string }>("/api/client/web-projects", {
    title: input.title,
    projectType: input.projectType,
    websiteHostname: input.websiteHostname || undefined
  });
  return data;
}

export async function updateWebProject(
  id: number,
  patch: { title?: string; websiteHostname?: string | null }
): Promise<WebProject> {
  const { data } = await API.patch<{ project: WebProject }>(`/api/client/web-projects/${id}`, patch);
  return data.project;
}

export async function saveWebProjectForm(
  id: number,
  responses: { fieldKey: string; value: unknown }[]
): Promise<WebProject> {
  const { data } = await API.post<{ project: WebProject }>(`/api/client/web-projects/${id}/form`, {
    responses
  });
  return data.project;
}

export async function createWebProjectItem(
  id: number,
  input: {
    itemType: string;
    title: string;
    status?: string;
    sortOrder?: number;
    payload?: Record<string, unknown>;
  }
): Promise<WebProjectItem> {
  const { data } = await API.post<{ item: WebProjectItem }>(`/api/client/web-projects/${id}/items`, input);
  return data.item;
}

export async function updateWebProjectItem(
  projectId: number,
  itemId: number,
  patch: { title?: string; status?: string; sortOrder?: number; payload?: Record<string, unknown> }
): Promise<WebProjectItem> {
  const { data } = await API.patch<{ item: WebProjectItem }>(
    `/api/client/web-projects/${projectId}/items/${itemId}`,
    patch
  );
  return data.item;
}

export async function archiveWebProjectItem(projectId: number, itemId: number): Promise<WebProjectItem> {
  const { data } = await API.post<{ item: WebProjectItem }>(
    `/api/client/web-projects/${projectId}/items/${itemId}/archive`
  );
  return data.item;
}

export async function uploadWebProjectDocument(
  projectId: number,
  file: File,
  requirementKey?: string | null,
  replacesDocumentId?: string | null
): Promise<WebProjectDocument> {
  const body = new FormData();
  body.append("file", file, file.name);
  if (requirementKey) body.append("requirementKey", requirementKey);
  if (replacesDocumentId) body.append("replacesDocumentId", replacesDocumentId);
  const { data } = await API.post<{ document: WebProjectDocument }>(
    `/api/client/web-projects/${projectId}/documents`,
    body
  );
  return data.document;
}

export async function replaceWebProjectDocument(
  projectId: number,
  documentId: string,
  file: File
): Promise<WebProjectDocument> {
  return uploadWebProjectDocument(projectId, file, null, documentId);
}

export async function downloadWebProjectDocument(
  projectId: number,
  documentId: string
): Promise<{ blob: Blob; filename: string | null }> {
  const { data, headers } = await API.get<Blob>(
    `/api/client/web-projects/${projectId}/documents/${documentId}/content`,
    { responseType: "blob" }
  );
  const disposition = String(headers["content-disposition"] || "");
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i);
  const filename = match ? decodeURIComponent(match[1] || match[2] || "") : null;
  return { blob: data, filename };
}

export async function createWebProjectComment(projectId: number, body: string): Promise<WebProjectComment> {
  const { data } = await API.post<{ comment: WebProjectComment }>(
    `/api/client/web-projects/${projectId}/comments`,
    { body }
  );
  return data.comment;
}

export async function submitWebProjectReview(projectId: number): Promise<WebProject> {
  const { data } = await API.post<{ project: WebProject }>(
    `/api/client/web-projects/${projectId}/submit-review`
  );
  return data.project;
}

export async function fetchMockup(projectId: number): Promise<WebProjectMockupPayload> {
  const { data } = await API.get<WebProjectMockupPayload>(`/api/client/web-projects/${projectId}/mockup`);
  return data;
}

export async function approveMockup(projectId: number): Promise<WebProjectMockupPayload> {
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/client/web-projects/${projectId}/mockup/approve`
  );
  return data;
}

export async function requestMockupChanges(
  projectId: number,
  message: string
): Promise<WebProjectMockupPayload> {
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/client/web-projects/${projectId}/mockup/request-changes`,
    { message }
  );
  return data;
}
