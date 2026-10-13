const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const contactRoutes = require("../routes/contact");
const { __resetStoreForTests } = require("../lib/contactCaptcha");
const { clearQaMessages, listQaMessages } = require("../lib/email/qaOutbox");
const { setSmtpTransporterForTests } = require("../lib/email/smtpTransport");
const { resetAllRateLimitStores } = require("../lib/rateLimitRegistry");

async function withContactServer(run) {
  const app = express();
  app.use(express.json());
  app.use("/api/contact", contactRoutes);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const validBody = {
  name: "Ana Test",
  email: "ana@example.com",
  phone: "+34 600 000 000",
  company: "Empresa demo",
  service: "consultoria-it",
  message: "Necesitamos revisar nuestra infraestructura.",
  website: ""
};

describe("contact routes", () => {
  const previousTransport = process.env.ARGOS_EMAIL_TRANSPORT;

  const previousNodeEnv = process.env.NODE_ENV;
  const smtpKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM", "CONTACT_EMAIL_TO", "CONTACT_FORM_ENDPOINT"];
  const previousSmtp = Object.fromEntries(smtpKeys.map((key) => [key, process.env[key]]));

  beforeEach(() => {
    __resetStoreForTests();
    clearQaMessages();
    resetAllRateLimitStores();
    setSmtpTransporterForTests(null);
    delete process.env.ARGOS_EMAIL_TRANSPORT;
    for (const key of smtpKeys) delete process.env[key];
  });

  afterEach(() => {
    if (previousTransport === undefined) delete process.env.ARGOS_EMAIL_TRANSPORT;
    else process.env.ARGOS_EMAIL_TRANSPORT = previousTransport;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    for (const key of smtpKeys) {
      if (previousSmtp[key] === undefined) delete process.env[key];
      else process.env[key] = previousSmtp[key];
    }
    clearQaMessages();
    setSmtpTransporterForTests(null);
  });

  it("blocks direct POST without captcha validation", async () => {
    await withContactServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(validBody)
      });
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.equal(body.code, "CAPTCHA_INVALID");
    });
  });

  it("blocks wrong captcha answers", async () => {
    await withContactServer(async (baseUrl) => {
      const challengeRes = await fetch(`${baseUrl}/api/contact/challenge`);
      const challenge = await challengeRes.json();
      const response = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...validBody,
          challengeId: challenge.challengeId,
          captchaAnswer: "0"
        })
      });
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.equal(body.code, "CAPTCHA_INVALID");
    });
  });

  it("accepts correct captcha and validates without external relay configured", async () => {
    await withContactServer(async (baseUrl) => {
      const challengeRes = await fetch(`${baseUrl}/api/contact/challenge`);
      const challenge = await challengeRes.json();
      const [left, right] = challenge.question.split("+").map((part) => Number.parseInt(part.trim(), 10));
      const response = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...validBody,
          challengeId: challenge.challengeId,
          captchaAnswer: String(left + right)
        })
      });
      assert.equal(response.status, 202);
    });
  });

  it("dispatches a valid captcha submission to the QA transport without real delivery", async () => {
    process.env.ARGOS_EMAIL_TRANSPORT = "qa";
    await withContactServer(async (baseUrl) => {
      const challengeRes = await fetch(`${baseUrl}/api/contact/challenge`);
      const challenge = await challengeRes.json();
      const [left, right] = challenge.question.split("+").map((part) => Number.parseInt(part.trim(), 10));
      const response = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...validBody,
          challengeId: challenge.challengeId,
          captchaAnswer: String(left + right)
        })
      });
      assert.equal(response.status, 202);
      const body = await response.json();
      assert.equal(body.dispatch, "qa");
      assert.equal(body.delivered, false);
      assert.match(body.message, /no se ha entregado/i);
      const stored = listQaMessages();
      assert.equal(stored.length, 1);
      assert.equal(stored[0].kind, "contact");
      assert.equal(stored[0].delivered, false);
      assert.equal(stored[0].dispatched, true);
      assert.equal(stored[0].to, null);
    });
  });

  it("silently accepts honeypot submissions", async () => {
    await withContactServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...validBody,
          website: "https://spam.example"
        })
      });
      assert.equal(response.status, 200);
    });
  });

  async function postSolved(baseUrl, body = validBody) {
    const challengeRes = await fetch(`${baseUrl}/api/contact/challenge`);
    const challenge = await challengeRes.json();
    const [left, right] = challenge.question.split("+").map((part) => Number.parseInt(part.trim(), 10));
    return {
      challenge,
      response: await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...body,
          challengeId: challenge.challengeId,
          captchaAnswer: String(left + right)
        })
      })
    };
  }

  function enableSmtpFixture() {
    process.env.ARGOS_EMAIL_TRANSPORT = "smtp";
    process.env.SMTP_HOST = "smtp.invalid";
    process.env.SMTP_PORT = "2525";
    process.env.SMTP_USER = "fixture-user";
    process.env.SMTP_PASSWORD = "fixture-password";
    process.env.EMAIL_FROM = "noreply@example.test";
    process.env.CONTACT_EMAIL_TO = "inbox@example.test";
  }

  it("does not use QA when production sets the QA flag", async () => {
    process.env.NODE_ENV = "production";
    process.env.ARGOS_EMAIL_TRANSPORT = "qa";
    await withContactServer(async (baseUrl) => {
      const { response } = await postSolved(baseUrl);
      assert.equal(response.status, 202);
      assert.equal(listQaMessages().length, 0);
    });
  });

  it("accepts a simulated SMTP message without claiming delivery", async () => {
    enableSmtpFixture();
    const seen = [];
    setSmtpTransporterForTests({
      async sendMail(message) {
        seen.push(message);
        return { messageId: "<fixture@example.test>" };
      }
    });
    await withContactServer(async (baseUrl) => {
      const { response } = await postSolved(baseUrl);
      assert.equal(response.status, 202);
      const body = await response.json();
      assert.equal(body.delivered, false);
      assert.equal(body.accepted, true);
      assert.match(body.message, /no está confirmada/i);
      assert.equal(seen.length, 1);
      assert.equal(seen[0].from, "noreply@example.test");
      assert.equal(seen[0].to, "inbox@example.test");
      assert.equal(seen[0].replyTo, "ana@example.com");
      assert.equal(seen[0].html, undefined);
      assert.doesNotMatch(JSON.stringify(body), /fixture-password|wpi_/);
    });
  });

  it("returns a safe failure when SMTP is selected without credentials", async () => {
    process.env.ARGOS_EMAIL_TRANSPORT = "smtp";
    let calls = 0;
    setSmtpTransporterForTests({
      async sendMail() {
        calls += 1;
        return {};
      }
    });
    await withContactServer(async (baseUrl) => {
      const { response } = await postSolved(baseUrl);
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.delivered, false);
      assert.equal(body.code, "SMTP_CONFIG_INVALID");
      assert.equal(calls, 0);
    });
  });

  it("reports SMTP rejection and timeout without a false delivery", async () => {
    enableSmtpFixture();
    setSmtpTransporterForTests({
      async sendMail() {
        const error = new Error("rejected");
        error.responseCode = 550;
        throw error;
      }
    });
    await withContactServer(async (baseUrl) => {
      const rejected = await postSolved(baseUrl);
      assert.equal(rejected.response.status, 502);
      const rejectedBody = await rejected.response.json();
      assert.equal(rejectedBody.delivered, false);
      assert.equal(rejectedBody.code, "SMTP_REJECTED");
    });
    setSmtpTransporterForTests({
      async sendMail() {
        const error = new Error("timeout");
        error.code = "ETIMEDOUT";
        throw error;
      }
    });
    await withContactServer(async (baseUrl) => {
      const timedOut = await postSolved(baseUrl);
      assert.equal(timedOut.response.status, 504);
      const body = await timedOut.response.json();
      assert.equal(body.code, "SMTP_TIMEOUT");
      assert.match(body.error, /no se ha reintentado/i);
    });
  });

  it("does not send twice when the same captcha is repeated", async () => {
    enableSmtpFixture();
    let calls = 0;
    setSmtpTransporterForTests({
      async sendMail() {
        calls += 1;
        return { messageId: "<fixture@example.test>" };
      }
    });
    await withContactServer(async (baseUrl) => {
      const first = await postSolved(baseUrl);
      assert.equal(first.response.status, 202);
      const replay = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...validBody,
          challengeId: first.challenge.challengeId,
          captchaAnswer: "0"
        })
      });
      assert.equal(replay.status, 400);
      assert.equal(calls, 1);
    });
  });

  it("rate limits repeated contact posts", async () => {
    await withContactServer(async (baseUrl) => {
      let limited = 0;
      for (let index = 0; index < 6; index += 1) {
        const response = await fetch(`${baseUrl}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(validBody)
        });
        if (response.status === 429) limited += 1;
      }
      assert.equal(limited >= 1, true);
    });
  });
});
