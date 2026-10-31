export type HonestyLabel = "CURRENT" | "TARGET" | "DEMO" | "PLACEHOLDER" | "UNKNOWN";

export type ProtectionStatus = "PROTECTED" | "WARNING" | "CRITICAL" | "UNKNOWN";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type AutomationLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export type DemoOrgRole = "org_owner" | "org_admin" | "org_member" | "org_viewer";

export type DemoOrgId = "org-a" | "org-b";

export type VerifiedItem = {
  id: string;
  name: string;
  label: HonestyLabel;
  note?: string;
  verifiedIn?: string;
};

export type DemoOrganization = {
  id: DemoOrgId;
  name: string;
  slug: string;
  domain: string;
  protection: ProtectionStatus;
  protectionNote: string;
};

export type DemoAsset = {
  id: string;
  organizationId: DemoOrgId;
  type: "domain" | "website" | "server" | "api" | "database" | "service" | "tls";
  name: string;
  status: ProtectionStatus;
  summary: string;
};

export type DemoAlert = {
  id: string;
  organizationId: DemoOrgId;
  title: string;
  severity: "WARNING" | "CRITICAL";
  status: string;
  assetId: string;
};

export type DemoIncident = {
  id: string;
  organizationId: DemoOrgId;
  title: string;
  severity: "WARNING" | "CRITICAL";
  status: string;
  alertId: string;
};

export type RemediationAction = {
  id: "A" | "B" | "C";
  title: string;
  level: AutomationLevel;
  evidence: string;
  hypothesis: string;
  confidence: ConfidenceLevel;
  alternatives: string[];
  expectedResult: string;
  risk: string;
  failureSignal: string;
  actionB?: string;
  actionC?: string;
  rollback: string;
};
