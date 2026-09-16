"use client";

import Link from "next/link";
import { useState } from "react";
import {
  resendNocWebProjectInvitation,
  revokeNocWebProjectInvitation,
  type NocInvitationCreateResult,
  type NocWebProjectInvitation
} from "@/lib/nocApi";
import { relativeTimeEs } from "@/lib/clientCopy";
import { webProjectErrorMessage } from "@/lib/webProjects/errors";
import {
  deliveryStatusLabel,
  invitationStatusLabel
} from "@/lib/webProjects/invitationUi";
import { projectTypeLabel } from "@/lib/webProjects/labels";
import { nocProjectHref } from "@/lib/webProjects/nocWorkflow";

export function NocInvitationList({
  items,
  onChanged
}: {
  items: NocWebProjectInvitation[];
  onChanged: (result?: NocInvitationCreateResult) => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRevoke(id: number) {
    if (!window.confirm("¿Revocar esta invitación pendiente?")) return;
    setBusyId(id);
    setError(null);
    try {
      await revokeNocWebProjectInvitation(id);
      onChanged();
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onResend(id: number) {
    setBusyId(id);
    setError(null);
    try {
      const result = await resendNocWebProjectInvitation(id);
      onChanged(result);
    } catch (err) {
      setError(webProjectErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="noc-disclaimer">No hay invitaciones{error ? ` · ${error}` : ""}.</p>
    );
  }

  return (
    <div className="noc-panel">
      <div className="noc-panel__head">Invitaciones</div>
      <div className="noc-table-wrap">
        {error ? (
          <p className="noc-disclaimer" role="alert">
            {error}
          </p>
        ) : null}
        <table className="noc-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Envío</th>
              <th>Creada</th>
              <th>Caduca</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.displayName}</td>
                <td>{item.email}</td>
                <td>{projectTypeLabel(item.projectType)}</td>
                <td>{invitationStatusLabel(item.status)}</td>
                <td>{deliveryStatusLabel(item.deliveryStatus)}</td>
                <td>{relativeTimeEs(item.createdAt)}</td>
                <td>{relativeTimeEs(item.expiresAt)}</td>
                <td>
                  <div className="noc-actions">
                    {item.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          className="noc-btn"
                          disabled={busyId === item.id}
                          onClick={() => void onResend(item.id)}
                        >
                          Reenviar
                        </button>
                        <button
                          type="button"
                          className="noc-btn"
                          disabled={busyId === item.id}
                          onClick={() => void onRevoke(item.id)}
                        >
                          Revocar
                        </button>
                      </>
                    ) : null}
                    {item.status === "ACCEPTED" && item.webProjectId && item.organizationId ? (
                      <Link href={nocProjectHref(item.webProjectId, item.organizationId)}>
                        Abrir proyecto
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
