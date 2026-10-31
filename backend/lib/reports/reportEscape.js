/**
 * HTML escape for report templates — no raw customer HTML in reports.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsonForHtml(obj) {
  return escapeHtml(JSON.stringify(obj));
}

module.exports = { escapeHtml, escapeJsonForHtml };
