import type { HonestyLabel } from "@/lib/platform-map/types";

type Props = {
  kind?: HonestyLabel;
  children?: string;
};

export default function MockLabel({ kind = "DEMO", children }: Props) {
  return <span className={`pm-badge pm-badge--${kind}`}>{children || kind}</span>;
}
