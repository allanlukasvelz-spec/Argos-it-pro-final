import PublicExperience from "@/components/platform-map/PublicExperience";

export default async function PlatformMapPublicPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <PublicExperience slug={slug ?? []} />;
}
