import API from "@/lib/api";
import type {
  WebProject,
  WebProjectArchitectureBlock,
  WebProjectArchitecturePage,
  WebProjectArchitecturePayload,
  WebProjectBriefNote,
  WebProjectBriefPayload,
  WebProjectComment,
  WebProjectCredentialStatus,
  WebProjectDocument,
  WebProjectMockupPage,
  WebProjectMockupPayload,
  WebProjectMockupRecord,
  WebProjectMockupSection,
  WebProjectDevelopmentPayload,
  WebProjectType,
  WebProjectWorkflowStatus
} from "@/lib/webProjects/types";

export type NocMe = {
  allowed: boolean;
  role: string | null;
  userId: number | null;
  email: string | null;
};

export type NocPlatformHealth = {
  status: "OK" | "DEGRADED" | string;
  db: string;
  meaning: string;
  timestamp: string;
};

export type NocQueueItem = {
  id: number;
  kind: string;
  organizationId: number;
  organizationName: string | null;
  organizationSlug: string | null;
  assetId: number | null;
  assetHostname: string | null;
  signal: string;
  severity: string;
  status: string;
  reason: string | null;
  time: string | null;
};

export type NocSummary = {
  organizationsActive: number;
  assetsActive: number;
  monitorsEnabled: number;
  openAlerts: number;
  openCriticalAlerts: number;
  openWarningAlerts: number;
  openIncidents: number;
  healthSampleSize: number;
  healthBuckets: Record<string, number>;
  disclaimer: string;
  operationalQueue: NocQueueItem[];
};

export type NocOrg = {
  id: number;
  slug: string;
  name: string;
  status: string;
  memberCount: number;
  assetCount: number;
  monitorCount: number;
  openAlerts: number;
  openIncidents: number;
  createdAt: string;
  updatedAt: string;
};

export type NocAsset = {
  id: number;
  organizationId: number;
  organizationName: string | null;
  organizationSlug: string | null;
  type: string;
  name: string | null;
  hostname: string | null;
  status: string;
  environment: string | null;
  lastObservedAt: string | null;
  createdAt: string;
};

export type NocMonitor = {
  id: number;
  organizationId: number;
  organizationName: string | null;
  assetId: number;
  assetHostname: string | null;
  assetName: string | null;
  type: string;
  name: string | null;
  status: string;
  enabled: boolean;
  intervalSeconds: number | null;
  lastCheckAt: string | null;
  nextCheckAt: string | null;
  note?: string;
};

export type NocAlert = {
  id: number;
  organizationId: number;
  organizationName: string | null;
  organizationSlug: string | null;
  assetId: number | null;
  assetHostname: string | null;
  monitorId: number | null;
  severity: string;
  state: string;
  fingerprint: string | null;
  title: string;
  reason: string | null;
  count: number;
  openedAt: string | null;
  lastSeenAt: string | null;
  resolvedAt: string | null;
  updatedAt: string | null;
  evidenceSummary: Record<string, unknown> | null;
};

export type NocIncident = {
  id: number;
  organizationId: number;
  organizationName: string | null;
  organizationSlug: string | null;
  assetId: number | null;
  assetHostname: string | null;
  title: string;
  summary: string | null;
  severity: string;
  state: string;
  correlationKey: string | null;
  openedAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
};

export type NocTlsCert = {
  id: number;
  organizationId: number;
  organizationName?: string | null;
  assetId: number | null;
  hostname?: string | null;
  assetHostname?: string | null;
  observationStatus?: string;
  status?: string;
  notAfter?: string | null;
  validTo?: string | null;
  daysRemaining: number | null;
  issuer?: string | null;
  subject?: string | null;
  fingerprintSha256?: string | null;
  privateKey?: never;
};

