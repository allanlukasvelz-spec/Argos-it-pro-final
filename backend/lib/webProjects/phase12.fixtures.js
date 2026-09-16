const ARCHITECTURE_MINIMUM_RESPONSES = Object.freeze([
  { fieldKey: "company_trade_name", value: "Acme Demo" },
  { fieldKey: "company_city", value: "Valencia" },
  { fieldKey: "company_country", value: "España" },
  { fieldKey: "company_phone", value: "+34 600 000 000" },
  { fieldKey: "company_email", value: "hola@acme-demo.test" },
  { fieldKey: "company_contact_name", value: "Ana Pérez" },
  { fieldKey: "company_entity_type", value: "company" },
  { fieldKey: "company_multiple_locations", value: "no" },
  { fieldKey: "has_existing_site", value: "no" },
  { fieldKey: "brand_has_logo", value: "no" },
  { fieldKey: "brand_has_manual", value: "no" },
  { fieldKey: "about_who", value: "Equipo de ejemplo" },
  { fieldKey: "about_what_you_do", value: "Servicios profesionales de ejemplo" },
  { fieldKey: "goals_objectives", value: ["professional_presence"] },
  { fieldKey: "goals_primary_success", value: "Una web clara para el cliente" },
  { fieldKey: "goals_b2b_b2c", value: "b2b" },
  { fieldKey: "goals_priority", value: "normal" },
  { fieldKey: "offer_kinds", value: ["services"] },
  { fieldKey: "content_has_texts", value: "no" },
  { fieldKey: "content_needs_copy", value: "yes" },
  { fieldKey: "media_has_photos", value: "no" },
  { fieldKey: "media_has_videos", value: "no" },
  { fieldKey: "media_needs_production", value: "yes" },
  { fieldKey: "media_commercial_rights", value: "pending" },
  { fieldKey: "primary_language", value: "es" },
  { fieldKey: "languages_multilingual", value: "no" },
  { fieldKey: "sales_mode", value: "contact_forms" },
  { fieldKey: "access_ack_no_secrets", value: "yes" },
  { fieldKey: "confirm_reviewed", value: "yes" },
  { fieldKey: "confirm_use_material", value: "yes" },
  { fieldKey: "confirm_authorization", value: "yes" }
]);

async function seedArchitectureMinimum(svc, organizationId, projectId, actorUserId, extra = []) {
  const project = await svc.getProject(organizationId, projectId);
  const responses = ARCHITECTURE_MINIMUM_RESPONSES.map((row) => ({ ...row }));
  if ((project.projectType || project.project_type) === "improve") {
    const withoutSite = responses.filter((row) => row.fieldKey !== "has_existing_site");
    withoutSite.push(
      { fieldKey: "has_existing_site", value: "yes" },
      { fieldKey: "existing_url", value: "https://www.example.com" }
    );
    responses.splice(0, responses.length, ...withoutSite);
  }
  for (const row of extra) {
    const index = responses.findIndex((item) => item.fieldKey === row.fieldKey);
    if (index >= 0) responses[index] = row;
    else responses.push(row);
  }
  return svc.upsertForm(organizationId, projectId, actorUserId, responses);
}

module.exports = { ARCHITECTURE_MINIMUM_RESPONSES, seedArchitectureMinimum };
