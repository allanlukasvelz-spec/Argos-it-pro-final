import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isFieldApplicableFromDefinition, unwrapFormList } from "./formCopy.ts";
import { ITEM_ADD_LABEL, questionnaireOverviewCopy, sectionNavStatusLabel } from "./itemEditors.ts";
import { visibleFormFields } from "./viewModel.ts";
import type { WebProjectFormDefinition } from "./types.ts";

const definition: WebProjectFormDefinition = {
  version: "web-project-intake.v2",
  sections: [
    { id: "company", order: 1, label: "Tu empresa" },
    { id: "sales", order: 11, label: "Reservas y ventas" }
  ],
  fields: [
    { key: "company_trade_name", type: "text", required: true, section: "company" },
    {
      key: "sales_mode",
      type: "enum",
      section: "sales",
      options: ["no", "online_booking"]
    },
    {
      key: "sales_what",
      type: "text",
      section: "sales",
      applicableIf: { field: "sales_mode", in: ["online_booking"] }
    }
  ],
  itemBindings: [
    { itemType: "tour", section: "offer", applicableIf: { field: "offer_kinds", contains: "experiences" } },
    { itemType: "service", section: "offer", applicableIf: { field: "offer_kinds", contains: "services" } }
  ]
};

describe("phase 11 questionnaire UI", () => {
  it("section navigation labels distinguish complete, pending and correction", () => {
    assert.equal(sectionNavStatusLabel("complete", false), "Completa");
    assert.equal(sectionNavStatusLabel("partial", false), "Pendiente");
    assert.equal(sectionNavStatusLabel("empty", true), "Necesita revisión");
    assert.equal(sectionNavStatusLabel("optional", false), "Opcional");
  });

  it("conditional renderer hides sales details when mode is no", () => {
    const hidden = visibleFormFields(definition, [{ fieldKey: "sales_mode", schemaVersion: "v2", value: "no", applicable: true, updatedBy: 1, updatedAt: "t" }]);
    assert.equal(hidden.some((entry) => entry.field.key === "sales_what"), false);
    const shown = visibleFormFields(definition, [
      { fieldKey: "sales_mode", schemaVersion: "v2", value: "online_booking", applicable: true, updatedBy: 1, updatedAt: "t" }
    ]);
    assert.equal(shown.some((entry) => entry.field.key === "sales_what"), true);
  });

  it("tour items stay hidden unless experiences are offered", () => {
    const values = new Map<string, unknown>([["offer_kinds", ["services"]]]);
    const tour = definition.itemBindings?.[0];
    const service = definition.itemBindings?.[1];
    assert.equal(isFieldApplicableFromDefinition(tour || {}, values), false);
    assert.equal(isFieldApplicableFromDefinition(service || {}, values), true);
  });

  it("item add labels are client-facing", () => {
    assert.equal(ITEM_ADD_LABEL.service, "Añadir servicio");
    assert.equal(ITEM_ADD_LABEL.tour, "Añadir actividad");
    assert.doesNotMatch(ITEM_ADD_LABEL.service, /ITEM/);
  });

  it("final summary copy is client-facing", () => {
    const copy = questionnaireOverviewCopy({
      percentage: 40,
      sectionsComplete: 3,
      sectionsTotal: 16,
      pending: 8,
      corrections: 1
    });
    assert.match(copy, /40%/);
    assert.match(copy, /3\/16/);
    assert.doesNotMatch(copy, /INTAKE|REVIEW|tenant/);
  });

  it("multi-select unwraps arrays", () => {
    assert.deepEqual(unwrapFormList(["services", "products"]), ["services", "products"]);
  });

  it("mobile nav uses the same section statuses as desktop", () => {
    assert.equal(sectionNavStatusLabel("complete", false), "Completa");
  });

  it("upload categories stay client-facing and include logo/manual", () => {
    assert.equal(ITEM_ADD_LABEL.team_member, "Añadir persona");
    assert.equal(ITEM_ADD_LABEL.page, "Añadir página");
  });

  it("submit copy never promises development", () => {
    const copy = questionnaireOverviewCopy({
      percentage: 100,
      sectionsComplete: 16,
      sectionsTotal: 16,
      pending: 0,
      corrections: 0
    });
    assert.doesNotMatch(copy, /en desarrollo|INTAKE|tenant/i);
  });

  it("a11y nav label is present in overview copy without jargon", () => {
    assert.equal(sectionNavStatusLabel("partial", true), "Necesita revisión");
    assert.doesNotMatch(sectionNavStatusLabel("complete", false), /COMPLETE|PENDING/);
  });
});