export type NocAuditEvent = {
  id: number;
  source: string;
  userId: number | null;
  organizationId: number | null;
  action: string;
  riskLevel: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type NocSupportItem = {
  id: number;
  organizationId: number | null;
  organizationName: string | null;
  userId: number | null;
  status: string;
  type: string | null;
  title: string | null;
  createdAt: string;
};

function qs(params: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export async function fetchNocMe(): Promise<NocMe> {
  const { data } = await API.get<NocMe>("/api/noc/me");
  return data;
}

export async function fetchNocPlatformHealth(): Promise<NocPlatformHealth> {
  const { data } = await API.get<NocPlatformHealth>("/api/noc/platform-health");
  return data;
}

export async function fetchNocSummary(): Promise<NocSummary> {
  const { data } = await API.get<NocSummary>("/api/noc/summary");
  return data;
}

export async function fetchNocOrganizations(limit = 50, offset = 0) {
  const { data } = await API.get<{ organizations: NocOrg[]; pagination: { total: number } }>(
    `/api/noc/organizations${qs({ limit, offset })}`
  );
  return data;
}

export async function fetchNocOrganization(id: number) {
  const { data } = await API.get(`/api/noc/organizations/${id}`);
  return data;
}

export async function fetchNocAssets(filters: {
  organization_id?: number | string;
  type?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ assets: NocAsset[] }>(`/api/noc/assets${qs(filters)}`);
  return data.assets || [];
}

export async function fetchNocMonitoring(filters: {
  organization_id?: number | string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ monitors: NocMonitor[] }>(`/api/noc/monitoring${qs(filters)}`);
  return data.monitors || [];
}

export async function fetchNocHealth() {
  const { data } = await API.get<{
    sampleSize: number;
    buckets: Record<string, number>;
    byOrganization: Array<Record<string, unknown>>;
    disclaimer: string;
  }>("/api/noc/health");
  return data;
}

export async function fetchNocAlerts(filters: {
  organization_id?: number | string;
  state?: string;
  severity?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ alerts: NocAlert[] }>(`/api/noc/alerts${qs(filters)}`);
  return data.alerts || [];
}

export async function fetchNocAlert(id: number) {
  const { data } = await API.get<{ alert: NocAlert }>(`/api/noc/alerts/${id}`);
  return data.alert;
}

export async function fetchNocIncidents(filters: {
  organization_id?: number | string;
  state?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ incidents: NocIncident[] }>(
    `/api/noc/incidents${qs(filters)}`
  );
  return data.incidents || [];
}

export async function fetchNocIncident(id: number) {
  const { data } = await API.get<{
    incident: NocIncident;
    events: { id: number; kind: string; payload: unknown; createdAt: string }[];
  }>(`/api/noc/incidents/${id}`);
  return data;
}

export async function fetchNocTls(filters: {
  organization_id?: number | string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ certificates: NocTlsCert[] }>(`/api/noc/tls${qs(filters)}`);
  return data.certificates || [];
}

export async function fetchNocAudit(filters: {
  organization_id?: number | string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ events: NocAuditEvent[] }>(`/api/noc/audit${qs(filters)}`);
  return data.events || [];
}

export async function fetchNocSupport(filters: {
  organization_id?: number | string;
  limit?: number;
  offset?: number;
} = {}) {
  const { data } = await API.get<{ submissions: NocSupportItem[] }>(
    `/api/noc/support${qs(filters)}`
  );
  return data.submissions || [];
}

function requireNocOrgId(organizationId: number): number {
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    throw new Error("organization_id requerido");
  }
  return organizationId;
}

export async function fetchNocWebProjects(
  organizationId: number,
  options: { includeArchived?: boolean } = {}
): Promise<{ items: WebProject[]; organizationId: number }> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<{ items: WebProject[]; organizationId: number }>(
    `/api/noc/web-projects${qs({
      organization_id: org,
      include_archived: options.includeArchived ? "1" : undefined
    })}`
  );
  return { items: data.items || [], organizationId: data.organizationId };
}

export async function fetchNocWebProject(
  organizationId: number,
  projectId: number
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}${qs({ organization_id: org })}`
  );
  return data.project;
}

export async function createNocWebProject(
  organizationId: number,
  input: {
    title: string;
    projectType: WebProjectType;
    websiteHostname?: string | null;
  }
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects${qs({ organization_id: org })}`,
    {
      title: input.title,
      projectType: input.projectType,
      websiteHostname: input.websiteHostname || undefined
    }
  );
  return data.project;
}

export async function updateNocWebProject(
  organizationId: number,
  projectId: number,
  patch: { title?: string; websiteHostname?: string | null }
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}${qs({ organization_id: org })}`,
    patch
  );
  return data.project;
}

export async function transitionNocWebProject(
  organizationId: number,
  projectId: number,
  toStatus: WebProjectWorkflowStatus,
  extra?: { acknowledgeOpenItems?: boolean; reason?: string }
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}/transition${qs({ organization_id: org })}`,
    { toStatus, ...extra }
  );
  return data.project;
}

