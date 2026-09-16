import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INVITE_CTA,
  INVITE_GENERIC_INVALID,
  INVITE_LANDING_BODY,
  INVITE_LANDING_TITLE,
  INVITE_WRONG_ACCOUNT,
  deliveryStatusLabel,
  invitationCreatedMessage,
  invitationShowsToken,
  invitationStatusLabel,
  isSafeInviteRedirect,
  projectRedirectPath,
  technicalInviteTermsLeak
} from "./invitationUi.ts";

describe("web project invitation UI", () => {
  it("1-2 NOC labels stay professional", () => {
    assert.equal(invitationStatusLabel("PENDING"), "Pendiente");
    assert.equal(invitationStatusLabel("ACCEPTED"), "Aceptada");
    assert.equal(invitationStatusLabel("EXPIRED"), "Caducada");
    assert.equal(invitationStatusLabel("REVOKED"), "Revocada");
    assert.equal(invitationCreatedMessage({ delivered: true }), "Invitación enviada");
    assert.equal(
      invitationCreatedMessage({ delivered: false }),
      "Invitación creada; envío pendiente/no disponible"
    );
  });

  it("3-7 status and delivery stay separate", () => {
    assert.equal(deliveryStatusLabel("SENT"), "Enviada");
    assert.equal(deliveryStatusLabel("FAILED"), "Error de envío");
    assert.notEqual(deliveryStatusLabel("FAILED"), invitationStatusLabel("PENDING"));
  });

  it("10 token must never appear in list payloads", () => {
    assert.equal(
      invitationShowsToken({ email: "a@example.com", status: "PENDING" }),
      false
    );
    assert.equal(invitationShowsToken({ inviteUrl: "http://x/auth/invite?token=wpi_abc" }), true);
  });

  it("11-13 landing copy is client-facing", () => {
    assert.equal(INVITE_LANDING_TITLE, "Prepara con ARGOS tu proyecto web");
    assert.match(INVITE_LANDING_BODY, /guardar el progreso/);
    assert.equal(INVITE_CTA, "Comenzar");
    assert.equal(technicalInviteTermsLeak(INVITE_LANDING_BODY), false);
    assert.equal(INVITE_GENERIC_INVALID.includes("caducado"), true);
  });

  it("18 redirect stays internal", () => {
    assert.equal(projectRedirectPath(12), "/dashboard/proyectos/12");
    assert.equal(isSafeInviteRedirect("/dashboard/proyectos/12"), true);
    assert.equal(isSafeInviteRedirect("https://evil.test/dashboard/proyectos/12"), false);
    assert.equal(isSafeInviteRedirect("/auth/login"), false);
  });

  it("15 wrong-account copy does not leak internals", () => {
    assert.match(INVITE_WRONG_ACCOUNT, /otra cuenta/);
    assert.equal(technicalInviteTermsLeak(INVITE_WRONG_ACCOUNT), false);
  });
});
