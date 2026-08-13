"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { useI18n } from "@/i18n/useI18n";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 }
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  privacy: boolean;
};

const contactFormEndpoint =
  process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT || "https://formspree.io/f/xpqooedl";

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  message: "",
  privacy: false
};

/** Misma política que `backend/routes/contact.js` (`clean` trunca a 2000 por campo). */
const CONTACT_FIELD_MAX_LEN = 2000;

export default function ContactView() {
  const { t, get } = useI18n();
  const services = useLocalizedServices();

  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle");

  usePageMeta(t("meta.contactTitle"), t("meta.contactDescription"));

  const coverageLines = get<string[]>("contact.cards.coverageLines", []);

  const serviceOptions = useMemo(
    () => services.map((service) => ({ value: service.slug, label: service.title })),
    [services]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preselected = params.get("service");
    if (!preselected) return;
    setForm((prev) => ({ ...prev, service: preselected }));
  }, []);

  const updateField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

    const tooLong = (v: string) => v.length > CONTACT_FIELD_MAX_LEN;

    if (!form.name.trim()) nextErrors.name = t("contact.form.errors.required");
    else if (tooLong(form.name)) nextErrors.name = t("contact.form.errors.maxLength");
    if (!form.email.trim()) nextErrors.email = t("contact.form.errors.required");
    else if (!emailRegex.test(form.email)) nextErrors.email = t("contact.form.errors.email");
    else if (tooLong(form.email)) nextErrors.email = t("contact.form.errors.maxLength");
    if (!form.phone.trim()) nextErrors.phone = t("contact.form.errors.required");
    else if (!phoneRegex.test(form.phone)) nextErrors.phone = t("contact.form.errors.phone");
    else if (tooLong(form.phone)) nextErrors.phone = t("contact.form.errors.maxLength");
    if (!form.company.trim()) nextErrors.company = t("contact.form.errors.required");
    else if (tooLong(form.company)) nextErrors.company = t("contact.form.errors.maxLength");
    if (!form.service.trim()) nextErrors.service = t("contact.form.errors.service");
    else if (tooLong(form.service)) nextErrors.service = t("contact.form.errors.maxLength");
    if (!form.message.trim()) nextErrors.message = t("contact.form.errors.required");
    else if (tooLong(form.message)) nextErrors.message = t("contact.form.errors.maxLength");
    if (!form.privacy) nextErrors.privacy = t("contact.form.errors.privacy");

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      const firstField = Object.keys(nextErrors)[0];
      const target = document.querySelector(`[name="${firstField}"]`);
      window.dispatchEvent(new CustomEvent("argos:onFormError", { detail: { target } }));
      return false;
    }

    return true;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");

    if (!validate()) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    const payload = new FormData();
    payload.append("_subject", "Nueva solicitud desde ARGOS-IT");
    payload.append("origen", "servicio-argos-it");
    payload.append("name", form.name);
    payload.append("email", form.email);
    payload.append("phone", form.phone);
    payload.append("company", form.company);
    payload.append("service", form.service);
    payload.append("servicio", form.service);
    payload.append("message", form.message);
    payload.append("privacy", "accepted");

    try {
      const response = await fetch(contactFormEndpoint, {
        method: "POST",
        body: payload,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) throw new Error("Formspree request failed");

      window.dispatchEvent(new CustomEvent("argos:onFormSuccess"));
      setStatus("success");
      setForm(initialState);
      setErrors({});
    } catch {
      setStatus("error");
      window.dispatchEvent(new CustomEvent("argos:onFormError"));
    }
  };

  return (
    <CorporatePageShell>
      <header className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <Link href="/" className="argos-corporate-link mb-6 inline-block text-sm font-semibold no-underline hover:underline">
            ← {t("actions.backHome")}
          </Link>
          <h1 className="argos-font-display text-4xl text-[var(--text-primary)] sm:text-5xl">
            {t("contact.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">
            {t("contact.subtitle")}
          </p>
        </div>
      </header>

      <section className="px-4 pb-16 sm:px-6 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.95fr_1.05fr]">
          <motion.div {...fadeIn} className="mb-4 md:mb-0">
            <p className="mb-8 text-lg leading-8 text-[var(--text-secondary)]">{t("contact.intro")}</p>

            <div className="mb-4 grid grid-cols-1 gap-5 min-[480px]:grid-cols-3">
              <div className="argos-corporate-card p-5">
                <h3 className="argos-font-ui mb-2 text-lg font-semibold text-[var(--text-primary)]">
                  {t("contact.cards.emailTitle")}
                </h3>
                <a href="mailto:info@argos-it.com" className="argos-corporate-link">
                  info@argos-it.com
                </a>
              </div>
              <div className="argos-corporate-card p-5">
                <h3 className="argos-font-ui mb-2 text-lg font-semibold text-[var(--text-primary)]">
                  {t("contact.cards.phoneTitle")}
                </h3>
                <span className="text-[var(--text-secondary)]">Canal a confirmar tras la solicitud</span>
              </div>
              <div className="argos-corporate-card p-5">
                <h3 className="argos-font-ui mb-2 text-lg font-semibold text-[var(--text-primary)]">
                  {t("contact.cards.coverageTitle")}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {coverageLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.form
            className="argos-corporate-card space-y-6 p-8"
            onSubmit={onSubmit}
            onFocus={() => window.dispatchEvent(new CustomEvent("argos:onFormStart"))}
            {...fadeIn}
          >
            <h2 className="argos-font-display mb-2 text-2xl text-[var(--text-primary)]">
              {t("contact.form.title")}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="argos-font-ui mb-2 block text-sm font-semibold">
                  {t("contact.form.name")} *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={form.name}
                  maxLength={CONTACT_FIELD_MAX_LEN}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="argos-corporate-input"
                  placeholder={t("contact.form.namePlaceholder")}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="contact-email" className="argos-font-ui mb-2 block text-sm font-semibold">
                  {t("contact.form.email")} *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={form.email}
                  maxLength={CONTACT_FIELD_MAX_LEN}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="argos-corporate-input"
                  placeholder={t("contact.form.emailPlaceholder")}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="contact-phone" className="argos-font-ui mb-2 block text-sm font-semibold">
                  {t("contact.form.phone")} *
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  maxLength={CONTACT_FIELD_MAX_LEN}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="argos-corporate-input"
                  placeholder={t("contact.form.phonePlaceholder")}
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="contact-company" className="argos-font-ui mb-2 block text-sm font-semibold">
                  {t("contact.form.company")} *
                </label>
                <input
                  id="contact-company"
                  type="text"
                  name="company"
                  value={form.company}
                  maxLength={CONTACT_FIELD_MAX_LEN}
                  onChange={(event) => updateField("company", event.target.value)}
                  className="argos-corporate-input"
                  placeholder={t("contact.form.companyPlaceholder")}
                  aria-invalid={Boolean(errors.company)}
                />
                {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="contact-service" className="argos-font-ui mb-2 block text-sm font-semibold">
                {t("contact.form.service")} *
              </label>
              <select
                id="contact-service"
                name="service"
                value={form.service}
                onChange={(event) => updateField("service", event.target.value)}
                className="argos-corporate-input"
                aria-invalid={Boolean(errors.service)}
              >
                <option value="">{t("contact.form.servicePlaceholder")}</option>
                {serviceOptions.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
              {errors.service && <p className="mt-1 text-xs text-red-600">{errors.service}</p>}
            </div>

            <div>
              <label htmlFor="contact-message" className="argos-font-ui mb-2 block text-sm font-semibold">
                {t("contact.form.message")} *
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={form.message}
                maxLength={CONTACT_FIELD_MAX_LEN}
                onChange={(event) => updateField("message", event.target.value)}
                rows={6}
                className="argos-corporate-input"
                placeholder={t("contact.form.messagePlaceholder")}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
            </div>

            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="privacy"
                  checked={form.privacy}
                  onChange={(event) => updateField("privacy", event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--border-default)] accent-[var(--action-primary)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  {t("contact.form.privacy")}{" "}
                  <Link href="/privacidad" className="argos-corporate-link">
                    {t("legal.privacy.title")}
                  </Link>
                </span>
              </label>
              {errors.privacy && <p className="mt-1 text-xs text-red-600">{errors.privacy}</p>}
            </div>

            <button type="submit" disabled={status === "loading"} className="argos-corporate-btn-primary">
              {status === "loading" ? "..." : t("contact.form.submit")}
            </button>

            {status === "success" && (
              <p className="text-center text-sm text-emerald-700">{t("contact.form.success")}</p>
            )}
            {status === "error" && <p className="text-center text-sm text-red-600">{t("contact.form.error")}</p>}

            <p className="text-center text-sm text-[var(--text-secondary)]">{t("contact.form.requiredHint")}</p>
          </motion.form>
        </div>
      </section>
    </CorporatePageShell>
  );
}