export async function fetchNocWebProjectBrief(
  organizationId: number,
  projectId: number
): Promise<WebProjectBriefPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<WebProjectBriefPayload>(
    `/api/noc/web-projects/${projectId}/brief${qs({ organization_id: org })}`
  );
  return data;
}

export async function createNocWebProjectBriefNote(
  organizationId: number,
  projectId: number,
  input: { noteType: string; content: string; blocking?: boolean; severity?: string | null }
): Promise<WebProjectBriefNote> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ note: WebProjectBriefNote }>(
    `/api/noc/web-projects/${projectId}/brief/notes${qs({ organization_id: org })}`,
    input
  );
  return data.note;
}

export async function updateNocWebProjectBriefNote(
  organizationId: number,
  projectId: number,
  noteId: number,
  input: { content?: string; status?: string; resolutionNote?: string; blocking?: boolean; severity?: string | null }
): Promise<WebProjectBriefNote> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<{ note: WebProjectBriefNote }>(
    `/api/noc/web-projects/${projectId}/brief/notes/${noteId}${qs({ organization_id: org })}`,
    input
  );
  return data.note;
}

export async function startNocWebProjectArchitecture(
  organizationId: number,
  projectId: number,
  extra?: { acknowledgeOpenItems?: boolean; reason?: string }
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}/start-architecture${qs({ organization_id: org })}`,
    extra || {}
  );
  return data.project;
}

export async function fetchNocWebProjectArchitecture(
  organizationId: number,
  projectId: number,
  architectureId?: number
): Promise<WebProjectArchitecturePayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<WebProjectArchitecturePayload>(
    `/api/noc/web-projects/${projectId}/architecture${qs({
      organization_id: org,
      architecture_id: architectureId
    })}`
  );
  return data;
}

export async function generateNocWebProjectArchitecture(
  organizationId: number,
  projectId: number
): Promise<WebProjectArchitecturePayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectArchitecturePayload>(
    `/api/noc/web-projects/${projectId}/architecture/generate${qs({ organization_id: org })}`
  );
  return data;
}

export async function createNocArchitectureRevision(
  organizationId: number,
  projectId: number
): Promise<WebProjectArchitecturePayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectArchitecturePayload>(
    `/api/noc/web-projects/${projectId}/architecture/revisions${qs({ organization_id: org })}`
  );
  return data;
}

export async function updateNocArchitecturePage(
  organizationId: number,
  projectId: number,
  pageId: number,
  input: Partial<WebProjectArchitecturePage>
): Promise<WebProjectArchitecturePage> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<{ page: WebProjectArchitecturePage }>(
    `/api/noc/web-projects/${projectId}/architecture/pages/${pageId}${qs({ organization_id: org })}`,
    input
  );
  return data.page;
}

export async function createNocArchitectureBlock(
  organizationId: number,
  projectId: number,
  pageId: number,
  input: { blockType: string; purpose?: string; required?: boolean }
): Promise<WebProjectArchitectureBlock> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ block: WebProjectArchitectureBlock }>(
    `/api/noc/web-projects/${projectId}/architecture/pages/${pageId}/blocks${qs({ organization_id: org })}`,
    input
  );
  return data.block;
}

export async function updateNocArchitectureBlock(
  organizationId: number,
  projectId: number,
  blockId: number,
  input: Partial<WebProjectArchitectureBlock>
): Promise<WebProjectArchitectureBlock> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<{ block: WebProjectArchitectureBlock }>(
    `/api/noc/web-projects/${projectId}/architecture/blocks/${blockId}${qs({ organization_id: org })}`,
    input
  );
  return data.block;
}

export async function approveNocWebProjectArchitecture(
  organizationId: number,
  projectId: number,
  extra?: { acknowledgeWarnings?: boolean }
): Promise<WebProjectArchitecturePayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectArchitecturePayload>(
    `/api/noc/web-projects/${projectId}/architecture/approve${qs({ organization_id: org })}`,
    extra || {}
  );
  return data;
}

export async function startNocWebProjectMockup(
  organizationId: number,
  projectId: number
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}/start-mockup${qs({ organization_id: org })}`
  );
  return data.project;
}

