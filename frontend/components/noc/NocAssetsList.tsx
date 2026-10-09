"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader
} from "@/components/noc/NocUi";
import { fetchNocAssets, type NocAsset } from "@/lib/nocApi";

export function NocAssetsList({
  forcedType,
  title = "Assets",
  eyebrow = "Cross-tenant"
}: {
  forcedType?: string;
  title?: string;
  eyebrow?: string;
}) {
  const search = useSearchParams();
  const orgFromUrl = search.get("organization_id") || "";
  const [orgId, setOrgId] = useState(orgFromUrl);
  const [type, setType] = useState(forcedType || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [assets, setAssets] = useState<NocAsset[]>([]);

  const filters = useMemo(
    () => ({
      organization_id: orgId || undefined,
      type: type || undefined,
      limit: 100
    }),
    [orgId, type]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setAssets(await fetchNocAssets(filters));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudieron listar activos." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title={title}
        eyebrow={eyebrow}
        meta="Incluye organizationName. Filtro opcional por organización y tipo."
      />
      <FilterBar>
        <label>
          organization_id
          <input
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="opcional"
          />
        </label>
        {!forcedType ? (
          <label>
            type
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="DOMAIN, SERVER…"
            />
          </label>
        ) : null}
        <button type="button" className="noc-btn noc-btn--primary" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>
      {assets.length === 0 ? (
        <NocEmpty title="Sin activos en el filtro." />
      ) : (
        <div className="noc-panel">
          <div className="noc-table-wrap">
            <table className="noc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Org</th>
                  <th>Tipo</th>
                  <th>Hostname</th>
                  <th>Nombre</th>
                  <th>Env</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>
                      <Link href={`/noc/organizations/${a.organizationId}`}>
                        {a.organizationName || a.organizationId}
                      </Link>
                    </td>
                    <td>{a.type}</td>
                    <td>{a.hostname || "—"}</td>
                    <td>{a.name || "—"}</td>
                    <td>{a.environment || "—"}</td>
                    <td>{a.status}</td>
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
