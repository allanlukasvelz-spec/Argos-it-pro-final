import type { ReactNode } from "react";

type Variant = "default" | "service" | "method" | "pillar" | "quiet";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  as?: "article" | "div" | "li";
};

const variantClass: Record<Variant, string> = {
  default: "argos-card",
  service: "argos-card argos-card--service",
  method: "argos-card argos-card--method",
  pillar: "argos-card argos-card--pillar",
  quiet: "argos-card argos-card--quiet"
};

export default function ArgosCard({
  children,
  className = "",
  variant = "default",
  as: Tag = "article"
}: Props) {
  return (
    <Tag className={`${variantClass[variant]} ${className}`.trim()}>{children}</Tag>
  );
}
