"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { useI18n } from "@/i18n/useI18n";
import { getAllMethodArgosSteps } from "@/lib/methodArgosSteps";
import { isCorporateNavActive } from "@/lib/corporateNav";

type Props = {
  open: boolean;
  onClose: () => void;
  menuId: string;
  pathname: string;
};

type AccordionId = "services" | "method" | "about" | "contacts" | "portal" | null;
type PressedId = "home" | AccordionId;

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconServices() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 20h8M12 16.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconMethod() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="18" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11.2 10.2 7.8M13.8 7.8 16 11.2M8 12.8l2.2 3.4M13.8 16.2 16 12.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAbout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19 7v5.2c0 4.2-2.9 7.9-7 9.3-4.1-1.4-7-5.1-7-9.3V7l7-3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 12.2 11.2 14l3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconContacts() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPortal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 19.5c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`argos-corporate-drawer__chevron${open ? " is-open" : ""}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Menú idéntico en todas las páginas públicas corporativas.
 * Destinos: Inicio, Servicios, Método, Sobre, Contacto, Portal.
 */
export default function CorporateNavDrawer({ open, onClose, menuId, pathname }: Props) {
  const { t } = useI18n();
  const services = useLocalizedServices();
  const steps = getAllMethodArgosSteps();
  const titleId = useId();
  const [expanded, setExpanded] = useState<AccordionId>(null);
  const [pressed, setPressed] = useState<PressedId>(null);

  useEffect(() => {
    if (!open) {
      setExpanded(null);
      setPressed(null);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const markPress = (id: PressedId) => {
    setPressed(id);
    window.setTimeout(() => {
      setPressed((current) => (current === id ? null : current));
    }, 320);
  };

  const toggle = (id: AccordionId) => {
    markPress(id);
    setExpanded((current) => (current === id ? null : id));
  };

  return (
    <>
      <button
        type="button"
        className="argos-corporate-drawer-scrim"
        aria-label={t("nav.menu")}
        onClick={onClose}
      />
      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="argos-corporate-drawer"
      >
        <div className="argos-corporate-drawer__top">
          <p id={titleId} className="argos-corporate-drawer__heading">
            {t("nav.menu")}
          </p>
          <button
            type="button"
            className="argos-corporate-drawer__close"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
          >
            ×
          </button>
        </div>

        <nav className="argos-corporate-drawer__nav" aria-label={t("nav.menu")}>
          <div
            className={`argos-drawer-block${pressed === "home" ? " is-pressed" : ""}${
              isCorporateNavActive(pathname, "/") ? " is-current" : ""
            }`}
          >
            <Link
              href="/"
              className={`argos-drawer-block__head${isCorporateNavActive(pathname, "/") ? " is-active" : ""}`}
              onClick={() => {
                markPress("home");
                onClose();
              }}
            >
              <span className="argos-drawer-block__icon">
                <IconHome />
              </span>
              <span className="argos-drawer-block__label">{t("nav.home")}</span>
            </Link>
          </div>

          <DrawerAccordion
            id="drawer-services"
            label={t("nav.services")}
            icon={<IconServices />}
            open={expanded === "services"}
            pressed={pressed === "services"}
            onToggle={() => toggle("services")}
          >
            <ul className="argos-drawer-sub">
              <li>
                <Link href="/servicios" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("actions.viewServices")}
                </Link>
              </li>
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/servicios/${service.slug}`}
                    className="argos-drawer-sub__link"
                    onClick={onClose}
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </DrawerAccordion>

          <DrawerAccordion
            id="drawer-method"
            label={t("nav.methodArgos")}
            icon={<IconMethod />}
            open={expanded === "method"}
            pressed={pressed === "method"}
            onToggle={() => toggle("method")}
            accent
          >
            <div className="argos-drawer-method-card">
              <p className="argos-drawer-method-card__kicker">{t("nav.methodArgos")}</p>
              <p className="argos-drawer-method-card__lead">{t("headerBanner.methodLead")}</p>
              <ol className="argos-drawer-method-card__letters" aria-label={t("nav.methodArgos")}>
                {steps.map((step) => (
                  <li key={step.slug}>
                    <Link href={step.path} className="argos-drawer-method-card__phase" onClick={onClose}>
                      <span className="argos-drawer-method-card__letter">{step.letter}</span>
                      <span className="argos-drawer-method-card__name">{step.name}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link href="/metodo" className="argos-drawer-method-card__cta" onClick={onClose}>
                {t("drawer.discoverMethod")} →
              </Link>
            </div>
          </DrawerAccordion>

          <DrawerAccordion
            id="drawer-about"
            label={t("nav.about")}
            icon={<IconAbout />}
            open={expanded === "about"}
            pressed={pressed === "about"}
            onToggle={() => toggle("about")}
          >
            <ul className="argos-drawer-sub">
              <li>
                <Link href="/sobre-argos-it" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("drawer.whoWeAre")}
                </Link>
              </li>
              <li>
                <Link href="/metodo" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("nav.methodArgos")}
                </Link>
              </li>
            </ul>
          </DrawerAccordion>

          <DrawerAccordion
            id="drawer-contacts"
            label={t("nav.contact")}
            icon={<IconContacts />}
            open={expanded === "contacts"}
            pressed={pressed === "contacts"}
            onToggle={() => toggle("contacts")}
          >
            <ul className="argos-drawer-sub">
              <li>
                <Link href="/contacto" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("drawer.requestConsult")}
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("drawer.supportAssist")}
                </Link>
              </li>
            </ul>
          </DrawerAccordion>

          <DrawerAccordion
            id="drawer-portal"
            label={t("nav.portalShort")}
            icon={<IconPortal />}
            open={expanded === "portal"}
            pressed={pressed === "portal"}
            onToggle={() => toggle("portal")}
          >
            <ul className="argos-drawer-sub">
              <li>
                <Link href="/portal" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("portalPage.menuOverview")}
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="argos-drawer-sub__link" onClick={onClose}>
                  {t("drawer.clientAccess")}
                </Link>
              </li>
            </ul>
          </DrawerAccordion>
        </nav>

        <p className="argos-corporate-drawer__help">{t("drawer.helpNote")}</p>
      </div>
    </>
  );
}

function DrawerAccordion({
  id,
  label,
  icon,
  open,
  pressed = false,
  onToggle,
  children,
  accent = false
}: {
  id: string;
  label: string;
  icon: ReactNode;
  open: boolean;
  pressed?: boolean;
  onToggle: () => void;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "argos-drawer-block",
        accent ? "argos-drawer-block--accent" : "",
        open ? "is-open" : "",
        pressed ? "is-pressed" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="argos-drawer-block__head argos-drawer-block__head--toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="argos-drawer-block__icon">{icon}</span>
        <span className="argos-drawer-block__label">{label}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div id={id} className="argos-drawer-block__body">
          {children}
        </div>
      ) : null}
    </div>
  );
}
