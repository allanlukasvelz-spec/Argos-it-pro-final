"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ArchitectureLegend from "./ArchitectureLegend";

const LINKS = [
  { href: "/platform-map", label: "Mapa" },
  { href: "/platform-map/public", label: "Web pública" },
  { href: "/platform-map/client", label: "Cliente" },
  { href: "/platform-map/noc", label: "Control Center" },
  { href: "/platform-map/core", label: "Core" },
  { href: "/platform-map/apis", label: "APIs" },
  { href: "/platform-map/data", label: "Postgres" }
];

export default function PlatformMapShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="pm">
      <header className="pm-shell__bar">
        <Link href="/platform-map" className="pm-shell__brand">
          ARGOS PLATFORM MAP
        </Link>
        <nav className="pm-shell__links" aria-label="Navegación de la maqueta">
          {LINKS.map((link) => {
            const current =
              link.href === "/platform-map"
                ? pathname === "/platform-map"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="pm-shell__note">Maqueta local · sin producción · sin secretos · sin datos reales</p>
      </header>
      {children}
    </div>
  );
}

export function MapPageFrame({
  kicker,
  title,
  lead,
  children
}: {
  kicker: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="pm-page">
      <p className="pm-kicker">{kicker}</p>
      <h1 className="pm-title">{title}</h1>
      <p className="pm-lead">{lead}</p>
      <ArchitectureLegend />
      {children}
    </main>
  );
}