export async function fetchNocWebProjectMockup(
  organizationId: number,
  projectId: number,
  mockupId?: number
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup${qs({
      organization_id: org,
      mockup_id: mockupId
    })}`
  );
  return data;
}

export async function generateNocWebProjectMockup(
  organizationId: number,
  projectId: number
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/generate${qs({ organization_id: org })}`
  );
  return data;
}

export async function createNocMockupRevision(
  organizationId: number,
  projectId: number
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/revisions${qs({ organization_id: org })}`
  );
  return data;
}

export async function updateNocWebProjectMockup(
  organizationId: number,
  projectId: number,
  mockupId: number,
  input: Partial<
    Pick<
      WebProjectMockupRecord,
      | "visualDirection"
      | "designTokens"
      | "headerVariant"
      | "footerVariant"
      | "previewItemId"
      | "previewItemType"
      | "internalNotes"
    >
  > & { previewPageId?: number }
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup${qs({ organization_id: org })}`,
    { mockupId, ...input }
  );
  return data;
}

export async function updateNocMockupPage(
  organizationId: number,
  projectId: number,
  pageId: number,
  input: Partial<Pick<WebProjectMockupPage, "visualNotes" | "responsiveSettings" | "status">>
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/pages/${pageId}${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function updateNocMockupSection(
  organizationId: number,
  projectId: number,
  sectionId: number,
  input: Partial<
    Pick<
      WebProjectMockupSection,
      "variant" | "alignment" | "density" | "visualProps" | "placeholderText" | "visualNotes"
    >
  >
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/sections/${sectionId}${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function validateNocWebProjectMockup(
  organizationId: number,
  projectId: number,
  mockupId: number
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/validate${qs({ organization_id: org })}`,
    { mockupId }
  );
  return data;
}

export async function startNocMockupInternalReview(
  organizationId: number,
  projectId: number,
  mockupId: number
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/internal-review${qs({ organization_id: org })}`,
    { mockupId }
  );
  return data;
}

export async function sendNocMockupToClient(
  organizationId: number,
  projectId: number,
  mockupId: number,
  extra?: { acknowledgeWarnings?: boolean }
): Promise<WebProjectMockupPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectMockupPayload>(
    `/api/noc/web-projects/${projectId}/mockup/send-client${qs({ organization_id: org })}`,
    { mockupId, ...extra }
  );
  return data;
}

export async function startNocWebProjectDevelopment(
  organizationId: number,
  projectId: number
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}/start-development${qs({ organization_id: org })}`
  );
  return data.project;
}

export async function fetchNocWebProjectDevelopment(
  organizationId: number,
  projectId: number
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/development${qs({ organization_id: org })}`
  );
  return data;
}

export async function prepareNocWebProjectDevelopment(
  organizationId: number,
  projectId: number
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/development/prepare${qs({ organization_id: org })}`
  );
  return data;
}

export async function updateNocDevelopmentItem(
  organizationId: number,
  projectId: number,
  itemId: number,
  input: { status?: string; priority?: string; description?: string }
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/development/items/${itemId}${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function blockNocDevelopmentItem(
  organizationId: number,
  projectId: number,
  itemId: number,
  input: { blockerType: string; description: string }
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/development/items/${itemId}/block${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function unblockNocDevelopmentItem(
  organizationId: number,
  projectId: number,
  itemId: number,
  input?: { resolutionNote?: string }
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/development/items/${itemId}/unblock${qs({ organization_id: org })}`,
    input || {}
  );
  return data;
}

export async function addNocDevelopmentDependency(
  organizationId: number,
  projectId: number,
  itemId: number,
  dependsOnItemId: number
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/development/items/${itemId}/dependencies${qs({ organization_id: org })}`,
    { dependsOnItemId }
  );
  return data;
}

export async function startNocWebProjectValidation(
  organizationId: number,
  projectId: number,
  input?: { acknowledgeWarnings?: boolean; overrideReason?: string }
): Promise<WebProjectDevelopmentPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<WebProjectDevelopmentPayload>(
    `/api/noc/web-projects/${projectId}/start-validation${qs({ organization_id: org })}`,
    input || {}
  );
  return data;
}

export async function fetchNocWebProjectValidation(
  organizationId: number,
  projectId: number
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation${qs({ organization_id: org })}`
  );
  return data;
}

