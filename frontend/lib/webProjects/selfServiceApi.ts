import API from "@/lib/api";
import type { WebProject } from "@/lib/clientTypes";
import type { ProjectTypeChoice } from "./selfServiceUi";

export type SelfServiceOrganization = {
  id: number;
  name: string;
  canCreate: boolean;
};

export type SelfServiceIntakeProject = {
  id: number;
  title: string;
  projectType: ProjectTypeChoice;
  organizationId: number;
  organizationName: string;
};

export type SelfServiceContext = {
  organizations: SelfServiceOrganization[];
  intakeProjects: SelfServiceIntakeProject[];
  defaultOrganizationId: number | null;
};

export type SelfServiceStartResult = {
  project: WebProject;
  organization: { id: number; name: string; created: boolean };
  created: boolean;
  reused: boolean;
  policy: string;
};

export async function fetchSelfServiceContext(): Promise<SelfServiceContext> {
  const { data } = await API.get<SelfServiceContext>("/api/client/web-projects/self-service");
  return data;
}

export async function startSelfServiceProject(input: {
  projectType: ProjectTypeChoice;
  title?: string;
  organizationName?: string;
  organizationId?: number | null;
  createOrganization?: boolean;
  idempotencyKey: string;
}): Promise<SelfServiceStartResult> {
  const { data } = await API.post<SelfServiceStartResult>(
    "/api/client/web-projects/self-service",
    {
      projectType: input.projectType,
      title: input.title || undefined,
      organizationName: input.organizationName || undefined,
      organizationId: input.organizationId || undefined,
      createOrganization: input.createOrganization || undefined,
      idempotencyKey: input.idempotencyKey
    }
  );
  return data;
}
