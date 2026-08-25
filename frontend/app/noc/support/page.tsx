"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader
} from "@/components/noc/NocUi";
import { fetchNocSupport, type NocSupportItem } from "@/lib/nocApi";

export default function NocSupportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<NocSupportItem[]>([]);
  const [orgId, setOrgId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await fetchNocSupport({ organization_id: orgId || undefined, limit: 100 }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudo cargar soporte." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Support"
        eyebrow="form_submissions"
        meta="Listado seguro de envíos. Sin reply automation en Phase 5."
      />
      <FilterBar>
        <label>
          organization_id
          <input value={orgId} onChange={(e) => setOrgId(e.target.value)} />
        </label>
        <button type="button" className="noc-btn noc-btn--primary" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>
      {items.length === 0 ? (
        <NocEmpty title="Sin envíos." />
      ) : (
        <div className="noc-panel">
          <div className="noc-table-wrap">
            <table className="noc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Org</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Cuando</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      {s.organizationId ? (
                        <Link href={`/noc/organizations/${s.organizationId}`}>
                          {s.organizationName || s.organizationId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{s.type || "—"}</td>
                    <td>{s.title || "—"}</td>
                    <td>{s.status}</td>
                    <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
