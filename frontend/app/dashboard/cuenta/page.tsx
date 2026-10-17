"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
  StatusBadge
} from "@/components/client/Status";
import { fetchPortal } from "@/lib/clientApi";
import type { ClientPortalPayload } from "@/lib/clientTypes";

export default function CuentaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [portal, setPortal] = useState<ClientPortalPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPortal(await fetchPortal());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Cargando cuenta…" />;
  if (error || !portal) {
    return <ErrorState title="No se ha podido cargar la cuenta." onRetry={load} />;
  }

  const user = portal.user;
  const org = portal.organization;

  return (
    <div>
      <PageHeader
        title="Cuenta"
        eyebrow="Perfil"
        meta="Solo capacidades reales del modelo Phase 1. Sin administración de organización avanzada."
      />

      <div className="cp-grid cp-grid--2" style={{ marginBottom: "1rem" }}>
        <MetricCard label="Usuario" value={user.name || user.email} hint={user.email} />
        <MetricCard
          label="Organización"
          value={org?.name || portal.companyProfile?.name || "—"}
          hint={org ? `${org.slug} · rol ${org.orgRole}` : "Sin org en payload"}
        />
      </div>

      <div className="cp-card">
        <p>
          Rol global: <strong>{user.role}</strong>
        </p>
        <p>
          Verificación:{" "}
          {user.clientVerified || portal.clientVerified ? (
            <StatusBadge status="HEALTHY" label="Cuenta verificada" />
          ) : (
            <StatusBadge status="WARNING" label="Verificación pendiente" />
          )}
        </p>
        <p className="cp-disclaimer">
          org_admin ≠ administrador global ARGOS. No hay conmutador de organización: el backend
          resuelve el tenant por membresía.
        </p>
        <p className="cp-disclaimer">
          Contacto perfil: {portal.companyProfile?.contactEmail || "—"} · Estado:{" "}
          {portal.companyProfile?.status || "—"}
        </p>
        {portal.companyProfile?.nextStep ? (
          <p className="cp-disclaimer">Siguiente paso: {portal.companyProfile.nextStep}</p>
        ) : null}
      </div>
    </div>
  );
}
