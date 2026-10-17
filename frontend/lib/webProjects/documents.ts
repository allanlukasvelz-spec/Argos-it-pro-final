export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.svg";

const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg"
]);

export function clientFileRejection(file: File | null): string | null {
  if (!file) return "Selecciona un archivo.";
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_DOCUMENT_BYTES) return "El archivo supera los 20 MB.";
  const name = file.name.toLowerCase();
  const idx = name.lastIndexOf(".");
  const ext = idx >= 0 ? name.slice(idx) : "";
  if (!ext || !ALLOWED_EXT.has(ext)) return "Formato no admitido.";
  return null;
}

export function formatBytes(bytes: number | null | undefined): string {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function isSvgDocument(mimeType: string | null | undefined, filename?: string): boolean {
  if (String(mimeType || "").toLowerCase() === "image/svg+xml") return true;
  return String(filename || "").toLowerCase().endsWith(".svg");
}
