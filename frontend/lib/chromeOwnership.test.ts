/**
 * Chrome ownership / product isolation — visual reconciliation regression.
 * Run: node --experimental-strip-types --test frontend/lib/chromeOwnership.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getChromeOwner,
  shouldHideAssistants,
  shouldHideCookieBanner,
  shouldShowDiagnosticPromo,
  isProductAppRoute
} from "./chromeOwnership.ts";

describe("chromeOwnership — PUBLIC / CLIENT / NOC isolation", () => {
  it("PUBLIC Quiet Authority uses corporate chrome (no diagnostic promo)", () => {
    assert.equal(getChromeOwner("/"), "corporate");
    assert.equal(getChromeOwner("/servicios"), "corporate");
    assert.equal(getChromeOwner("/servicios/soporte-it"), "corporate");
    assert.equal(getChromeOwner("/metodo"), "corporate");
    assert.equal(getChromeOwner("/metodo/analizar"), "corporate");
    assert.equal(getChromeOwner("/sobre-argos-it"), "corporate");
    assert.equal(shouldHideAssistants("/"), false);
    assert.equal(shouldHideCookieBanner("/"), false);
    assert.equal(shouldShowDiagnosticPromo("/"), false);
    assert.equal(shouldShowDiagnosticPromo("/servicios"), false);
  });

  it("CONTACTO keeps corporate chrome", () => {
    assert.equal(getChromeOwner("/contacto"), "corporate");
    assert.equal(getChromeOwner("/contacto/gracias"), "corporate");
  });

  it("PORTAL public page uses corporate chrome", () => {
    assert.equal(getChromeOwner("/portal"), "corporate");
    assert.equal(shouldShowDiagnosticPromo("/portal"), false);
  });

  it("LEGAL keeps legacy chrome without diagnostic promo", () => {
    assert.equal(getChromeOwner("/privacidad"), "legacy");
    assert.equal(shouldShowDiagnosticPromo("/privacidad"), false);
    assert.equal(shouldHideAssistants("/privacidad"), true);
  });

  it("CLIENT owns chrome — no SiteHeader / assistants / cookie banner", () => {
    assert.equal(getChromeOwner("/dashboard"), "none");
    assert.equal(getChromeOwner("/dashboard/informes"), "none");
    assert.equal(getChromeOwner("/dashboard/activos/dominios"), "none");
    assert.equal(isProductAppRoute("/dashboard"), true);
    assert.equal(shouldHideAssistants("/dashboard"), true);
    assert.equal(shouldHideCookieBanner("/dashboard"), true);
    assert.equal(shouldHideAssistants("/dashboard/informes"), true);
    assert.equal(shouldHideCookieBanner("/dashboard/informes"), true);
    assert.equal(shouldShowDiagnosticPromo("/dashboard"), false);
  });

  it("NOC owns chrome exclusively — no public SiteHeader / assistants / cookies", () => {
    assert.equal(getChromeOwner("/noc"), "none");
    assert.equal(getChromeOwner("/noc/reports"), "none");
    assert.equal(getChromeOwner("/noc/agents"), "none");
    assert.equal(getChromeOwner("/noc/incidents/12"), "none");
    assert.equal(isProductAppRoute("/noc"), true);
    assert.equal(shouldHideAssistants("/noc"), true);
    assert.equal(shouldHideCookieBanner("/noc"), true);
    assert.equal(shouldHideAssistants("/noc/reports"), true);
    assert.equal(shouldHideCookieBanner("/noc/reports"), true);
    assert.equal(shouldShowDiagnosticPromo("/noc"), false);
  });

  it("AUTH is product-owned (no marketing chrome)", () => {
    assert.equal(getChromeOwner("/auth/login"), "none");
    assert.equal(shouldHideAssistants("/auth/login"), true);
  });
});
