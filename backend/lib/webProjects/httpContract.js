const { CLIENT_PATCH_FIELDS, NOC_PATCH_FIELDS, PROTECTED_PROJECT_FIELDS, ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function pickPatch(body, allowedFields) {
  const src = body && typeof body === "object" ? body : {};
  for (const key of PROTECTED_PROJECT_FIELDS) {
    if (hasOwn(src, key)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, `Campo no modificable: ${key}`);
    }
  }
  const out = {};
  for (const key of allowedFields) {
    if (hasOwn(src, key)) out[key] = src[key];
  }
  return out;
}

function pickClientPatch(body) {
  return pickPatch(body, CLIENT_PATCH_FIELDS);
}

function pickNocPatch(body) {
  return pickPatch(body, NOC_PATCH_FIELDS);
}

module.exports = {
  hasOwn,
  pickPatch,
  pickClientPatch,
  pickNocPatch
};
