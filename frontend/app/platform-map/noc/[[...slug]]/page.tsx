import NocDemo from "@/components/platform-map/NocDemo";

export default async function PlatformMapNocPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <NocDemo slug={slug ?? []} />;
}
