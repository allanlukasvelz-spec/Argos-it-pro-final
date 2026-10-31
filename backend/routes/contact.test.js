const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const contactRoutes = require("../routes/contact");
const { __resetStoreForTests } = require("../lib/contactCaptcha");

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
  beforeEach(() => {
    __resetStoreForTests();
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
