"use client";

import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { usePageMeta } from "@/components/seo/usePageMeta";
import {
  SELF_SERVICE_CTA,
  SELF_SERVICE_HAS_ACCOUNT,
  SELF_SERVICE_HOW_STEPS,
  SELF_SERVICE_HOW_TITLE,
  SELF_SERVICE_LANDING_LEAD,
  SELF_SERVICE_LANDING_TITLE,
  SELF_SERVICE_LOGIN_LINK,
  SELF_SERVICE_LOGIN_PATH,
  SELF_SERVICE_OPTION_CREATE_BODY,
  SELF_SERVICE_OPTION_CREATE_TITLE,
  SELF_SERVICE_OPTION_IMPROVE_BODY,
  SELF_SERVICE_OPTION_IMPROVE_TITLE,
  SELF_SERVICE_OPTIONS_TITLE,
  SELF_SERVICE_PACE_BODY,
  SELF_SERVICE_PACE_TITLE,
  SELF_SERVICE_PRIVACY_BODY,
  SELF_SERVICE_PRIVACY_TITLE,
  SELF_SERVICE_START_PATH,
  newSelfServiceIdempotencyKey,
  writeSelfServiceIntent
} from "@/lib/webProjects/selfServiceUi";

export default function WebProjectPublicLanding() {
  usePageMeta(`${SELF_SERVICE_LANDING_TITLE} | ARGOS-IT`, SELF_SERVICE_LANDING_LEAD);

  function persistIntent() {
    writeSelfServiceIntent({ idempotencyKey: newSelfServiceIdempotencyKey() });
  }

  return (
    <CorporatePageShell className="argos-wp-public">
      <section className="argos-corp-section argos-corp-section--hero" aria-labelledby="wp-public-title">
        <div className="argos-corp-container argos-corp-container--narrow">
          <p className="argos-corp-brand-mark">ARGOS IT</p>
          <h1 id="wp-public-title" className="argos-font-display argos-corp-display">
            {SELF_SERVICE_LANDING_TITLE}
          </h1>
          <p className="argos-corp-lead argos-corp-text-justify">{SELF_SERVICE_LANDING_LEAD}</p>
          <div className="argos-corp-cta-row">
            <Link href={SELF_SERVICE_START_PATH} className="argos-corporate-cta" onClick={persistIntent}>
              {SELF_SERVICE_CTA}
            </Link>
            <Link href={SELF_SERVICE_LOGIN_PATH} className="argos-corporate-cta argos-corporate-cta--outline" onClick={persistIntent}>
              {SELF_SERVICE_LOGIN_LINK}
            </Link>
          </div>
          <p className="argos-corp-body" style={{ marginTop: "1rem" }}>
            {SELF_SERVICE_HAS_ACCOUNT}{" "}
            <Link href={SELF_SERVICE_LOGIN_PATH} className="argos-corporate-link" onClick={persistIntent}>
              {SELF_SERVICE_LOGIN_LINK}
            </Link>
          </p>
        </div>
      </section>

      <section className="argos-corp-section argos-corp-section--ivory" aria-labelledby="wp-how-title">
        <div className="argos-corp-container argos-corp-container--narrow">
          <h2 id="wp-how-title" className="argos-font-display argos-corp-h2">
            {SELF_SERVICE_HOW_TITLE}
          </h2>
          <ol className="argos-corp-rule-list argos-wp-steps">
            {SELF_SERVICE_HOW_STEPS.map((step, index) => (
              <li key={step}>
                <span className="argos-wp-steps__index">{String(index + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="argos-corp-section argos-corp-section--sand" aria-labelledby="wp-options-title">
        <div className="argos-corp-container">
          <h2 id="wp-options-title" className="argos-font-display argos-corp-h2">
            {SELF_SERVICE_OPTIONS_TITLE}
          </h2>
          <div className="argos-corp-link-cards" style={{ marginTop: "1.5rem" }}>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h3 className="argos-corp-card-title">{SELF_SERVICE_OPTION_CREATE_TITLE}</h3>
              <p className="argos-corp-card-body">{SELF_SERVICE_OPTION_CREATE_BODY}</p>
            </article>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h3 className="argos-corp-card-title">{SELF_SERVICE_OPTION_IMPROVE_TITLE}</h3>
              <p className="argos-corp-card-body">{SELF_SERVICE_OPTION_IMPROVE_BODY}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="argos-corp-section argos-corp-section--mist" aria-labelledby="wp-pace-title">
        <div className="argos-corp-container argos-corp-container--narrow">
          <h2 id="wp-pace-title" className="argos-font-display argos-corp-h2">
            {SELF_SERVICE_PACE_TITLE}
          </h2>
          <p className="argos-corp-body argos-corp-text-justify">{SELF_SERVICE_PACE_BODY}</p>
        </div>
      </section>

      <section className="argos-corp-section argos-corp-section--ivory" aria-labelledby="wp-privacy-title">
        <div className="argos-corp-container argos-corp-container--narrow">
          <h2 id="wp-privacy-title" className="argos-font-display argos-corp-h2">
            {SELF_SERVICE_PRIVACY_TITLE}
          </h2>
          <p className="argos-corp-body argos-corp-text-justify">{SELF_SERVICE_PRIVACY_BODY}</p>
        </div>
      </section>

      <section className="argos-corp-section argos-corp-section--cta" aria-labelledby="wp-final-cta-title">
        <div className="argos-corp-container argos-corp-container--editorial">
          <h2 id="wp-final-cta-title" className="argos-font-display argos-corp-h2">
            {SELF_SERVICE_LANDING_TITLE}
          </h2>
          <div className="argos-corp-cta-row">
            <Link href={SELF_SERVICE_START_PATH} className="argos-corporate-cta" onClick={persistIntent}>
              {SELF_SERVICE_CTA}
            </Link>
            <Link href={SELF_SERVICE_LOGIN_PATH} className="argos-corporate-link-quiet" onClick={persistIntent}>
              Ya tengo cuenta → {SELF_SERVICE_LOGIN_LINK}
            </Link>
          </div>
        </div>
      </section>
    </CorporatePageShell>
  );
}