export async function prepareNocWebProjectValidation(
  organizationId: number,
  projectId: number
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation/prepare${qs({ organization_id: org })}`
  );
  return data;
}

export async function updateNocValidationCheck(
  organizationId: number,
  projectId: number,
  checkId: number,
  input: {
    status?: string;
    actualResult?: string;
    statusReason?: string;
  }
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation/checks/${checkId}${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function attachNocValidationEvidence(
  organizationId: number,
  projectId: number,
  checkId: number,
  input: {
    evidenceType: string;
    label?: string;
    url?: string;
    textNote?: string;
  }
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation/checks/${checkId}/evidence${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function createNocValidationDefect(
  organizationId: number,
  projectId: number,
  checkId: number,
  input: { title: string; severity: string; description?: string }
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation/checks/${checkId}/defects${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function updateNocValidationDefect(
  organizationId: number,
  projectId: number,
  defectId: number,
  input: {
    status?: string;
    resolutionNote?: string;
    wontFixReason?: string;
  }
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation/defects/${defectId}${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function retestNocValidationDefect(
  organizationId: number,
  projectId: number,
  defectId: number,
  input: { checkStatus: string; note?: string; actualResult?: string }
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/validation/defects/${defectId}/retest${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function startNocWebProjectPublication(
  organizationId: number,
  projectId: number,
  input?: { acknowledgeWarnings?: boolean; overrideReason?: string }
): Promise<import("@/lib/webProjects/types").WebProjectValidationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectValidationPayload>(
    `/api/noc/web-projects/${projectId}/start-publication${qs({ organization_id: org })}`,
    input || {}
  );
  return data;
}

export async function fetchNocWebProjectPublication(
  organizationId: number,
  projectId: number
): Promise<import("@/lib/webProjects/types").WebProjectPublicationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.get<import("@/lib/webProjects/types").WebProjectPublicationPayload>(
    `/api/noc/web-projects/${projectId}/publication${qs({ organization_id: org })}`
  );
  return data;
}

export async function prepareNocWebProjectPublication(
  organizationId: number,
  projectId: number
): Promise<import("@/lib/webProjects/types").WebProjectPublicationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectPublicationPayload>(
    `/api/noc/web-projects/${projectId}/publication/prepare${qs({ organization_id: org })}`,
    {}
  );
  return data;
}

export async function updateNocPublicationStep(
  organizationId: number,
  projectId: number,
  stepId: number,
  patch: { status?: string; notes?: string; evidenceUrl?: string }
): Promise<import("@/lib/webProjects/types").WebProjectPublicationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.patch<import("@/lib/webProjects/types").WebProjectPublicationPayload>(
    `/api/noc/web-projects/${projectId}/publication/steps/${stepId}${qs({ organization_id: org })}`,
    patch
  );
  return data;
}

export async function blockNocPublicationStep(
  organizationId: number,
  projectId: number,
  stepId: number,
  input: { blockerType: string; description: string }
): Promise<import("@/lib/webProjects/types").WebProjectPublicationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectPublicationPayload>(
    `/api/noc/web-projects/${projectId}/publication/steps/${stepId}/block${qs({ organization_id: org })}`,
    input
  );
  return data;
}

export async function unblockNocPublicationStep(
  organizationId: number,
  projectId: number,
  stepId: number,
  input?: { resolutionNote?: string }
): Promise<import("@/lib/webProjects/types").WebProjectPublicationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectPublicationPayload>(
    `/api/noc/web-projects/${projectId}/publication/steps/${stepId}/unblock${qs({ organization_id: org })}`,
    input || {}
  );
  return data;
}

export async function completeNocWebProject(
  organizationId: number,
  projectId: number,
  input?: { acknowledgeWarnings?: boolean; overrideReason?: string }
): Promise<import("@/lib/webProjects/types").WebProjectPublicationPayload> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<import("@/lib/webProjects/types").WebProjectPublicationPayload>(
    `/api/noc/web-projects/${projectId}/complete${qs({ organization_id: org })}`,
    input || {}
  );
  return data;
}

export async function archiveNocWebProject(
  organizationId: number,
  projectId: number,
  input?: { reason?: string | null }
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}/archive${qs({ organization_id: org })}`,
    input?.reason ? { reason: input.reason } : {}
  );
  return data.project;
}

