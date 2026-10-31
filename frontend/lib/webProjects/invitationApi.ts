import API from "@/lib/api";
import type { WebProjectType } from "./types";

export type PublicInvitation = {
  displayName: string;
  projectType: WebProjectType;
  expiresAt: string;
  organizationLabel: string;
};

export async function resolveWebProjectInvitation(token: string): Promise<PublicInvitation> {
  const { data } = await API.get<{ invitation: PublicInvitation }>(
    "/api/web-project-invitations/resolve",
    { params: { token } }
  );
  return data.invitation;
}

export async function acceptWebProjectInvitation(input: {
  token: string;
  password?: string;
  name?: string;
}): Promise<{ projectId: number; redirectTo: string }> {
  const { data } = await API.post<{ projectId: number; redirectTo: string }>(
    "/api/web-project-invitations/accept",
    input
  );
  return data;
}
