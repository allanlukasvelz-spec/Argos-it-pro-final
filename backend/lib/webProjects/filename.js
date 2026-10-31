const { ERROR_CODES, MAX_FILENAME_LENGTH } = require("./constants");
const { WebProjectError } = require("./errors");

function sanitizeOriginalFilename(raw) {
  const source = String(raw || "");
  if (!source.trim()) {
    throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Nombre de archivo requerido");
  }
  if (
    source.includes("\0") ||
    source.includes("..") ||
    source.includes("/") ||
    source.includes("\\") ||
    /[\r\n]/.test(source)
  ) {
    throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Nombre de archivo no permitido");
  }
  const cleaned = source.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Nombre de archivo no permitido");
  }
  return cleaned.slice(0, MAX_FILENAME_LENGTH);
}

function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

module.exports = { sanitizeOriginalFilename, contentDisposition };
