"use client";

import { useCallback, useEffect, useState } from "react";
import { ChicoGuardian } from "@/components/client/ChicoGuardian";
import { PageHeader } from "@/components/client/Status";
import { fetchGuardian } from "@/lib/clientApi";

export function useChicoGuardian() {
  const [guardian, setGuardian] = useState<Awaited<ReturnType<typeof fetchGuardian>>["chico"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const g = await fetchGuardian();
      setGuardian(g.chico);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { guardian, loading, error, reload: load };
}

export function ChicoGuardianBanner({ stronger = false }: { stronger?: boolean }) {
  const { guardian, loading, error, reload } = useChicoGuardian();
  if (loading) return null;
  if (error) {
    return (
      <p className="chico-guardian__message" style={{ marginBottom: "1rem", color: "var(--cp-muted)" }}>
        No se ha podido cargar el estado de CHICO.{" "}
        <button type="button" onClick={() => void reload()} style={{ textDecoration: "underline" }}>
          Reintentar
        </button>
      </p>
    );
  }
  return <ChicoGuardian guardian={guardian} compact={!stronger} />;
}

export function ChicoSecurityPageChrome({
  title,
  eyebrow,
  meta,
  stronger,
  children
}: {
  title: string;
  eyebrow: string;
  meta?: string;
  stronger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} eyebrow={eyebrow} meta={meta} />
      <ChicoGuardianBanner stronger={stronger} />
      {children}
    </div>
  );
}
