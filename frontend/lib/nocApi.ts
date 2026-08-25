import API from "@/lib/api";

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
