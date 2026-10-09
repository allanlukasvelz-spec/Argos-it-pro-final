import type { ProtectionStatus } from "@/lib/platform-map/types";
import MockLabel from "./MockLabel";

type Props = {
  status: ProtectionStatus;
  demoProtected?: boolean;
};

export default function StatusBadge({ status, demoProtected }: Props) {
  if (status === "PROTECTED") {
    return (
      <span>
        <MockLabel kind="DEMO">PROTECTED · DEMO</MockLabel>
        {demoProtected ? (
          <span className="pm-lead" style={{ display: "block", marginTop: 6, fontSize: "0.78rem" }}>
            PROTECTED solo puede mostrarse como DEMO: no hay evidencia real en esta maqueta.
          </span>
        ) : null}
      </span>
    );
  }

  if (status === "UNKNOWN") {
    return <MockLabel kind="UNKNOWN">UNKNOWN</MockLabel>;
  }

  return <span className={`pm-badge pm-badge--${status}`}>{status}</span>;
}
