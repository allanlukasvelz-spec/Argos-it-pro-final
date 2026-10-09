"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EvidencePanel,
  FilterBar,
  NocEmpty,
  NocError,
  NocLoading,
  NocPageHeader,
  SafetyLevelBadge,
  SeverityBadge
} from "@/components/noc/NocUi";
import API from "@/lib/api";

type Remediation = {
  id: number;
  organizationId: number;
  incidentId: number | null;
  letter: string;
  actionType: string;
  safetyLevel: string;
  state: string;
  hypothesis: string | null;
  confidence: string | null;
  expectedResult: string | null;
  verificationPlan: unknown;
  rollbackPlan: unknown;
  warnings: unknown;
  createdAt: string;
};

type ActionMeta = { type: string; safetyLevel: string; description: string };

export default function NocRemediationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<Remediation[]>([]);
  const [actions, setActions] = useState<ActionMeta[]>([]);
  const [selected, setSelected] = useState<Remediation | null>(null);
  const [events, setEvents] = useState<unknown[]>([]);
  const [dryPlan, setDryPlan] = useState<unknown>(null);
  const [message, setMessage] = useState<string>("");
  const [orgId, setOrgId] = useState("");
  const [planForm, setPlanForm] = useState({
    organizationId: "",
    runbookId: "",
    actionType: "TEST_SET_FLAG",
    flagKey: "demo",
    flagValue: "on",
    letter: "A"
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : "";
      const [r, a] = await Promise.all([
        API.get<{ remediations: Remediation[] }>(`/api/noc/remediations${q}`),
        API.get<{ actions: ActionMeta[] }>("/api/noc/actions")
      ]);
      setItems(r.data.remediations || []);
      setActions(a.data.actions || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function selectRow(row: Remediation) {
    setSelected(row);
    setDryPlan(null);
    setMessage("");
    try {
      const { data } = await API.get(`/api/noc/remediations/${row.id}`);
      setEvents(data.events || []);
      setSelected(data.remediation);
    } catch {
      setMessage("No se pudo cargar el detalle.");
    }
  }

  async function doDryRun() {
    if (!selected) return;
    setMessage("");
    try {
      const { data } = await API.post("/api/noc/remediations/dry-run", {
        executionId: selected.id
      });
      setDryPlan(data.plan);
      setMessage(data.ok ? "Dry-run OK (sin mutación)." : `Dry-run bloqueado: ${data.code}`);
      await selectRow(selected);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string; code?: string } } };
      setMessage(err.response?.data?.error || "Error en dry-run");
    }
  }

  async function doExecute() {
    if (!selected) return;
    setMessage("");
    try {
      const { data } = await API.post(`/api/noc/remediations/${selected.id}/execute`, {});
      setMessage(
        data.ok
          ? `Ejecutado · ${data.verification}`
          : `Falló · ${data.code || "ver timeline"}`
      );
      await selectRow(selected);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMessage(err.response?.data?.error || "Error en execute");
    }
  }

  async function doRollback() {
    if (!selected) return;
    try {
      const { data } = await API.post(`/api/noc/remediations/${selected.id}/rollback`, {});
      setMessage(data.ok ? "Rollback OK" : `Rollback: ${data.code}`);
      await selectRow(selected);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMessage(err.response?.data?.error || "Error en rollback");
    }
  }

  async function doSafeStop() {
    if (!selected) return;
    try {
      await API.post(`/api/noc/remediations/${selected.id}/safe-stop`, {
        reason: "operator_ui"
      });
      setMessage("SAFE_STOP registrado");
      await selectRow(selected);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMessage(err.response?.data?.error || "Error");
    }
  }

  async function doPlan() {
    setMessage("");
    try {
      const body: Record<string, unknown> = {
        organizationId: Number(planForm.organizationId),
        runbookId: Number(planForm.runbookId),
        actionType: planForm.actionType,
        letter: planForm.letter,
        input:
          planForm.actionType.startsWith("TEST_")
            ? { flagKey: planForm.flagKey, flagValue: planForm.flagValue }
            : {}
      };
      const { data } = await API.post("/api/noc/remediations/plan", body);
      setMessage(`Plan creado #${data.remediation?.id}`);
      await load();
      if (data.remediation) await selectRow(data.remediation);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setMessage(err.response?.data?.error || "Error al planificar");
    }
  }

  if (loading) return <NocLoading />;
  if (error) return <NocError title="No se pudieron cargar remediaciones." onRetry={load} />;

  return (
    <div>
      <NocPageHeader
        title="Remediations"
        eyebrow="Phase 6 · typed · dry-run first"
        meta="Verbos: Inspect · Dry run · Request approval · Execute approved · Verify · Rollback. Sin Auto Fix."
      />

      <div className="noc-panel">
        <div className="noc-panel__head">Planificar ejecución (allowlist)</div>
        <div className="noc-panel__body">
          <FilterBar>
            <label>
              organizationId
              <input
                value={planForm.organizationId}
                onChange={(e) => setPlanForm({ ...planForm, organizationId: e.target.value })}
              />
            </label>
            <label>
              runbookId
              <input
                value={planForm.runbookId}
                onChange={(e) => setPlanForm({ ...planForm, runbookId: e.target.value })}
              />
            </label>
            <label>
              actionType
              <select
                value={planForm.actionType}
                onChange={(e) => setPlanForm({ ...planForm, actionType: e.target.value })}
              >
                {actions.map((a) => (
                  <option key={a.type} value={a.type}>
                    {a.type} ({a.safetyLevel})
                  </option>
                ))}
              </select>
            </label>
            <label>
              letter
              <select
                value={planForm.letter}
                onChange={(e) => setPlanForm({ ...planForm, letter: e.target.value })}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </label>
            {planForm.actionType.startsWith("TEST_") ? (
              <>
                <label>
                  flagKey
                  <input
                    value={planForm.flagKey}
                    onChange={(e) => setPlanForm({ ...planForm, flagKey: e.target.value })}
                  />
                </label>
                <label>
                  flagValue
                  <input
                    value={planForm.flagValue}
                    onChange={(e) => setPlanForm({ ...planForm, flagValue: e.target.value })}
                  />
                </label>
              </>
            ) : null}
            <button type="button" className="noc-btn noc-btn--primary" onClick={() => void doPlan()}>
              Planificar
            </button>
          </FilterBar>
          <p className="noc-disclaimer">
            L0/L1 = rechecks ARGOS. L2 = solo simulador. L3 = aprobación servidor. L4 = imposible.
          </p>
        </div>
      </div>

      <FilterBar>
        <label>
          Filtrar organization_id
          <input value={orgId} onChange={(e) => setOrgId(e.target.value)} />
        </label>
        <button type="button" className="noc-btn" onClick={() => void load()}>
          Filtrar
        </button>
      </FilterBar>

      {message ? <p className="noc-disclaimer">{message}</p> : null}

      {items.length === 0 ? (
        <NocEmpty title="Sin ejecuciones." description="Planifica desde un runbook tipado." />
      ) : (
        <div className="noc-split">
          <div className="noc-panel">
            <div className="noc-table-wrap">
              <table className="noc-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Org</th>
                    <th>Letter</th>
                    <th>Action</th>
                    <th>Level</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr
                      key={r.id}
                      className={selected?.id === r.id ? "noc-row--selected" : undefined}
                      onClick={() => void selectRow(r)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{r.id}</td>
                      <td>{r.organizationId}</td>
                      <td>{r.letter}</td>
                      <td>{r.actionType}</td>
                      <td>
                        <SafetyLevelBadge level={r.safetyLevel} />
                      </td>
                      <td>
                        <SeverityBadge
                          severity={
                            r.state === "FAILED" || r.state === "SAFE_STOPPED"
                              ? "CRITICAL"
                              : r.state === "SUCCEEDED"
                                ? "WARNING"
                                : "UNKNOWN"
                          }
                        />{" "}
                        {r.state}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            {selected ? (
              <>
                <div className="noc-panel">
                  <div className="noc-panel__head">Why this action</div>
                  <div className="noc-panel__body">
                    <p>
                      <SafetyLevelBadge level={selected.safetyLevel} /> {selected.actionType} ·{" "}
                      {selected.letter}
                    </p>
                    <p className="noc-disclaimer">
                      Hypothesis: {selected.hypothesis || "—"} · Confidence:{" "}
                      {selected.confidence || "UNKNOWN"}
                    </p>
                    <p className="noc-disclaimer">Expected: {selected.expectedResult || "—"}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                      <button type="button" className="noc-btn" onClick={() => void doDryRun()}>
                        Dry run
                      </button>
                      <button type="button" className="noc-btn noc-btn--primary" onClick={() => void doExecute()}>
                        Execute
                      </button>
                      <button type="button" className="noc-btn" onClick={() => void doRollback()}>
                        Rollback
                      </button>
                      <button type="button" className="noc-btn" onClick={() => void doSafeStop()}>
                        Safe stop
                      </button>
                    </div>
                  </div>
                </div>
                <EvidencePanel evidence={dryPlan || selected.verificationPlan} title="Dry-run / verification plan" />
                <EvidencePanel evidence={selected.rollbackPlan} title="Rollback plan" />
                <EvidencePanel evidence={events} title="Timeline de eventos" />
              </>
            ) : (
              <div className="noc-panel">
                <div className="noc-panel__body">
                  <p className="noc-disclaimer">Selecciona una ejecución.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
