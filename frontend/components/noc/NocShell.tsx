"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth";
import { fetchNocMe, fetchNocPlatformHealth, type NocPlatformHealth } from "@/lib/nocApi";

type NavItem = { href: string; label: string; placeholder?: boolean };
type NavSection = { title: string; items: NavItem[] };

export const NOC_NAV: NavSection[] = [
  {
    title: "Operaciones",
    items: [
      { href: "/noc", label: "Command Center" },
      { href: "/noc/organizations", label: "Organizations" },
      { href: "/noc/assets", label: "Assets" },
      { href: "/noc/health", label: "Global Health" },
      { href: "/noc/monitoring", label: "Monitoring" },
      { href: "/noc/alerts", label: "Alerts" },
      { href: "/noc/incidents", label: "Incidents" }
    ]
  },
  {
    title: "Infra",
    items: [
      { href: "/noc/tls", label: "TLS" },
      { href: "/noc/servers", label: "Servers" },
      { href: "/noc/databases", label: "Databases" },
      { href: "/noc/dns", label: "DNS" },
      { href: "/noc/backups", label: "Backups", placeholder: true }
    ]
  },
  {
    title: "Automatización",
    items: [
      { href: "/noc/predicted-risks", label: "Predicted Risks", placeholder: true },
      { href: "/noc/preventive-actions", label: "Preventive Actions", placeholder: true },
      { href: "/noc/agents", label: "Agents" },
      { href: "/noc/runbooks", label: "Runbooks" },
      { href: "/noc/remediations", label: "Remediations" },
      { href: "/noc/reports", label: "Reports" }
    ]
  },
  {
    title: "Plataforma",
    items: [
      { href: "/noc/audit", label: "Audit Log" },
      { href: "/noc/platform-health", label: "Platform Health" },
      { href: "/noc/support", label: "Support" }
    ]
  }
];

function navCurrent(pathname: string, href: string) {
  if (href === "/noc") return pathname === "/noc";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NocShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/noc";
  const router = useRouter();
  const { authenticated, logout, user } = useAuthStore();
  const [gate, setGate] = useState<"loading" | "ok" | "deny">("loading");
  const [role, setRole] = useState<string | null>(null);
  const [platform, setPlatform] = useState<NocPlatformHealth | null>(null);

  useEffect(() => {
    if (!authenticated) {
      router.push("/auth/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchNocMe();
        if (cancelled) return;
        if (!me.allowed) {
          setGate("deny");
          return;
        }
        setRole(me.role);
        setGate("ok");
        try {
          setPlatform(await fetchNocPlatformHealth());
        } catch {
          setPlatform({
            status: "DEGRADED",
            db: "unknown",
            meaning: "No se pudo leer platform health.",
            timestamp: new Date().toISOString()
          });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403 || status === 401) {
          setGate("deny");
        } else {
          setGate("deny");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, router]);

  async function onLogout() {
    await logout();
    router.push("/");
  }

  if (!authenticated || gate === "loading") {
    return (
      <div className="argos-noc">
        <div className="noc-state">
          <p className="noc-state__title">Comprobando acceso NOC…</p>
        </div>
      </div>
    );
  }

  if (gate === "deny") {
    return (
      <div className="argos-noc">
        <div className="noc-deny" role="alert">
          <h1>Acceso NOC denegado</h1>
          <p>
            Esta consola requiere rol <code>admin</code> o <code>super_admin</code>. Los roles de
            cliente y <code>org_admin</code> no tienen acceso.
          </p>
          <p className="noc-disclaimer">Código: NOC_FORBIDDEN</p>
          <p style={{ marginTop: "1rem" }}>
            <Link href="/dashboard">Ir al portal de cliente</Link>
            {" · "}
            <button type="button" className="noc-btn" onClick={onLogout}>
              Cerrar sesión
            </button>
          </p>
        </div>
      </div>
    );
  }

  const chipOk = platform?.status === "OK";

  return (
    <div className="argos-noc">
      <a className="noc-skip" href="#noc-main">
        Saltar al contenido
      </a>
      <div className="noc-shell">
        <header className="noc-topbar" role="banner">
          <Link className="noc-topbar__brand" href="/noc">
            ARGOS NOC
          </Link>
          <div className="noc-topbar__meta">
            <span
              className={chipOk ? "noc-chip noc-chip--ok" : "noc-chip noc-chip--degraded"}
              title={platform?.meaning}
            >
              Platform {platform?.status || "…"}
            </span>
            <span>
              {user?.email || "operador"}
              {role ? ` · ${role}` : ""}
            </span>
            <button type="button" className="noc-btn" onClick={onLogout}>
              Salir
            </button>
          </div>
        </header>

        <nav className="noc-sidebar" aria-label="NOC">
          {NOC_NAV.map((section) => (
            <div key={section.title}>
              <p className="noc-sidebar__section">{section.title}</p>
              <div className="noc-nav">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={navCurrent(pathname, item.href) ? "page" : undefined}
                    className={item.placeholder ? "noc-nav--placeholder" : undefined}
                  >
                    {item.label}
                    {item.placeholder ? " · soon" : ""}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main id="noc-main" className="noc-main">
          {children}
        </main>
      </div>
    </div>
  );
}
