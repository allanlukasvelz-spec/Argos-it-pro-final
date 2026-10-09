"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { useAuthStore } from "@/lib/auth";
import API from "@/lib/api";
import { readClientApiError } from "@/lib/webProjects/errors";
import { fetchSelfServiceContext, startSelfServiceProject } from "@/lib/webProjects/selfServiceApi";
import type { SelfServiceContext, SelfServiceIntakeProject } from "@/lib/webProjects/selfServiceApi";
import {
  SELF_SERVICE_CONTINUE,
  SELF_SERVICE_CREATE_ANOTHER,
  SELF_SERVICE_EMAIL_LABEL,
  SELF_SERVICE_EXISTING_ACCOUNT,
  SELF_SERVICE_GENERIC_ERROR,
  SELF_SERVICE_HAS_ACCOUNT,
  SELF_SERVICE_LOGIN_LINK,
  SELF_SERVICE_LOGIN_PATH,
  SELF_SERVICE_NAME_LABEL,
  SELF_SERVICE_NEED_LEGEND,
  SELF_SERVICE_NEW_SPACE,
  SELF_SERVICE_OPTION_CREATE_TITLE,
  SELF_SERVICE_OPTION_IMPROVE_TITLE,
  SELF_SERVICE_ORG_QUESTION,
  SELF_SERVICE_PASSWORD_HINT,
  SELF_SERVICE_PASSWORD_LABEL,
  SELF_SERVICE_RESUME,
  SELF_SERVICE_SESSION_EXPIRED,
  SELF_SERVICE_START_TITLE,
  SELF_SERVICE_TITLE_LABEL,
  type ProjectTypeChoice,
  clearSelfServiceIntent,
  isSafeProjectRedirect,
  newSelfServiceIdempotencyKey,
  projectRedirectPath,
  readSelfServiceIntent,
  selfServicePasswordLooksValid,
  writeSelfServiceIntent
} from "@/lib/webProjects/selfServiceUi";

const NEW_SPACE_VALUE = "__new__";

