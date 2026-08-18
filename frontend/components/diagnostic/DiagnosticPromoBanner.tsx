"use client";

/**
 * FASE 21.6B.8B — static legacy diagnostic banner (B1).
 * No autonomous mascot motion / walk / rotation.
 */

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useState
} from "react";
import { createPortal } from "react-dom";

import { DiagnosticSurveyModal } from "./DiagnosticSurveyModal";
import { chicoTips, type ChicoTip } from "./chicoTips";

type Props = {
  /** Banner dentro de la fila única del header (entre logo y menú). */
  embeddedInHeader?: boolean;
};

const PROMO_TEXT_MAIN = "Descubre en pocos minutos el estado real de tu web";
const PROMO_TEXT_HIGHLIGHT = "Seguridad · Sistemas · Procesos";
const PROMO_TEXT_CTA = "Iniciar diagnóstico ARGOS";
const PROMO_A11Y_DESCRIPTION =
  "Descubre en pocos minutos el estado real de tu web, seguridad, sistemas y procesos digitales.";
const PROMO_HIGHLIGHT_PARTS = PROMO_TEXT_HIGHLIGHT.split(" · ");

/** Static V1-compatible sit asset — no walk. */
const STATIC_BANNER_ASSET = "/mascots/dumbo/dumbo_sentado_atento.png";

const DUMBO_SPRITE_BOX_HEADER =
  "h-[60px] w-[60px] shrink-0 lg:h-[66px] lg:w-[66px] xl:h-[70px] xl:w-[70px]";

const DUMBO_CARD_EMBEDDED =
  "w-full max-w-full min-w-0 md:w-[min(100%,480px)] md:max-w-[min(100%,480px)] md:min-w-0 lg:w-[min(100%,580px)] lg:max-w-[580px] xl:w-[min(100%,640px)] xl:max-w-[640px]";

function formatTipA11y(tip: ChicoTip) {
  return `Consejo práctico: ${tip.titulo}. ${tip.mensajeCorto}`;
}

