export type WebProjectType = "create" | "improve";

export type WebProjectWorkflowStatus =
  | "INTAKE"
  | "REVIEW"
  | "ARCHITECTURE"
  | "MOCKUP"
  | "DEVELOPMENT"
  | "VALIDATION"
  | "PUBLICATION"
  | "COMPLETED";

export type WebProjectItemType =
  | "page"
  | "service"
  | "product"
  | "tour"
  | "team_member"
  | "location"
  | "deliverable"
  | "custom";

export type WebProjectItemStatus = "draft" | "ready" | "done";

export type WebProjectCredentialStatusValue =
  | "NONE"
  | "REQUESTED"
  | "RECEIVED_OUT_OF_BAND"
  | "VERIFIED"
  | "REVOKED";

export type WebProjectUploadStatus = "PENDING" | "STORED" | "FAILED";

export type WebProjectProgress = {
  required: number;
  completed: number;
  notApplicable: number;
  pending: number;
  percentage: number;
  ratio: number;
  total: number;
  units: { kind: string; key: string; done: boolean }[];
};

export type WebProjectFormFieldDef = {
  key: string;
  type: "enum" | "text" | "url" | "email" | "phone" | "date" | "number" | "multi_enum" | "video_url" | "textarea" | string;
  required?: boolean;
  importance?: "required" | "recommended" | "optional" | string;
  options?: string[];
  section?: string;
  help?: string;
  applicableIf?: {
    field?: string;
    equals?: string;
    in?: string[];
    contains?: string;
    minLength?: number;
    projectType?: { equals?: string; in?: string[] };
    any?: WebProjectFormFieldDef["applicableIf"][];
    all?: WebProjectFormFieldDef["applicableIf"][];
  };
  requiredIf?: WebProjectFormFieldDef["applicableIf"];
};

export type WebProjectFormSectionDef = {
  id: string;
  order: number;
  label: string;
  description?: string;
  applicableIf?: WebProjectFormFieldDef["applicableIf"];
};

export type WebProjectItemBinding = {
  itemType: string;
  section: string;
  applicableIf?: WebProjectFormFieldDef["applicableIf"];
};

export type WebProjectFormDefinition = {
  version: string;
  fields: WebProjectFormFieldDef[];
  sections?: WebProjectFormSectionDef[];
  requiredDocuments?: { key: string; requiredIf?: WebProjectFormFieldDef["applicableIf"]; section?: string }[];
  documentCategories?: string[];
  itemBindings?: WebProjectItemBinding[];
};

export type WebProjectSectionProgress = {
  id: string;
  order: number;
  label: string;
  hidden: boolean;
  required: number;
  completed: number;
  notApplicable: number;
  pending: number;
  percentage: number;
  status: "hidden" | "complete" | "partial" | "empty" | "optional" | "correction" | string;
  correction: boolean;
};

export type WebProjectFormResponse = {
  fieldKey: string;
  schemaVersion: string;
  value: unknown;
  applicable: boolean;
  section?: string | null;
  updatedBy: number | null;
  updatedAt: string;
};

export type WebProjectForm = {
  schemaVersion: string;
  responses: WebProjectFormResponse[];
};

export type WebProjectItem = {
  id: number;
  itemType: WebProjectItemType | string;
  title: string;
  status: WebProjectItemStatus | string;
  sortOrder: number;
  payload: Record<string, unknown>;
  archivedAt: string | null;
};

export type WebProjectDocument = {
  id: string;
  objectKey: string;
  originalFilename: string;
  requirementKey: string | null;
  mimeType: string;
  byteLength: number;
  sha256: string | null;
  scanStatus: string;
  status: string;
  uploadStatus: WebProjectUploadStatus | string;
  storedAt: string | null;
  replacesDocumentId?: string | null;
};

export type WebProjectComment = {
  id: number;
  body: string;
  createdBy: number | null;
  createdAt: string;
};

export type WebProjectReviewTargetType = "PROJECT" | "FORM_FIELD" | "ITEM" | "DOCUMENT" | string;

export type WebProjectReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "CORRECTION_REQUIRED"
  | "REJECTED"
  | string;

export type WebProjectReview = {
  id: number;
  verdict: string;
  summary: string;
  targetType?: WebProjectReviewTargetType;
  targetId?: string | null;
  targetKey?: string | null;
  schemaVersion?: string | null;
  correctionMessage?: string | null;
  createdBy: number | null;
  createdAt: string;
};

