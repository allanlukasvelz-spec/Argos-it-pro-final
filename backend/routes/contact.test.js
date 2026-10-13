const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const contactRoutes = require("../routes/contact");
const { __resetStoreForTests } = require("../lib/contactCaptcha");
const { clearQaMessages, listQaMessages } = require("../lib/email/qaOutbox");

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

  beforeEach(() => {
    __resetStoreForTests();
    clearQaMessages();
    delete process.env.ARGOS_EMAIL_TRANSPORT;
  });

  afterEach(() => {
    if (previousTransport === undefined) delete process.env.ARGOS_EMAIL_TRANSPORT;
    else process.env.ARGOS_EMAIL_TRANSPORT = previousTransport;
    clearQaMessages();
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
});
