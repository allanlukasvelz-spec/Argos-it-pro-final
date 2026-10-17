const { ERROR_CODES, ALLOWED_DOCUMENT_MIME, MIME_EXTENSION } = require("./constants");
const { WebProjectError } = require("./errors");
const { sniffMime } = require("../platform/evidencePolicy");

/**
 * MIME_VALIDATION_LEVEL:
 *   header+extension+magic_where_available
 * Magic bytes exist for PDF, PNG, JPEG, WEBP, OLE(office legacy), ZIP(office openxml), SVG, text.
 * DOCX/XLSX/PPTX share ZIP magic — declared MIME must be an office openxml type, never application/zip.
 */
const MIME_VALIDATION_LEVEL = "header+extension+magic_where_available";

const OFFICE_OPENXML = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

const OFFICE_OLE = new Set([
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint"
]);

function sniffWebProjectMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return "application/x-ole-storage";
  }
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "application/zip";
  }
  const head = buffer.slice(0, Math.min(buffer.length, 256)).toString("utf8").trimStart();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && /<svg[\s>]/i.test(head))) {
    return "image/svg+xml";
  }
  return sniffMime(buffer);
}

function extensionForFilename(filename) {
  const base = String(filename || "").toLowerCase();
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.slice(idx);
}

function assertDeclaredMimeAllowed(mimeType) {
  const declared = String(mimeType || "")
    .trim()
    .toLowerCase()
    .split(";")[0]
    .trim();
  if (!ALLOWED_DOCUMENT_MIME.includes(declared)) {
    throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Tipo de archivo no permitido");
  }
  return declared;
}

function assertMimeAndExtension({ declaredMime, filename, buffer }) {
  const declared = assertDeclaredMimeAllowed(declaredMime);
  const ext = extensionForFilename(filename);
  const allowedExt = MIME_EXTENSION[declared] || [];
  if (!ext || !allowedExt.includes(ext)) {
    throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "La extensión no coincide con el MIME declarado");
  }
  const sniffed = sniffWebProjectMime(buffer);
  if (!sniffed) {
    return { mimeType: declared, extension: ext, sniffed: null };
  }
  if (sniffed === declared) {
    return { mimeType: declared, extension: ext, sniffed };
  }
  if (sniffed === "application/zip" && OFFICE_OPENXML.has(declared)) {
    return { mimeType: declared, extension: ext, sniffed };
  }
  if (sniffed === "application/x-ole-storage" && OFFICE_OLE.has(declared)) {
    return { mimeType: declared, extension: ext, sniffed };
  }
  if (declared === "text/csv" && sniffed === "text/plain") {
    return { mimeType: declared, extension: ext, sniffed };
  }
  if (declared === "text/plain" && sniffed === "application/json") {
    return { mimeType: declared, extension: ext, sniffed };
  }
  throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "El contenido no coincide con el tipo declarado");
}

function isActiveContent(mimeType) {
  return mimeType === "image/svg+xml";
}

module.exports = {
  MIME_VALIDATION_LEVEL,
  sniffWebProjectMime,
  extensionForFilename,
  assertDeclaredMimeAllowed,
  assertMimeAndExtension,
  isActiveContent
};