export type WebProjectReviewState = {
  targetType: WebProjectReviewTargetType;
  targetId: string | null;
  targetKey: string | null;
  schemaVersion?: string | null;
  status: WebProjectReviewStatus;
  latestReviewId?: number | null;
  verdict?: string | null;
  correctionMessage?: string | null;
  summary?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
};

export type WebProjectReviewSummary = {
  approved: number;
  pending: number;
  correctionRequired: number;
  rejected: number;
  openCorrections: number;
};

export type WebProjectReadiness = {
  status: "READY_FOR_REVIEW" | "AWAITING_INFORMATION" | "CORRECTIONS_OPEN" | string;
  label: string;
  requiredPending: number;
  openCorrections: number;
  readyToAdvance: boolean;
};

export type WebProjectCredentialStatus = {
  status: WebProjectCredentialStatusValue | string;
  updatedBy?: number | null;
  updatedAt?: string | null;
};

export type WebProject = {
  id: number;
  organizationId: number;
  title: string;
  projectType: WebProjectType | string;
  workflowStatus: WebProjectWorkflowStatus | string;
  websiteAssetId: number | null;
  websiteHostname: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy?: number | null;
  archiveReason?: string | null;
  completedAt: string | null;
  submittedForReviewAt: string | null;
  form?: WebProjectForm;
  items?: WebProjectItem[];
  documents?: WebProjectDocument[];
  reviews?: WebProjectReview[];
  comments?: WebProjectComment[];
  credentialStatus?: WebProjectCredentialStatus;
  progress?: WebProjectProgress;
  sectionProgress?: WebProjectSectionProgress[];
  reviewSummary?: WebProjectReviewSummary;
  reviewStates?: WebProjectReviewState[];
  readiness?: WebProjectReadiness;
};

export type ArchitectureReadinessState = "NOT_READY" | "READY_WITH_OPEN_ITEMS" | "READY" | string;

export type ArchitectureIssue = {
  code: string;
  label: string;
  sourceType?: string | null;
  sourceKey?: string | null;
  sourceId?: string | null;
  action?: string | null;
  kind?: "blocker" | "warning" | string;
};

export type ArchitectureReadiness = {
  state: ArchitectureReadinessState;
  blockers: ArchitectureIssue[];
  warnings: ArchitectureIssue[];
  metrics?: {
    collectionProgress?: number;
    correctionRequired?: number;
    pendingReview?: number;
    approved?: number;
  };
};

export type BriefSourced = {
  value: string;
  pending?: boolean;
  sourceType?: string | null;
  sourceKey?: string | null;
  sourceId?: string | null;
};

export type WebProjectBriefNote = {
  id: number;
  noteType: string;
  content: string;
  status: string;
  blocking: boolean;
  severity?: string | null;
  resolutionNote?: string | null;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
};

export type WebProjectBrief = {
  schemaVersion: string;
  sourceFormSchema?: string;
  header: {
    title: string;
    organizationName?: string | null;
    organizationId?: number;
    projectType: string;
    workflowStatus: string;
    collectionPercentage: number;
    reviewSummary?: WebProjectReviewSummary | null;
    architectureReadiness: ArchitectureReadinessState;
    archived?: boolean;
    completed?: boolean;
  };
  executiveSummary: {
    project: string;
    organization: string;
    projectType: string;
    currentWebsite: string;
    primaryObjective: BriefSourced;
    audience: BriefSourced;
    businessModel: BriefSourced;
    languages: BriefSourced;
    mainContentTypes: BriefSourced;
    salesRequirement: BriefSourced;
    keyIntegrations: BriefSourced;
    collectionProgress: number;
    architectureReadiness: ArchitectureReadinessState;
  };
  scopeMatrix: Array<{ id: string; label: string; state: string; sourceKey?: string | null }>;
  contentInventory: {
    pages: number;
    services: number;
    products: number;
    activities: number;
    teamMembers: number;
    locations: number;
    documents: number;
    media: number;
  };
  pages: Array<{
    id: number;
    title: string;
    purpose: string;
    intent: string;
    parent: string;
    cta: string;
    seoPriority: string;
    contentReadiness: string;
    reviewStatus: string;
  }>;
  services: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  tours: Array<Record<string, unknown>>;
  team: Array<Record<string, unknown>>;
  locations: Array<Record<string, unknown>>;
  contentGroups: Array<{ id: string; label: string; status: string }>;
  documents: Array<{
    id: string;
    name: string;
    category: string;
    uploadStatus: string;
    reviewStatus: string;
  }>;
  currentWebsite: {
    applicable: boolean;
    url: BriefSourced;
    keep: BriefSourced;
    remove: BriefSourced;
    migrate: BriefSourced;
    cms: BriefSourced;
  };
  languages: Record<string, BriefSourced>;
  sales: Record<string, BriefSourced>;
  integrations: Record<string, BriefSourced>;
  legal: Record<string, string>;
  seo: Record<string, BriefSourced | string>;
  technicalAccess: {
    needed: string[];
    statuses: Array<{ service: string; status: string }>;
  };
  openItems: ArchitectureIssue[];
  assumptions: WebProjectBriefNote[];
  exclusions: WebProjectBriefNote[];
  risks: WebProjectBriefNote[];
  decisions: WebProjectBriefNote[];
  architectureNotes: WebProjectBriefNote[];
  architectureReadiness: ArchitectureReadiness;
};

