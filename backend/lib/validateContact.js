const { validateEmailFormat } = require("../middleware/security");

const PHONE_REGEX = /^[+]?[\d\s().-]{7,20}$/;

function clean(value = "") {
  return String(value).trim().slice(0, 2000);
}

function validateContactBody(body = {}) {
  if (clean(body.website)) {
    return { honeypot: true };
  }

  const payload = {
    name: clean(body.name),
    email: clean(body.email),
    company: clean(body.company),
    phone: clean(body.phone),
    service: clean(body.service),
    message: clean(body.message)
  };

  const errors = [];

  if (!payload.name) errors.push("name");
  if (!payload.email) errors.push("email");
  else if (!validateEmailFormat(payload.email)) errors.push("email");
  if (!payload.phone) errors.push("phone");
  else if (!PHONE_REGEX.test(payload.phone)) errors.push("phone");
  if (!payload.company) errors.push("company");
  if (!payload.service) errors.push("service");
  if (!payload.message) errors.push("message");

  return { honeypot: false, errors, payload };
}

module.exports = {
  clean,
  validateContactBody
};
