class WebProjectError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "WebProjectError";
    this.status = status;
    this.code = code;
    this.details = details || null;
  }
}

module.exports = { WebProjectError };
