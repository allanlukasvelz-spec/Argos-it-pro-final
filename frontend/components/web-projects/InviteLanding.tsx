"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useAuthStore } from "@/lib/auth";
import { projectTypeLabel } from "@/lib/webProjects/labels";
import {
  INVITE_CTA,
  INVITE_GENERIC_INVALID,
  INVITE_LANDING_BODY,
  INVITE_LANDING_TITLE,
  INVITE_WRONG_ACCOUNT,
  inviteTokenStorageKey,
  isSafeInviteRedirect
} from "@/lib/webProjects/invitationUi";
import { acceptWebProjectInvitation, resolveWebProjectInvitation, type PublicInvitation } from "@/lib/webProjects/invitationApi";
import { readClientApiError } from "@/lib/webProjects/errors";

export function InviteLanding({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const authenticated = useAuthStore((state) => state.authenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [token, setToken] = useState(initialToken);
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(inviteTokenStorageKey()) || initialToken;
    if (stored) {
      sessionStorage.setItem(inviteTokenStorageKey(), stored);
      setToken(stored);
      if (typeof window !== "undefined" && window.location.search.includes("token=")) {
        window.history.replaceState(null, "", "/auth/invite");
      }
    }
    if (!stored) {
      setError(INVITE_GENERIC_INVALID);
      setLoading(false);
      return;
    }
    void resolveWebProjectInvitation(stored)
      .then((item) => {
        setInvitation(item);
        setError(null);
      })
      .catch(() => {
        setInvitation(null);
        setError(INVITE_GENERIC_INVALID);
      })
      .finally(() => setLoading(false));
  }, [initialToken]);

  async function onAccept(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const accepted = await acceptWebProjectInvitation({
        token,
        password: authenticated ? undefined : password || undefined
      });
      if (!isSafeInviteRedirect(accepted.redirectTo)) {
        throw new Error(INVITE_GENERIC_INVALID);
      }
      sessionStorage.removeItem(inviteTokenStorageKey());
      if (!authenticated) {
        login({ name: invitation?.displayName });
      }
      router.replace(accepted.redirectTo);
    } catch (err) {
      const parsed = readClientApiError(err);
      if (parsed.code === "WRONG_ACCOUNT") {
        setError(INVITE_WRONG_ACCOUNT);
      } else if (parsed.code === "LOGIN_REQUIRED") {
        setError("Si ya tienes cuenta, inicia sesión para continuar.");
      } else if (parsed.code === "SETUP_REQUIRED") {
        setError("Crea tu acceso con una contraseña de al menos 10 caracteres, con mayúsculas, minúsculas y números.");
      } else {
        setError(INVITE_GENERIC_INVALID);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ArgosPageShell variant="portal">
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-xl shadow-[#0B1E33]/10">
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-[#2563EB]">ARGOS-IT</p>
        <h1 className="mb-2 text-center text-2xl font-black text-[#0B1E33]">{INVITE_LANDING_TITLE}</h1>
        <p className="mb-6 text-center text-[#4B5563]">{INVITE_LANDING_BODY}</p>
        {loading ? <p className="text-center text-[#4B5563]">Comprobando invitación…</p> : null}
        {!loading && error && !invitation ? <p className="text-center text-[#B91C1C]" role="alert">{error}</p> : null}
        {invitation ? (
          <>
            <p className="mb-1 text-center font-semibold text-[#0B1E33]">
              {invitation.displayName}
              {invitation.organizationLabel ? ` · ${invitation.organizationLabel}` : ""}
            </p>
            <p className="mb-4 text-center text-[#4B5563]">{projectTypeLabel(invitation.projectType)}</p>
            {error ? (
              <p className="mb-4 text-center text-[#B91C1C]" role="alert">{error}</p>
            ) : null}
            {authenticated ? (
              <form className="space-y-3" onSubmit={(e) => void onAccept(e)}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded border border-[#2563EB] bg-[#2563EB] p-3 font-black text-white transition hover:bg-[#1D4ED8] disabled:bg-[#93C5FD]"
                >
                  {submitting ? "Abriendo…" : INVITE_CTA}
                </button>
                <button
                  type="button"
                  className="w-full rounded border border-[#E5E7EB] p-3 text-[#0B1E33]"
                  onClick={() => logout()}
                >
                  Usar otra cuenta
                </button>
              </form>
            ) : (
              <>
                <p className="mb-4 text-center text-[#4B5563]">
                  Si ya tienes cuenta,{" "}
                  <Link href="/auth/login" className="text-[#2563EB] hover:underline">
                    inicia sesión
                  </Link>{" "}
                  y vuelve a esta página.
                </p>
                <form className="space-y-3" onSubmit={(e) => void onAccept(e)}>
                  <label htmlFor="invite-password" className="sr-only">
                    Crea tu acceso
                  </label>
                  <input
                    id="invite-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Crea tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={10}
                    required
                    className="w-full rounded border border-[#E5E7EB] bg-white p-3 text-[#07111F] outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded border border-[#2563EB] bg-[#2563EB] p-3 font-black text-white transition hover:bg-[#1D4ED8] disabled:bg-[#93C5FD]"
                  >
                    {submitting ? "Creando acceso…" : INVITE_CTA}
                  </button>
                </form>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
    </ArgosPageShell>
  );
}
