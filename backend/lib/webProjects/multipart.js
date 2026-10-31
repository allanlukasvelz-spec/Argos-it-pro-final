const busboy = require("busboy");
const { ERROR_CODES, MAX_DOCUMENT_BYTES } = require("./constants");
const { WebProjectError } = require("./errors");

const CLIENT_STORAGE_FIELDS = Object.freeze([
  "objectKey",
  "object_key",
  "storageKey",
  "path",
  "bucket",
  "sha256",
  "scanStatus",
  "scan_status",
  "id"
]);

function clientStorageOverrides(fields) {
  const out = {};
  for (const key of CLIENT_STORAGE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(fields || {}, key)) {
      out[key] = fields[key];
    }
  }
  return out;
}

/**
 * Streaming multipart parser. Rejects oversize during stream.
 * Dependency: busboy (mature, Express 4 has no built-in multipart parser).
 */
function readMultipartDocument(req, { maxBytes = MAX_DOCUMENT_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      reject(new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Se requiere multipart/form-data"));
      return;
    }

    let settled = false;
    const fields = {};
    const chunks = [];
    let fileMeta = null;
    let truncated = false;

    function fail(err) {
      if (settled) return;
      settled = true;
      reject(err);
    }

    function succeed(value) {
      if (settled) return;
      settled = true;
      resolve(value);
    }

    let parser;
    try {
      parser = busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: maxBytes, fields: 16, fieldSize: 4096 }
      });
    } catch (_err) {
      fail(new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Multipart inválido"));
      return;
    }

    parser.on("field", (name, value) => {
      if (typeof name === "string") fields[name] = value;
    });

    parser.on("file", (name, stream, info) => {
      if (name !== "file" || fileMeta) {
        stream.resume();
        return;
      }
      fileMeta = {
        filename: info.filename,
        mimeType: info.mimeType
      };
      stream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      stream.on("limit", () => {
        truncated = true;
        stream.resume();
      });
    });

    parser.on("error", () => {
      fail(new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Multipart inválido"));
    });

    function finish() {
      if (truncated) {
        fail(new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Archivo demasiado grande"));
        return;
      }
      if (!fileMeta) {
        fail(new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Archivo requerido"));
        return;
      }
      succeed({
        buffer: Buffer.concat(chunks),
        filename: fileMeta.filename,
        declaredMime: fileMeta.mimeType,
        fields
      });
    }

    parser.on("close", finish);
    parser.on("finish", finish);
    req.pipe(parser);
  });
}

module.exports = { readMultipartDocument, clientStorageOverrides, CLIENT_STORAGE_FIELDS };
