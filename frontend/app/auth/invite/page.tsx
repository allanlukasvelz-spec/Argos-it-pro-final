import type { Metadata } from "next";
import { InviteLanding } from "@/components/web-projects/InviteLanding";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false }
};

export default async function InvitePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <InviteLanding initialToken={String(params.token || "")} />;
}
