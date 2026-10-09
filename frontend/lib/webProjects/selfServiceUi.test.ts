import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SELF_SERVICE_CTA,
  SELF_SERVICE_EXISTING_ACCOUNT,
  SELF_SERVICE_GENERIC_ERROR,
  SELF_SERVICE_HOME_CTA,
  SELF_SERVICE_HOME_INDEX,
  SELF_SERVICE_HOW_STEPS,
  SELF_SERVICE_LANDING_LEAD,
  SELF_SERVICE_LANDING_PATH,
  SELF_SERVICE_LANDING_TITLE,
  SELF_SERVICE_NEED_LEGEND,
  SELF_SERVICE_ORG_QUESTION,
  SELF_SERVICE_START_PATH,
  SELF_SERVICE_START_TITLE,
  isSafeProjectRedirect,
  projectRedirectPath,
  selfServicePasswordLooksValid,
  technicalSelfServiceTermsLeak
} from "./selfServiceUi.ts";

describe("web project public self-service UI", () => {
  it("01-03 landing copy is public and jargon-free", () => {
    assert.equal(SELF_SERVICE_LANDING_PATH, "/proyecto-web");
    assert.equal(SELF_SERVICE_START_PATH, "/proyecto-web/comenzar");
    assert.equal(SELF_SERVICE_LANDING_TITLE, "Crea o mejora tu web con ARGOS");
    assert.equal(SELF_SERVICE_CTA, "Comenzar mi proyecto");
    assert.equal(SELF_SERVICE_HOME_CTA, "Comenzar mi proyecto");
    assert.equal(SELF_SERVICE_HOME_INDEX, "01 / Proyecto web");
    assert.match(SELF_SERVICE_LANDING_LEAD, /guardar el progreso/);
    assert.equal(technicalSelfServiceTermsLeak(SELF_SERVICE_LANDING_LEAD), false);
    assert.equal(technicalSelfServiceTermsLeak(SELF_SERVICE_LANDING_TITLE), false);
    assert.equal(SELF_SERVICE_HOW_STEPS.length, 5);
  });

  it("06-10 registration copy stays minimal", () => {
    assert.equal(SELF_SERVICE_START_TITLE, "Empieza tu proyecto web");
    assert.equal(SELF_SERVICE_NEED_LEGEND, "¿Qué necesitas?");
    assert.match(SELF_SERVICE_EXISTING_ACCOUNT, /Inicia sesión/);
    assert.equal(technicalSelfServiceTermsLeak(SELF_SERVICE_EXISTING_ACCOUNT), false);
    assert.equal(technicalSelfServiceTermsLeak(SELF_SERVICE_ORG_QUESTION), false);
    assert.equal(selfServicePasswordLooksValid("Corta1"), false);
    assert.equal(selfServicePasswordLooksValid("PasswordValida1"), true);
  });

  it("14 redirect stays on the project", () => {
    assert.equal(projectRedirectPath(12), "/dashboard/proyectos/12");
    assert.equal(isSafeProjectRedirect("/dashboard/proyectos/12"), true);
    assert.equal(isSafeProjectRedirect("/dashboard"), false);
    assert.equal(isSafeProjectRedirect("https://evil.test/dashboard/proyectos/12"), false);
  });

  it("23 error copy does not leak internals", () => {
    assert.equal(technicalSelfServiceTermsLeak(SELF_SERVICE_GENERIC_ERROR), false);
    assert.match(SELF_SERVICE_GENERIC_ERROR, /iniciar el proyecto/);
  });
});