export default function WebProjectStartView() {
  const router = useRouter();
  const authenticated = useAuthStore((state) => state.authenticated);
  const login = useAuthStore((state) => state.login);
  const formId = useId();
  const [projectType, setProjectType] = useState<ProjectTypeChoice | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [context, setContext] = useState<SelfServiceContext | null>(null);
  const [existingAccount, setExistingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forceCreateAnother, setForceCreateAnother] = useState(false);

  useEffect(() => {
    const stored = readSelfServiceIntent();
    const key = stored?.idempotencyKey || newSelfServiceIdempotencyKey();
    setIdempotencyKey(key);
    if (stored?.projectType) setProjectType(stored.projectType);
    if (stored?.title) setTitle(stored.title);
    if (stored?.organizationName) setName(stored.organizationName);
    if (stored?.email) setEmail(stored.email);
    if (stored?.organizationId) setOrganizationId(String(stored.organizationId));
    writeSelfServiceIntent({
      ...(stored || {}),
      idempotencyKey: key,
      projectType: stored?.projectType,
      title: stored?.title,
      organizationName: stored?.organizationName,
      email: stored?.email
    });
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setContext(null);
      return;
    }
    setLoadingContext(true);
    void fetchSelfServiceContext()
      .then((payload) => {
        setContext(payload);
        setOrganizationId((current) => {
          if (current) return current;
          return payload.defaultOrganizationId ? String(payload.defaultOrganizationId) : "";
        });
      })
      .catch((err) => {
        const parsed = readClientApiError(err);
        if (parsed.status === 401) setError(SELF_SERVICE_SESSION_EXPIRED);
      })
      .finally(() => setLoadingContext(false));
  }, [authenticated]);

  const writableOrgs = (context?.organizations || []).filter((row) => row.canCreate);
  const intakeProjects = context?.intakeProjects || [];
  const showResume = authenticated && intakeProjects.length > 0 && !forceCreateAnother;
  const showOrgSelect = authenticated && writableOrgs.length > 1;

  function persistIntent(next?: Partial<{ projectType: ProjectTypeChoice | ""; email: string; name: string; title: string }>) {
    writeSelfServiceIntent({
      idempotencyKey: idempotencyKey || newSelfServiceIdempotencyKey(),
      projectType: (next?.projectType || projectType || undefined) as ProjectTypeChoice | undefined,
      title: next?.title ?? title,
      organizationName: next?.name ?? name,
      email: next?.email ?? email,
      organizationId: organizationId && organizationId !== NEW_SPACE_VALUE ? Number(organizationId) : null,
      createOrganization: organizationId === NEW_SPACE_VALUE
    });
  }

  async function completeAuthenticatedStart() {
    if (!projectType) {
      setFieldError(SELF_SERVICE_NEED_LEGEND);
      return;
    }
    const result = await startSelfServiceProject({
      projectType,
      title: title || undefined,
      organizationName: name || undefined,
      organizationId:
        organizationId && organizationId !== NEW_SPACE_VALUE ? Number(organizationId) : undefined,
      createOrganization: organizationId === NEW_SPACE_VALUE,
      idempotencyKey
    });
    const path = projectRedirectPath(Number(result.project.id));
    if (!isSafeProjectRedirect(path)) {
      throw new Error(SELF_SERVICE_GENERIC_ERROR);
    }
    clearSelfServiceIntent();
    router.replace(path);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    setExistingAccount(false);
    if (!projectType) {
      setFieldError("Elige si quieres crear una web nueva o mejorar la actual.");
      return;
    }
    persistIntent();
    setSubmitting(true);
    try {
      if (authenticated) {
        await completeAuthenticatedStart();
        return;
      }
      if (!name.trim() || !email.trim() || !password) {
        setFieldError("Completa nombre, email y contraseña para continuar.");
        return;
      }
      if (!selfServicePasswordLooksValid(password)) {
        setFieldError(SELF_SERVICE_PASSWORD_HINT);
        return;
      }
      try {
        await API.post("/api/auth/register", {
          name: name.trim(),
          email: email.trim(),
          password,
          company: name.trim()
        });
      } catch (err) {
        const parsed = readClientApiError(err);
        if (parsed.status === 409) {
          persistIntent({ email, name, title, projectType });
          setExistingAccount(true);
          setError(SELF_SERVICE_EXISTING_ACCOUNT);
          return;
        }
        throw err;
      }
      const loginRes = await API.post("/api/auth/login", { email: email.trim(), password });
      login(loginRes.data.user);
      await completeAuthenticatedStart();
    } catch (err) {
      const parsed = readClientApiError(err);
      if (parsed.status === 401) {
        setError(SELF_SERVICE_SESSION_EXPIRED);
      } else if (parsed.code === "ORG_SELECTION_REQUIRED") {
        setError(SELF_SERVICE_ORG_QUESTION);
      } else {
        setError(parsed.message && parsed.status < 500 ? parsed.message : SELF_SERVICE_GENERIC_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function goToProject(item: SelfServiceIntakeProject) {
    const path = projectRedirectPath(item.id);
    if (!isSafeProjectRedirect(path)) return;
    clearSelfServiceIntent();
    router.push(path);
  }

  return (
    <CorporatePageShell className="argos-wp-public">
      <section className="argos-corp-section" aria-labelledby="wp-start-title">
        <div className="argos-corp-container argos-corp-container--narrow">
          <h1 id="wp-start-title" className="argos-font-display argos-corp-page-title">
            {SELF_SERVICE_START_TITLE}
          </h1>
          <p className="argos-corp-lead">
            Solo necesitamos lo esencial para abrir tu espacio y llevarte al cuestionario. El resto se completa después, a tu ritmo.
          </p>

          {showResume ? (
            <div className="argos-wp-resume" aria-labelledby="wp-resume-title">
              <h2 id="wp-resume-title" className="argos-corp-card-title">
                Ya tienes un proyecto en curso
              </h2>
              <ul className="argos-wp-resume__list">
                {intakeProjects.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="argos-corporate-cta argos-corporate-cta--outline" onClick={() => goToProject(item)}>
                      {SELF_SERVICE_RESUME}: {item.title}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="argos-corporate-link" onClick={() => setForceCreateAnother(true)}>
                {SELF_SERVICE_CREATE_ANOTHER}
              </button>
            </div>
          ) : null}

          {(!showResume || forceCreateAnother) && (
            <form className="argos-wp-form" onSubmit={onSubmit} noValidate>
              <fieldset className="argos-wp-choice" aria-describedby={fieldError ? `${formId}-type-error` : undefined}>
                <legend>{SELF_SERVICE_NEED_LEGEND}</legend>
                <div className="argos-wp-choice__grid">
                  <label className={`argos-wp-choice__card${projectType === "create" ? " is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="projectType"
                      value="create"
                      checked={projectType === "create"}
                      onChange={() => {
                        setProjectType("create");
                        persistIntent({ projectType: "create" });
                      }}
                    />
                    <span>{SELF_SERVICE_OPTION_CREATE_TITLE}</span>
                  </label>
                  <label className={`argos-wp-choice__card${projectType === "improve" ? " is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="projectType"
                      value="improve"
                      checked={projectType === "improve"}
                      onChange={() => {
                        setProjectType("improve");
                        persistIntent({ projectType: "improve" });
                      }}
                    />
                    <span>{SELF_SERVICE_OPTION_IMPROVE_TITLE}</span>
                  </label>
                </div>
                {fieldError ? (
                  <p id={`${formId}-type-error`} className="argos-wp-form__error" role="alert">
                    {fieldError}
                  </p>
                ) : null}
              </fieldset>

              {authenticated && showOrgSelect ? (
                <div className="argos-wp-field">
                  <label htmlFor={`${formId}-org`}>{SELF_SERVICE_ORG_QUESTION}</label>
                  <select
                    id={`${formId}-org`}
                    className="argos-corporate-input"
                    value={organizationId}
                    onChange={(event) => setOrganizationId(event.target.value)}
                  >
                    <option value="">Selecciona un espacio</option>
                    {writableOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                    <option value={NEW_SPACE_VALUE}>{SELF_SERVICE_NEW_SPACE}</option>
                  </select>
                </div>
              ) : null}

              {!authenticated ? (
                <>
                  <div className="argos-wp-field">
                    <label htmlFor={`${formId}-name`}>{SELF_SERVICE_NAME_LABEL}</label>
                    <input
                      id={`${formId}-name`}
                      className="argos-corporate-input"
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="argos-wp-field">
                    <label htmlFor={`${formId}-email`}>{SELF_SERVICE_EMAIL_LABEL}</label>
                    <input
                      id={`${formId}-email`}
                      className="argos-corporate-input"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="argos-wp-field">
                    <label htmlFor={`${formId}-password`}>{SELF_SERVICE_PASSWORD_LABEL}</label>
                    <input
                      id={`${formId}-password`}
                      className="argos-corporate-input"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-describedby={`${formId}-password-hint`}
                      required
                    />
                    <p id={`${formId}-password-hint`} className="argos-wp-form__hint">
                      {SELF_SERVICE_PASSWORD_HINT}
                    </p>
                  </div>
                </>
              ) : null}

              <div className="argos-wp-field">
                <label htmlFor={`${formId}-title`}>{SELF_SERVICE_TITLE_LABEL}</label>
                <input
                  id={`${formId}-title`}
                  className="argos-corporate-input"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              {error ? (
                <p className="argos-wp-form__error" role="alert">
                  {error}{" "}
                  {existingAccount ? (
                    <Link href={SELF_SERVICE_LOGIN_PATH} onClick={() => persistIntent()}>
                      {SELF_SERVICE_LOGIN_LINK}
                    </Link>
                  ) : null}
                </p>
              ) : null}

              <button type="submit" className="argos-corporate-cta" disabled={submitting || loadingContext}>
                {submitting ? "Preparando…" : SELF_SERVICE_CONTINUE}
              </button>
            </form>
          )}

          {!authenticated ? (
            <p className="argos-corp-body" style={{ marginTop: "1.5rem" }}>
              {SELF_SERVICE_HAS_ACCOUNT}{" "}
              <Link href={SELF_SERVICE_LOGIN_PATH} className="argos-corporate-link" onClick={() => persistIntent()}>
                {SELF_SERVICE_LOGIN_LINK}
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </CorporatePageShell>
  );
}
