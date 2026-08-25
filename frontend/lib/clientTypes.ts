export type HealthOverall = "HEALTHY" | "WARNING" | "CRITICAL" | "UNKNOWN";

export type ClientPortalPayload = {
  user: {
    id: number;
    email: string;
    name: string | null;
    company: string | null;
    created_at?: string;
    role: string;
    clientVerified: boolean;
  };
  organization?: {
    id: number;
    slug: string;
    name: string;
    orgRole: string;
  } | null;
  roles: string[];
  clientVerified: boolean;
  companyProfile: {
    name: string;
    contactEmail: string;
    status: string;
    nextStep: string;
  };
  activeServices: { slug: string; name: string; status: string; startedAt?: string | null }[];
  websiteAudit: {
    status: string;
    score: number | null;
    reviewedAt: string | null;
    websiteUrl: string | null;
    checks: { label: string; status: string; priority?: string }[];
  };
  suggestedImprovements: string[];
  improvementPanel: { statusOptions: string[]; fields: string[] };
  messages: unknown[];
  submissions: { id: number; data: Record<string, unknown>; status: string; created_at: string }[];
  activity: { id: number; action_type: string; details: unknown; created_at: string }[];
  argosDiagnostics?: {
    id: number;
    score: number;
    max_score: number;
    risk_level: string;
    risk_label: string;
    summary_preview: string;
    created_at: string;
  }[];
};

export type ClientAsset = {
  id: number;
  organizationId?: number;
  type: string;
  name: string;
  hostname: string | null;
  status: string;
  environment?: string;
  lastObservedAt: string | null;
};

export type ClientTlsCertificate = {
  id: number;
  provider: string | null;
  issuer?: string | null;
  subject?: string | null;
  notAfter: string | null;
  notBefore?: string | null;
  sans: string[];
  isWildcard: boolean;
  autoRenew: boolean | null;
  renewalMethod?: string | null;
  observationStatus: string;
  hostnameMatch?: boolean | null;
  lastObservedAt?: string | null;
  daysRemaining?: number | null;
  assetHostname: string | null;
  assetName: string | null;
};

export type ClientMonitor = {
  id: number;
  assetId: number;
  type: string;
  name: string;
  status: string;
  enabled: boolean;
  intervalSeconds: number;
  timeoutMs: number;
  lastCheckAt: string | null;
  nextCheckAt: string | null;
};

export type ClientAlert = {
  id: number;
  assetId: number | null;
  monitorId: number | null;
  severity: string;
  state: string;
  fingerprint: string;
  title: string;
  reason: string | null;
  count: number;
  openedAt: string | null;
  lastSeenAt: string | null;
  resolvedAt: string | null;
  updatedAt: string | null;
};

export type ClientIncident = {
  id: number;
  assetId: number | null;
  title: string;
  summary: string | null;
  severity: string;
  state: string;
  correlationKey: string;
  openedAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
};

export type MonitoringSummary = {
  organizationId: number;
  overall: HealthOverall;
  reasons: string[];
  coverage: {
    assetsActive: number;
    monitorsEnabled: number;
    assetsWithFreshEvidence: number;
  };
  counts: {
    openAlerts: number;
    openIncidents: number;
  };
  assets: {
    assetId: number;
    hostname: string | null;
    overall: HealthOverall;
    reasons: string[];
    coverage?: { monitored?: number; coveredFresh?: number };
  }[];
  disclaimer: string;
};
