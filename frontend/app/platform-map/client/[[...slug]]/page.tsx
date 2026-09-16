import ClientPortalDemo from "@/components/platform-map/ClientPortalDemo";

export default async function PlatformMapClientPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <ClientPortalDemo slug={slug ?? []} />;
}
