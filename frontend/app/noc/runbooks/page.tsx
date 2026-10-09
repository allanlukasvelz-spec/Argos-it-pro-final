"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NocEmpty, NocError, NocLoading, NocPageHeader, SafetyLevelBadge } from "@/components/noc/NocUi";
import API from "@/lib/api";

type Runbook = {
  id: number;
  slug: string;
  name: string;
  description: string;
  automationMaxLevel: number;
  latestVersion: number | null;
};

export default function NocRunbooksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [selected, setSelected] = useState<{
    runbook: Runbook;
    versions: { id: number; version: number; steps: unknown; changelog: string }[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await API.get<{ runbooks: Runbook[] }>("/api/noc/runbooks");
      setRunbooks(data.runbooks || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: number) {
    const { data } = await API.get(`/api/noc/runbooks/${id}`);
    setSelected(data);
  }

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudieron cargar runbooks." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Runbooks"
        eyebrow="Phase 6 · versionados"
        meta="Planes tipados A/B/C. Sin comandos arbitrarios. Ejecución vía remediations."
      />
      {runbooks.length === 0 ? (
        <NocEmpty title="Sin runbooks activos." />
      ) : (
        <div className="noc-split">
          <div className="noc-panel">
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Slug</th>
                    <th>Max L</th>
                    <th>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {runbooks.map((rb) => (
                    <tr
                      key={rb.id}
                      className={selected?.runbook?.id === rb.id ? "noc-row--selected" : undefined}
                      onClick={() => void openDetail(rb.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{rb.name}</td>
                      <td>{rb.slug}</td>
                      <td>
                        <SafetyLevelBadge level={`L${rb.automationMaxLevel}`} />
                      </td>
                      <td>{rb.latestVersion ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="noc-panel">
            <div className="noc-panel__head">Detalle / pasos congelados</div>
            <div className="noc-panel__body">
              {!selected ? (
                <p className="noc-disclaimer">Selecciona un runbook. Luego planifica en Remediations.</p>
              ) : (
                <>
                  <p>
                    <strong>{selected.runbook.name}</strong>
                  </p>
                  <p className="noc-disclaimer">{selected.runbook.description}</p>
                  <p className="noc-disclaimer">
                    <Link href="/noc/remediations">Ir a Remediations →</Link>
                  </p>
                  <pre className="noc-evidence">
                    {JSON.stringify(selected.versions?.[0]?.steps || {}, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
