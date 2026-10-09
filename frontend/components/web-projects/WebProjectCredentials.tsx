import { credentialStatusLabel } from "@/lib/webProjects/labels";
import type { WebProjectCredentialStatus } from "@/lib/webProjects/types";

export function WebProjectCredentials({ status }: { status?: WebProjectCredentialStatus | null }) {
  const value = status?.status || "NONE";
  return (
    <section className="cp-card" aria-labelledby="wp-cred-heading">
      <h2 id="wp-cred-heading" className="wp-section-title">
        Accesos técnicos
      </h2>
      <p>
        Estado: <strong>{credentialStatusLabel(value)}</strong>
      </p>
      <p className="cp-disclaimer">
        Si ARGOS necesita accesos, se pedirán por un canal seguro fuera de esta pantalla. No escribas
        contraseñas, tokens ni claves aquí.
      </p>
    </section>
  );
}
