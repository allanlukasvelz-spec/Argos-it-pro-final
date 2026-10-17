import CoreArchitecture from "@/components/platform-map/CoreArchitecture";

export default async function PlatformMapCorePage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <CoreArchitecture section={slug?.[0]} />;
}
