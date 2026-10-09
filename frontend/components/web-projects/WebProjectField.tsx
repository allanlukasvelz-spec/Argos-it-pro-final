"use client";

import { useEffect, useState } from "react";
import { fieldHelp, fieldTitle, optionLabel, unwrapFormList } from "@/lib/webProjects/formCopy";
import type { WebProjectFormFieldDef, WebProjectReviewState } from "@/lib/webProjects/types";
import { WebProjectReviewStatus } from "./WebProjectReviewStatus";

export function WebProjectField({
  field,
  value,
  readOnly,
  saveState,
  error,
  review,
  onSave
}: {
  field: WebProjectFormFieldDef;
  value: string;
  readOnly: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  error?: string | null;
  review?: WebProjectReviewState | null;
  onSave: (value: string | string[]) => void;
}) {
  const isMulti = field.type === "multi_enum";
  const [draft, setDraft] = useState(value);
  const [draftList, setDraftList] = useState<string[]>(unwrapFormList(value));
  useEffect(() => {
    setDraft(value);
    setDraftList(unwrapFormList(value));
  }, [value]);

  const title = fieldTitle(field.key);
  const help = fieldHelp(field.key);
  const inputId = `wp-field-${field.key}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const needsCorrection = review?.status === "CORRECTION_REQUIRED";
  const importance =
    field.required ? "Obligatorio" : field.importance === "recommended" ? "Recomendado" : "Opcional";

  function save() {
    if (isMulti) onSave(draftList);
    else onSave(draft);
  }

  const describedBy = `${help ? helpId : ""} ${error ? errorId : ""}`.trim() || undefined;

  return (
    <div
      className={needsCorrection ? "wp-field wp-field--correction" : "wp-field"}
      id={`wp-field-${field.key}`}
    >
      <label htmlFor={isMulti ? undefined : inputId}>
        {title}
        <span className="wp-field__meta"> · {importance}</span>
      </label>
      <WebProjectReviewStatus state={review} emphasizeCorrection />
      {needsCorrection && review?.correctionMessage ? (
        <p className="wp-correction-msg" role="status">
          ARGOS necesita que revises este dato. {review.correctionMessage}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className="cp-disclaimer">
          {help}
        </p>
      ) : null}
      {isMulti && field.options ? (
        <fieldset className="wp-fieldset" disabled={readOnly}>
          <legend className="visually-hidden">{title}</legend>
          {field.options.map((option) => {
            const optionId = `${inputId}-${option}`;
            const checked = draftList.includes(option);
            return (
              <label key={option} className="wp-radio" htmlFor={optionId}>
                <input
                  id={optionId}
                  type="checkbox"
                  checked={checked}
                  disabled={readOnly}
                  onChange={(e) => {
                    setDraftList((prev) =>
                      e.target.checked ? [...prev, option] : prev.filter((item) => item !== option)
                    );
                  }}
                />
                {optionLabel(option)}
              </label>
            );
          })}
        </fieldset>
      ) : field.type === "enum" && field.options ? (
        field.options.length <= 4 ? (
          <div className="wp-radio-group" role="radiogroup" aria-labelledby={inputId}>
            {field.options.map((option) => (
              <label key={option} className="wp-radio">
                <input
                  type="radio"
                  name={inputId}
                  value={option}
                  checked={draft === option}
                  disabled={readOnly}
                  onChange={() => setDraft(option)}
                />
                {optionLabel(option)}
              </label>
            ))}
          </div>
        ) : (
          <select
            id={inputId}
            value={draft}
            disabled={readOnly}
            aria-describedby={describedBy}
            onChange={(e) => setDraft(e.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
        )
      ) : field.type === "email" || field.type === "url" || field.type === "video_url" || field.type === "phone" || field.type === "date" || field.type === "number" ? (
        <input
          id={inputId}
          type={field.type === "video_url" ? "url" : field.type === "phone" ? "tel" : field.type}
          value={draft}
          disabled={readOnly}
          aria-describedby={describedBy}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <textarea
          id={inputId}
          value={draft}
          disabled={readOnly}
          rows={field.key.startsWith("about_") || field.key === "notes" ? 5 : 3}
          aria-describedby={describedBy}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
      {error ? (
        <p id={errorId} className="wp-field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="wp-field__footer">
        {readOnly ? null : (
          <button
            type="button"
            className="cp-btn cp-btn--secondary"
            disabled={saveState === "saving"}
            onClick={save}
          >
            Guardar
          </button>
        )}
        <span className="wp-save" aria-live="polite">
          {saveState === "saving"
            ? "Guardando…"
            : saveState === "saved"
              ? "Guardado"
              : saveState === "error"
                ? "Error al guardar"
                : null}
        </span>
      </div>
    </div>
  );
}
