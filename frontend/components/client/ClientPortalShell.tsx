"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth";
import { ClientNotificationsBell } from "@/components/client/ClientNotificationsBell";
import { useRouter } from "next/navigation";
import { fetchPortal } from "@/lib/clientApi";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  children?: { id: string; label: string; href: string }[];
};

export const CLIENT_NAV: NavItem[] = [
  { id: "resumen", label: "Resumen", href: "/dashboard" },
  {
    id: "activos",
    label: "Mis activos",
    href: "/dashboard/activos",
    children: [
      { id: "dominios", label: "Dominios", href: "/dashboard/activos/dominios" },
      { id: "websites", label: "Websites", href: "/dashboard/activos/websites" },
      { id: "servidores", label: "Servidores", href: "/dashboard/activos/servidores" },
      { id: "apis", label: "APIs", href: "/dashboard/activos/apis" },
      { id: "bdd", label: "Bases de datos", href: "/dashboard/activos/bases-de-datos" },
      { id: "servicios", label: "Servicios", href: "/dashboard/activos/servicios" },
      { id: "tls", label: "Certificados TLS", href: "/dashboard/activos/certificados-tls" }
    ]
  },
  { id: "mon", label: "Monitorización", href: "/dashboard/monitorizacion" },
  { id: "seg", label: "Seguridad", href: "/dashboard/seguridad" },
  { id: "alertas", label: "Alertas", href: "/dashboard/alertas" },
  { id: "inc", label: "Incidentes", href: "/dashboard/incidentes" },
  { id: "prev", label: "Prevención", href: "/dashboard/prevencion" },
  { id: "aud", label: "Auditorías", href: "/dashboard/auditorias" },
  { id: "inf", label: "Informes", href: "/dashboard/informes" },
  { id: "sop", label: "Soporte", href: "/dashboard/soporte" },
  { id: "cta", label: "Cuenta", href: "/dashboard/cuenta" }
];

function navCurrent(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ClientPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const { authenticated, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orgName, setOrgName] = useState<string>("…");
  const [userName, setUserName] = useState<string>("");
  const [freshness, setFreshness] = useState<string>("Sin datos de frescura");

  useEffect(() => {
    if (!authenticated) {
      router.push("/auth/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const portal = await fetchPortal();
        if (cancelled) return;
        setOrgName(portal.organization?.name || portal.companyProfile?.name || "Organización");
        setUserName(portal.user?.name || portal.user?.email || "Usuario");
        setFreshness("Datos de sesión cargados");
      } catch {
        if (!cancelled) {
          setOrgName("Organización");
          setFreshness("No se pudo refrescar el contexto");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function onLogout() {
    await logout();
    router.push("/");
  }

  if (!authenticated) {
    return (
      <div className="argos-client-portal">
        <div className="cp-state">
          <p className="cp-state__title">Comprobando sesión…</p>
        </div>
      </div>
    );
  }

  const shellClass = drawerOpen ? "cp-shell cp-shell--drawer-open" : "cp-shell";

  return (
    <div className="argos-client-portal">
      <a className="cp-skip" href="#main">
        Saltar al contenido
      </a>
      <div className={shellClass}>
        <header className="cp-topbar" role="banner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              className="cp-topbar__menu"
              aria-expanded={drawerOpen}
              aria-controls="cp-sidebar"
              onClick={() => setDrawerOpen((v) => !v)}
            >
              Menú
            </button>
            <Link href="/dashboard" className="cp-topbar__brand">
              ARGOS
            </Link>
          </div>
          <div className="cp-topbar__meta">
            <ClientNotificationsBell />
            <span>{orgName}</span>
            <span aria-live="polite">{freshness}</span>
            <span>{userName}</span>
            <button type="button" className="cp-btn cp-btn--ghost" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {drawerOpen ? (
          <button
            type="button"
            className="cp-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
          />
        ) : null}

        <nav id="cp-sidebar" className="cp-sidebar" aria-label="Portal de cliente">
          <p className="cp-sidebar__label">Client Portal</p>
          <ul className="cp-nav">
            {CLIENT_NAV.map((item) => {
              const current = navCurrent(pathname, item.href);
              return (
                <li key={item.id}>
                  <Link href={item.href} aria-current={current ? "page" : undefined}>
                    <span>{item.label}</span>
                  </Link>
                  {item.children ? (
                    <ul className="cp-nav__children">
                      {item.children.map((child) => {
                        const childCurrent = navCurrent(pathname, child.href);
                        return (
                          <li key={child.id}>
                            <Link href={child.href} aria-current={childCurrent ? "page" : undefined}>
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="main" className="cp-main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
