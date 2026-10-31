const { seedArchitectureMinimum } = require("./phase12.fixtures");

const TOUR_BUSINESS_EXTRA = Object.freeze([
  { fieldKey: "offer_kinds", value: ["experiences"] },
  { fieldKey: "sales_mode", value: "online_booking" },
  { fieldKey: "company_trade_name", value: "Demo Activities" }
]);

async function seedTourBusiness(svc, organizationId, projectId, actorUserId) {
  await seedArchitectureMinimum(svc, organizationId, projectId, actorUserId, TOUR_BUSINESS_EXTRA);
  for (const row of [
    { title: "City Walk", itemType: "tour", payload: { summary: "Paseo urbano de ejemplo" } },
    { title: "Coast Tour", itemType: "tour", payload: { summary: "Ruta costera de ejemplo" } }
  ]) {
    await svc.addItem(organizationId, projectId, actorUserId, row);
  }
}

async function seedServiceBusiness(svc, organizationId, projectId, actorUserId) {
  await seedArchitectureMinimum(svc, organizationId, projectId, actorUserId);
  for (const row of [
    { title: "Consultoría", itemType: "service", payload: { summary: "Servicio de consultoría" } },
    { title: "Implementación", itemType: "service", payload: { summary: "Servicio de implementación" } }
  ]) {
    await svc.addItem(organizationId, projectId, actorUserId, row);
  }
}

async function moveProjectToArchitecture(svc, organizationId, projectId, actorUserId) {
  await svc.transition(organizationId, projectId, actorUserId, "REVIEW");
  return svc.startArchitecture(organizationId, projectId, actorUserId, {
    acknowledgeOpenItems: true,
    reason: "Fixture Phase 13 — avisos conocidos en datos de prueba."
  });
}

module.exports = {
  TOUR_BUSINESS_EXTRA,
  seedTourBusiness,
  seedServiceBusiness,
  moveProjectToArchitecture
};