export type WebProjectBriefPayload = {
  brief: WebProjectBrief;
  architectureReadiness: ArchitectureReadiness;
  notes: WebProjectBriefNote[];
  handoff: {
    id: number;
    schemaVersion: string;
    createdAt: string;
    readinessState: string;
    overrideUsed: boolean;
    payload: Record<string, unknown>;
  } | null;
  organizationId: number;
};

export type ArchitectureValidationState = "INVALID" | "READY_WITH_WARNINGS" | "READY";

export type ArchitectureValidation = {
  state: ArchitectureValidationState;
  errors: Array<{ code: string; message: string; pageId?: number; route?: string }>;
  warnings: Array<{ code: string; message: string; pageId?: number }>;
  metrics: { pages: number; templates: number; blocks: number; homeCount: number };
};

export type WebProjectArchitecturePage = {
  id: number;
  architectureId: number;
  title: string;
  slug: string;
  route: string;
  pageType: string;
  templateType: string;
  parentPageId: number | null;
  sortOrder: number;
  navigationPlacement: string;
  navigationLabel: string | null;
  purpose: string | null;
  summary: string | null;
  primaryCta: string | null;
  secondaryCta: string | null;
  seoPriority: string;
  contentReadiness: string;
  contentBindingType: string | null;
  contentBindingMode: string | null;
  sourcePageItemId: number | null;
  migrationDisposition: string | null;
  entityCount: number | null;
  archivedAt: string | null;
};

export type WebProjectArchitectureBlock = {
  id: number;
  architectureId: number;
  architecturePageId: number;
  blockType: string;
  sortOrder: number;
  title: string | null;
  purpose: string | null;
  notes: string | null;
  contentSourceType: string | null;
  contentSourceId: number | null;
  required: boolean;
};

export type WebProjectArchitectureRecord = {
  id: number;
  version: number;
  status: "DRAFT" | "APPROVED" | "SUPERSEDED";
  primaryLanguage: string | null;
  additionalLanguages: string[];
  languageSelectorRequired: boolean;
  approvedAt: string | null;
  supersedesArchitectureId: number | null;
};

export type WebProjectArchitecturePayload = {
  architecture: WebProjectArchitectureRecord | null;
  versions: WebProjectArchitectureRecord[];
  pages: WebProjectArchitecturePage[];
  blocks: WebProjectArchitectureBlock[];
  tree: Array<{ page: WebProjectArchitecturePage; children: unknown[] }>;
  validation: ArchitectureValidation;
  conversionPaths: Array<Record<string, unknown>>;
  contentCoverage: Record<string, unknown> | null;
  workflowStatus?: string;
  organizationId?: number;
  projectId?: number;
};

export type MockupStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "CLIENT_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SUPERSEDED";

export type MockupValidationState = "INVALID" | "READY_WITH_WARNINGS" | "READY";

export type MockupVisualDirection = {
  source?: string;
  logo?: { status?: string; documentId?: string | null; label?: string };
  brandColors?: unknown;
  typography?: {
    heading?: string;
    body?: string;
    licenseStatus?: string;
  };
  tone?: unknown;
  attributes?: string[];
  styleReferences?: Record<string, unknown>;
  imageryDirection?: unknown;
  iconographyDirection?: unknown;
  layoutDensity?: string;
  buttonTreatment?: string;
  cardTreatment?: string;
  formTreatment?: string;
  imageTreatment?: string;
};