export async function createNocWebProjectReview(
  organizationId: number,
  projectId: number,
  input: {
    verdict: string;
    summary?: string;
    correctionMessage?: string;
    targetType?: string;
    targetId?: string | number | null;
    targetKey?: string | null;
    schemaVersion?: string | null;
  }
): Promise<WebProject> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ project: WebProject }>(
    `/api/noc/web-projects/${projectId}/reviews${qs({ organization_id: org })}`,
    input
  );
  return data.project;
}

export async function createNocWebProjectComment(
  organizationId: number,
  projectId: number,
  body: string
): Promise<WebProjectComment> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ comment: WebProjectComment }>(
    `/api/noc/web-projects/${projectId}/comments${qs({ organization_id: org })}`,
    { body }
  );
  return data.comment;
}

export async function uploadNocWebProjectDocument(
  organizationId: number,
  projectId: number,
  file: File
): Promise<WebProjectDocument> {
  const org = requireNocOrgId(organizationId);
  const body = new FormData();
  body.append("file", file, file.name);
  const { data } = await API.post<{ document: WebProjectDocument }>(
    `/api/noc/web-projects/${projectId}/documents${qs({ organization_id: org })}`,
    body
  );
  return data.document;
}

export async function downloadNocWebProjectDocument(
  organizationId: number,
  projectId: number,
  documentId: string
): Promise<{ blob: Blob; filename: string | null }> {
  const org = requireNocOrgId(organizationId);
  const { data, headers } = await API.get<Blob>(
    `/api/noc/web-projects/${projectId}/documents/${documentId}/content${qs({ organization_id: org })}`,
    { responseType: "blob" }
  );
  const disposition = String(headers["content-disposition"] || "");
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i);
  const filename = match ? decodeURIComponent(match[1] || match[2] || "") : null;
  return { blob: data, filename };
}

export async function setNocWebProjectCredentialStatus(
  organizationId: number,
  projectId: number,
  status: string
): Promise<WebProjectCredentialStatus> {
  const org = requireNocOrgId(organizationId);
  const { data } = await API.post<{ credentialStatus: WebProjectCredentialStatus }>(
    `/api/noc/web-projects/${projectId}/credential-status${qs({ organization_id: org })}`,
    { status }
  );
  return data.credentialStatus;
}

export type NocWebProjectInvitation = {
  id: number;
  email: string;
  displayName: string;
  projectType: WebProjectType;
  projectTitle: string | null;
  organizationId: number | null;
  organizationName: string | null;
  webProjectId: number | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  deliveryStatus: "NONE" | "PENDING" | "SENT" | "FAILED";
  createdOrganization: boolean;
  intendedOrgRole: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type NocInvitationCreateResult = {
  invitation: NocWebProjectInvitation;
  delivery: { delivered: boolean; reason: string | null };
  inviteUrl?: string;
};

export async function fetchNocWebProjectInvitations(
  organizationId?: number | null
): Promise<{ items: NocWebProjectInvitation[]; organizationId: number | null }> {
  const { data } = await API.get<{ items: NocWebProjectInvitation[]; organizationId: number | null }>(
    `/api/noc/web-project-invitations${qs({
      organization_id: organizationId || undefined
    })}`
  );
  return { items: data.items || [], organizationId: data.organizationId || null };
}

export async function createNocWebProjectInvitation(input: {
  email: string;
  displayName: string;
  projectType: WebProjectType;
  projectTitle?: string;
  organizationId?: number | null;
  orgRole?: string;
}): Promise<NocInvitationCreateResult> {
  const { data } = await API.post<NocInvitationCreateResult>("/api/noc/web-project-invitations", {
    email: input.email,
    displayName: input.displayName,
    projectType: input.projectType,
    projectTitle: input.projectTitle || undefined,
    organizationId: input.organizationId || undefined,
    orgRole: input.orgRole
  });
  return data;
}

export async function revokeNocWebProjectInvitation(id: number): Promise<NocWebProjectInvitation> {
  const { data } = await API.post<{ invitation: NocWebProjectInvitation }>(
    `/api/noc/web-project-invitations/${id}/revoke`
  );
  return data.invitation;
}

export async function resendNocWebProjectInvitation(id: number): Promise<NocInvitationCreateResult> {
  const { data } = await API.post<NocInvitationCreateResult>(
    `/api/noc/web-project-invitations/${id}/resend`
  );
  return data;
}