export default function DiagnosticPromoBanner({ embeddedInHeader = false }: Props) {
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const tip = chicoTips[tipIndex % chicoTips.length] ?? chicoTips[0];

  const nextTip = useCallback(() => {
    setTipIndex((i) => (i + 1) % chicoTips.length);
  }, []);

  return (
    <>
      <DiagnosticSurveyModal open={diagnosticOpen} onClose={() => setDiagnosticOpen(false)} />
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${
          embeddedInHeader ? "" : "overflow-visible"
        }`}
        role="region"
        aria-label={PROMO_A11Y_DESCRIPTION}
        data-banner-static="true"
        data-banner-mascot="dumbo"
      >
        <div
          className={`pointer-events-none absolute inset-0 flex w-full max-w-full items-center ${
            embeddedInHeader ? "justify-end pr-1 md:pr-2" : "justify-center px-2"
          }`}
        >
          <StaticBannerInner
            embeddedInHeader={embeddedInHeader}
            tip={tip}
            onStartDiagnostic={() => setDiagnosticOpen(true)}
            onNextTip={nextTip}
          />
        </div>
      </div>
    </>
  );
}

function StaticBannerInner({
  embeddedInHeader,
  tip,
  onStartDiagnostic,
  onNextTip
}: {
  embeddedInHeader: boolean;
  tip: ChicoTip;
  onStartDiagnostic: () => void;
  onNextTip: () => void;
}) {
  return (
    <div
      className={`pointer-events-none flex w-full min-w-0 max-w-full flex-row ${
        embeddedInHeader
          ? "h-full items-center justify-end gap-2 lg:gap-3"
          : "items-end justify-center gap-2"
      }`}
    >
      <div
        className={`order-1 relative min-w-0 shrink-0 ${
          embeddedInHeader ? `${DUMBO_CARD_EMBEDDED} self-center` : "max-w-[min(100%,520px)] flex-1"
        }`}
      >
        <div
          data-argos-header-card={embeddedInHeader ? "true" : undefined}
          className={
            embeddedInHeader
              ? "pointer-events-auto relative max-h-[calc(var(--argos-topbar-nav-h)-12px)] overflow-hidden rounded-[14px] border-2 border-[#39F4FF]/90 bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0f766e] py-1.5 pl-3 pr-3 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.4)] ring-1 ring-black/20 md:flex md:flex-row md:items-center md:gap-3 lg:gap-3.5 lg:pl-3.5 lg:pr-3.5"
              : "pointer-events-auto relative overflow-visible rounded-2xl border-[2.5px] border-[#39F4FF]/90 bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0f766e] px-4 py-3 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.45)] ring-2 ring-black/25 md:flex md:flex-row md:items-center md:gap-6 md:px-5"
          }
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[2px] rounded-[10px] bg-gradient-to-b from-white/18 via-transparent to-black/22"
          />
          <div className="relative z-[1] min-w-0 flex-1">
            <p
              className={
                embeddedInHeader
                  ? "line-clamp-1 text-sm font-bold leading-tight tracking-tight text-white drop-shadow lg:text-[15px]"
                  : "text-base font-bold leading-tight tracking-tight text-white drop-shadow md:text-lg"
              }
            >
              {PROMO_TEXT_MAIN}
            </p>
            <p
              className={
                embeddedInHeader
                  ? "mt-0.5 line-clamp-1 text-xs font-black leading-tight text-balance lg:text-[13px]"
                  : "mt-1.5 text-sm font-black leading-tight text-balance"
              }
            >
              <span className="text-[#fca5a5]">{PROMO_HIGHLIGHT_PARTS[0]}</span>
              <span className="font-bold tracking-wide text-white/55">{" · "}</span>
              <span className="text-[#6ee7b7]">{PROMO_HIGHLIGHT_PARTS[1]}</span>
              <span className="font-bold tracking-wide text-white/55">{" · "}</span>
              <span className="text-[#7dd3fc]">{PROMO_HIGHLIGHT_PARTS[2]}</span>
            </p>
            <StaticTipStrip tip={tip} embeddedInHeader={embeddedInHeader} onNextTip={onNextTip} />
          </div>

          <div
            className={`relative z-[1] shrink-0 ${embeddedInHeader ? "mt-0" : "mt-3"} md:mt-0 md:flex md:flex-col md:justify-center`}
          >
            <button
              type="button"
              onClick={onStartDiagnostic}
              className={
                embeddedInHeader
                  ? "pointer-events-auto inline-flex min-h-[44px] h-11 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#22D3EE] px-3.5 text-center text-xs font-black leading-tight tracking-tight text-[#082f49] shadow-[0_4px_12px_-4px_rgba(6,182,212,0.85)] ring-1 ring-[#A5F3FC]/95 hover:bg-[#67E8F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 md:w-[176px] md:min-w-[176px] md:shrink-0 lg:w-[188px] lg:min-w-[188px] lg:text-[13px]"
                  : "pointer-events-auto inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#22D3EE] px-5 py-2.5 text-center text-sm font-black leading-tight tracking-tight text-[#082f49] shadow-[0_8px_24px_-6px_rgba(6,182,212,0.85)] ring-2 ring-[#A5F3FC]/95 hover:bg-[#67E8F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              }
            >
              {PROMO_TEXT_CTA}
            </button>
          </div>
        </div>
      </div>

      {/* Decorative static mascot — not interactive */}
      <div
        className={`order-2 relative shrink-0 -scale-x-100 drop-shadow-[0_14px_32px_-6px_rgba(15,23,42,0.55)] ${DUMBO_SPRITE_BOX_HEADER} ${
          embeddedInHeader ? "self-center" : "self-end"
        }`}
        aria-hidden="true"
      >
        <Image
          src={STATIC_BANNER_ASSET}
          alt=""
          width={128}
          height={128}
          sizes="(max-width: 1024px) 80px, 96px"
          className="pointer-events-none h-full w-full object-contain object-bottom"
          priority={false}
        />
      </div>
    </div>
  );
}

function StaticTipStrip({
  tip,
  embeddedInHeader,
  onNextTip
}: {
  tip: ChicoTip;
  embeddedInHeader: boolean;
  onNextTip: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <div
        className={
          embeddedInHeader
            ? "mt-1 flex min-w-0 flex-wrap items-center gap-1.5"
            : "mt-2 flex min-w-0 flex-wrap items-center gap-2"
        }
        aria-label={formatTipA11y(tip)}
      >
        <p
          className={
            embeddedInHeader
              ? "min-w-0 flex-1 basis-[8rem] line-clamp-1 text-[11px] font-semibold leading-tight text-[#E0F2FE]/95 lg:text-xs"
              : "min-w-0 flex-1 text-sm font-semibold leading-snug text-[#E0F2FE]/95"
          }
        >
          <span className="font-black text-[#67E8F9]">Consejo · </span>
          {tip.titulo}
        </p>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex min-h-[44px] items-center rounded-md border border-[#5EEAD4]/45 bg-[#082f49]/80 px-2.5 text-[10px] font-black uppercase tracking-wide text-[#A5F3FC] transition hover:bg-[#0c4a6e]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 lg:text-[11px]"
        >
          Ver explicación
        </button>
        <button
          type="button"
          onClick={onNextTip}
          className="inline-flex min-h-[44px] items-center rounded-md border border-white/20 bg-black/25 px-2.5 text-[10px] font-black uppercase tracking-wide text-white/90 transition hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 lg:text-[11px]"
        >
          Otro consejo
        </button>
      </div>
      <TipDetailModal
        open={detailOpen}
        tip={tip}
        titleId={titleId}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}

function TipDetailModal({
  open,
  tip,
  titleId,
  onClose
}: {
  open: boolean;
  tip: ChicoTip;
  titleId: string;
  onClose: () => void;
}) {
  const dialogTitleId = `${titleId}-modal`;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#020617]/72 backdrop-blur-[3px]"
        aria-label="Cerrar explicación del consejo"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className="relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-[#2DD4BF]/80 bg-[#0f172a] shadow-[0_24px_64px_-12px_rgba(2,6,23,0.85)] sm:max-w-xl md:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,#0c1929_0%,#082f49_48%,#0e7490_115%)]"
        />
        <div className="relative z-[1] flex shrink-0 items-start justify-between gap-3 border-b border-[#2DD4BF]/35 px-5 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#67E8F9] md:text-xs">
              Consejo práctico
            </p>
            <h2 id={dialogTitleId} className="mt-1 text-lg font-black leading-snug text-[#ECFEFF] md:text-xl">
              {tip.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-teal-200/35 bg-black/45 text-teal-50 shadow backdrop-blur-sm transition hover:bg-teal-950/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            aria-label="Cerrar explicación"
          >
            <span aria-hidden className="text-xl font-light leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="relative z-[1] flex-1 space-y-5 overflow-y-auto px-5 py-4 md:space-y-6 md:px-6 md:py-5">
          <p className="text-sm leading-relaxed text-[#E0F2FE]/95 md:text-[0.9375rem]">{tip.explicacion}</p>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-[#67E8F9]">Pasos prácticos</p>
            <ol className="mt-2.5 list-decimal space-y-2.5 pl-5 text-sm leading-snug text-[#E0F2FE] marker:font-bold marker:text-[#5EEAD4] md:text-[0.9375rem]">
              {tip.pasos.map((paso, index) => (
                <li key={`${tip.id}-modal-paso-${String(index)}`} className="pl-0.5">
                  {paso}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-[#0d9488]/55 bg-[#042f2e]/70 p-4 shadow-inner">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#99F6E4]">Acción recomendada</p>
            <p className="mt-2 text-sm font-semibold leading-snug text-[#ECFEFF] md:text-[0.9375rem]">
              {tip.accionRecomendada}
            </p>
          </div>
        </div>
        <div className="relative z-[1] shrink-0 border-t border-[#2DD4BF]/30 px-5 py-4 md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#5EEAD4]/50 bg-[#082f49] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[#A5F3FC] shadow-sm transition hover:bg-[#0c4a6e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Volver al consejo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