export type MockupDesignTokens = {
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  spacing?: Record<string, string>;
  shape?: Record<string, string>;
  layout?: Record<string, string>;
};

export type WebProjectMockupRecord = {
  id: number;
  organizationId?: number;
  projectId?: number;
  version: number;
  status: MockupStatus | string;
  architectureId?: number;
  architectureVersion?: number;
  visualDirection: MockupVisualDirection;
  designTokens: MockupDesignTokens;
  headerVariant?: string | null;
  footerVariant?: string | null;
  previewItemId?: number | null;
  previewItemType?: string | null;
  metadata?: Record<string, unknown>;
  internalNotes?: string | null;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: number | null;
  approvedAt?: string | null;
  sentToClientAt?: string | null;
  sentToClientBy?: number | null;
  supersedesMockupId?: number | null;
};

export type WebProjectMockupPage = {
  id: number;
  mockupId: number;
  architecturePageId: number;
  title: string;
  route: string;
  pageType: string;
  templateType: string;
  status: string;
  visualNotes: string | null;
  responsiveSettings: Record<string, unknown>;
  sortOrder: number;
  archivedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WebProjectMockupSection = {
  id: number;
  mockupId: number;
  mockupPageId: number;
  architectureBlockId: number | null;
  sectionType: string;
  variant: string;
  alignment: string;
  density: string;
  visualProps: Record<string, unknown>;
  assetDocumentId?: string | null;
  placeholderText: string | null;
  sortOrder: number;
  required: boolean;
  visualNotes?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MockupValidation = {
  state: MockupValidationState;
  errors: Array<{ code: string; message: string; pageId?: number; blockId?: number; sectionId?: number }>;
  warnings: Array<{ code: string; message: string; pageId?: number; blockId?: number; sectionId?: number }>;
  metrics: {
    pages: number;
    sections: number;
    architecturePages?: number;
    architectureBlocks?: number;
  };
};

export type WebProjectMockupPayload = {
  mockup: WebProjectMockupRecord | null;
  versions?: WebProjectMockupRecord[];
  pages: WebProjectMockupPage[];
  sections: WebProjectMockupSection[];
  validation: MockupValidation;
  architectureReference?: { id: number; version: number; status: string } | null;
  previewItem?: { id: number; itemType: string; title: string } | null;
  contentPreviewItems?: Array<{ id: number; itemType: string; title: string }>;
  organizationId?: number;
  projectId?: number;
  workflowStatus?: string;
};

export type DevelopmentItemType =
  | "PROJECT_SETUP"
  | "GLOBAL_STYLES"
  | "HEADER"
  | "FOOTER"
  | "PAGE"
  | "TEMPLATE"
  | "SECTION"
  | "CONTENT"
  | "MEDIA"
  | "FORM"
  | "INTEGRATION"
  | "SEO"
  | "LEGAL"
  | "RESPONSIVE"
  | "ACCESSIBILITY"
  | "PERFORMANCE"
  | "ANALYTICS"
  | "MIGRATION"
  | "REDIRECT"
  | "CUSTOM";

export type DevelopmentItemStatus =
  | "TODO"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "REVIEW"
  | "DONE"
  | "NOT_APPLICABLE";

export type DevelopmentReadinessState = "NOT_READY" | "READY_WITH_WARNINGS" | "READY";

export type WebProjectDevelopmentChecklistEntry = {
  id: number;
  label: string;
  required: boolean;
  completed: boolean;
  sortOrder: number;
};

export type WebProjectDevelopmentBlocker = {
  id: number;
  itemId: number;
  blockerType: string;
  description: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
};

export type WebProjectDevelopmentItem = {
  id: number;
  planId: number;
  itemType: DevelopmentItemType;
  title: string;
  description?: string | null;
  status: DevelopmentItemStatus;
  priority: string;
  contentReadiness: string;
  required: boolean;
  sortOrder: number;
  checklist: WebProjectDevelopmentChecklistEntry[];
  blockers: WebProjectDevelopmentBlocker[];
  dependencyIds: number[];
};

export type WebProjectDevelopmentPayload = {
  handoff: {
    id: number;
    architectureVersion: number;
    mockupVersion: number;
    mockupApprovedAt?: string | null;
    createdAt: string;
  } | null;
  plan: { id: number; version: number; status: string } | null;
  items: WebProjectDevelopmentItem[];
  progress: { percent: number; done: number; total: number };
  readiness: {
    state: DevelopmentReadinessState;
    errors: Array<{ code: string; message: string; itemId?: number }>;
    warnings: Array<{ code: string; message: string; itemId?: number }>;
  };
  validationHandoff?: { id: number; readinessState: string; createdAt: string } | null;
  organizationId?: number;
};

export type ValidationCheckStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PASS"
  | "FAIL"
  | "BLOCKED"
  | "NOT_TESTABLE"
  | "NOT_APPLICABLE";

export type ValidationReadinessState = "NOT_READY" | "READY_WITH_WARNINGS" | "READY";

export type WebProjectValidationCheck = {
  id: number;
  category: string;
  title: string;
  description?: string | null;
  templateGroupKey?: string | null;
  status: ValidationCheckStatus;
  required: boolean;
  expectedResult?: string | null;
  actualResult?: string | null;
  statusReason?: string | null;
  severityIfFailed?: string | null;
  evidence: Array<{
    id: number;
    evidenceType: string;
    label?: string | null;
    url?: string | null;
    textNote?: string | null;
    createdAt: string;
  }>;
  defects: Array<{
    id: number;
    title: string;
    severity: string;
    status: string;
  }>;
  history: Array<{
    id: number;
    previousStatus: string;
    newStatus: string;
    note?: string | null;
    testedAt: string;
  }>;
};

export type WebProjectValidationDefect = {
  id: number;
  checkId?: number | null;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  wontFixReason?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
};

export type WebProjectValidationPayload = {
  validationHandoff: {
    id: number;
    developmentPlanId: number;
    readinessState: string;
    createdAt: string;
  } | null;
  plan: {
    id: number;
    architectureVersion?: number | null;
    mockupVersion?: number | null;
    developmentPlanId: number;
    representativeSamples: Record<string, number>;
  } | null;
  run: { id: number; runNumber: number; status: string } | null;
  checks: WebProjectValidationCheck[];
  defects: WebProjectValidationDefect[];
  counts: {
    checks: Record<string, number>;
    defectsOpen: number;
    defectsCriticalHigh: number;
  };
  executionProgress: { percent: number; evaluated: number; total: number };
  passRate: { percent: number; passed: number; evaluated: number };
  readiness: {
    state: ValidationReadinessState;
    errors: Array<{ code: string; message: string; checkId?: number }>;
    warnings: Array<{ code: string; message: string }>;
  };
  publicationHandoff?: {
    id: number;
    readinessState: string;
    createdAt: string;
  } | null;
  publicationReadiness: ValidationReadinessState;
  organizationId?: number;
};

export type PublicationStepStatus =
  | "TODO"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "REVIEW"
  | "DONE"
  | "NOT_APPLICABLE";

export type PublicationReadinessState = "NOT_READY" | "READY_WITH_WARNINGS" | "READY";

export type WebProjectPublicationBlocker = {
  id: number;
  stepId: number;
  blockerType: string;
  description: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
};

export type WebProjectPublicationStep = {
  id: number;
  planId: number;
  stepType: string;
  title: string;
  description?: string | null;
  status: PublicationStepStatus;
  priority: string;
  required: boolean;
  sortOrder: number;
  notes?: string | null;
  evidenceUrl?: string | null;
  blockers: WebProjectPublicationBlocker[];
};

export type WebProjectPublicationPayload = {
  publicationHandoff: {
    id: number;
    validationPlanId: number;
    readinessState: string;
    createdAt: string;
  } | null;
  plan: {
    id: number;
    publicationHandoffId: number;
    validationPlanId: number;
    targetHostname?: string | null;
    status: string;
  } | null;
  steps: WebProjectPublicationStep[];
  progress: { percent: number; done: number; total: number };
  counts: {
    steps: Record<string, number>;
    blockersOpen: number;
  };
  readiness: {
    state: PublicationReadinessState;
    errors: Array<{ code: string; message: string; stepId?: number }>;
    warnings: Array<{ code: string; message: string; stepId?: number }>;
  };
  completionReadiness: PublicationReadinessState;
  completionHandoff?: {
    id: number;
    publicationHandoffId: number;
    publicationPlanId: number;
    readinessState: string;
    createdAt: string;
  } | null;
  organizationId?: number;
};

export type OrgRole = "org_owner" | "org_admin" | "org_member" | "org_viewer" | string;
