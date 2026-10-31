"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import API from "@/lib/api";
import { NocPageHeader } from "@/components/noc/NocUi";

type AgentRow = {
  id: number;
  organizationId: number;
  organizationName?: string | null;
  assetId: number;
  assetHostname?: string | null;
  name: string;
  status: string;
  capabilities?: string[];
  agentVersion?: string | null;
  lastSeenAt?: string | null;
};

type AgentDetail = {
  agent: AgentRow;
  heartbeats: { seq: number; receivedAt: string }[];
  observations: { id: number; type: string; receivedAt: string; measurement: unknown }[];
  securityEvents: { id: number; kind: string; severity: string; createdAt: string }[];
};

function StatusLabel({ status }: { status: string }) {
  return (
    <span className="noc-badge" data-status={status}>
      {status}
    </span>
  );
}

export default function NocAgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollOrg, setEnrollOrg] = useState("");
  const [enrollAsset, setEnrollAsset] = useState("");
  const [enrollToken, setEnrollToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await API.get<{ agents: AgentRow[] }>("/api/noc/agents");
      setAgents(data.agents || []);
    } catch {
      setError("No se pudo cargar agentes (requiere rol NOC).");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selected == null) {
      setDetail(null);
      return;
    }
    void (async () => {
      try {
        const { data } = await API.get<AgentDetail>(`/api/noc/agents/${selected}`);
        setDetail(data);
      } catch {
        setDetail(null);
      }
    })();
  }, [selected]);

  async function onEnroll(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setEnrollToken(null);
    try {
      const { data } = await API.post<{ token: string }>("/api/noc/agents/enrollments", {
        organizationId: Number(enrollOrg),
        assetId: Number(enrollAsset)
      });
      setEnrollToken(data.token);
      await load();
    } catch {
      setError("No se pudo crear el token de enrollment.");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: number) {
    if (!window.confirm(`Revocar agente #${id}?`)) return;
    setBusy(true);
    try {
      await API.post(`/api/noc/agents/${id}/revoke`);
      await load();
      if (selected === id) setSelected(null);
    } catch {
      setError("Revocación fallida.");
    } finally {
      setBusy(false);
    }
  }

  async function onRotate(id: number) {
    if (!window.confirm(`Rotar credencial del agente #${id}? Se mostrará una sola vez.`)) return;
    setBusy(true);
    try {
      const { data } = await API.post<{ credential: string }>(`/api/noc/agents/${id}/rotate`);
      window.alert(`Nueva credencial (una vez):\n${data.credential}`);
      await load();
    } catch {
      setError("Rotación fallida.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <NocPageHeader
        title="Agents"
        eyebrow="Phase 7 · observación remota"
        meta="Solo telemetría tipada. Sin shell, SQL ni remediación remota."
      />

      {error ? <p className="noc-error">{error}</p> : null}

      <section className="noc-card" style={{ marginBottom: "1rem" }}>
        <h2 className="noc-section-title">Crear enrollment</h2>
        <form onSubmit={onEnroll} className="noc-form-row">
          <label>
            Org ID
            <input value={enrollOrg} onChange={(e) => setEnrollOrg(e.target.value)} required />
          </label>
          <label>
            Asset ID
            <input value={enrollAsset} onChange={(e) => setEnrollAsset(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy} className="noc-btn">
            Emitir token
          </button>
        </form>
        {enrollToken ? (
          <p className="noc-mono" style={{ marginTop: "0.75rem" }}>
            Token (una vez): <code>{enrollToken}</code>
          </p>
        ) : null}
      </section>

      <div className="noc-split">
        <section className="noc-card">
          <h2 className="noc-section-title">Agentes</h2>
          <table className="noc-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Org</th>
                <th>Asset</th>
                <th>Status</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  style={{ cursor: "pointer" }}
                  data-selected={selected === a.id ? "1" : undefined}
                >
                  <td>{a.id}</td>
                  <td>{a.organizationName || a.organizationId}</td>
                  <td>{a.assetHostname || a.assetId}</td>
                  <td>
                    <StatusLabel status={a.status} />
                  </td>
                  <td>{a.lastSeenAt ? new Date(a.lastSeenAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={5}>Sin agentes. Crea un enrollment e instala el agente de referencia.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="noc-card">
          <h2 className="noc-section-title">Detalle</h2>
          {!detail ? (
            <p>Selecciona un agente.</p>
          ) : (
            <div>
              <p>
                <strong>{detail.agent.name}</strong> · v{detail.agent.agentVersion || "?"}
              </p>
              <p className="noc-mono">caps: {(detail.agent.capabilities || []).join(", ")}</p>
              <div style={{ display: "flex", gap: "0.5rem", margin: "0.75rem 0" }}>
                <button type="button" className="noc-btn" disabled={busy} onClick={() => void onRotate(detail.agent.id)}>
                  Rotar credencial
                </button>
                <button
                  type="button"
                  className="noc-btn noc-btn--danger"
                  disabled={busy || detail.agent.status === "REVOKED"}
                  onClick={() => void onRevoke(detail.agent.id)}
                >
                  Revocar
                </button>
              </div>
              <h3 className="noc-section-title">Heartbeats</h3>
              <ul className="noc-list">
                {detail.heartbeats.slice(0, 8).map((h) => (
                  <li key={h.seq}>
                    seq {h.seq} · {new Date(h.receivedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
              <h3 className="noc-section-title">Observaciones</h3>
              <ul className="noc-list">
                {detail.observations.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    {o.type} · {new Date(o.receivedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
              <h3 className="noc-section-title">Security events</h3>
              <ul className="noc-list">
                {detail.securityEvents.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    {e.severity} {e.kind}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
