const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const net = require("net");
const tls = require("tls");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { createSmtpTransport } = require("./smtpTransport");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function smtpEnv(port, timeoutMs = "5000") {
  return {
    NODE_ENV: "test",
    ARGOS_EMAIL_TRANSPORT: "smtp",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(port),
    SMTP_SECURE: "false",
    SMTP_USER: "fixture-user",
    SMTP_PASSWORD: "fixture-password",
    EMAIL_FROM: "noreply@example.test",
    CONTACT_EMAIL_TO: "inbox@example.test",
    SMTP_TIMEOUT_MS: timeoutMs
  };
}

function plainServer() {
  return net.createServer((socket) => {
    let mode = "command";
    let buffer = "";
    socket.on("error", () => {});
    socket.write("220 ready\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      if (mode === "data") {
        if (!buffer.includes("\r\n.\r\n")) return;
        socket.write("250 accepted\r\n");
        mode = "command";
        buffer = "";
        return;
      }
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const upper = line.toUpperCase();
        if (upper.startsWith("EHLO")) socket.write("250-local\r\n250 AUTH LOGIN\r\n");
        else if (upper === "AUTH LOGIN") socket.write("334 VXNlcm5hbWU6\r\n");
        else if (line === Buffer.from("fixture-user").toString("base64")) socket.write("334 UGFzc3dvcmQ6\r\n");
        else if (line === Buffer.from("fixture-password").toString("base64")) socket.write("235 ok\r\n");
        else if (upper.startsWith("MAIL FROM")) socket.write("250 ok\r\n");
        else if (upper.startsWith("RCPT TO")) socket.write("250 ok\r\n");
        else if (upper === "DATA") {
          socket.write("354 go\r\n");
          mode = "data";
        } else if (upper === "QUIT") socket.write("221 bye\r\n");
        else socket.write("500 no\r\n");
      }
    });
  });
}

describe("local smtp session", () => {
  const servers = [];
  after(async () => {
    await Promise.all(servers.map((server) => new Promise((resolve) => server.close(() => resolve()))));
  });

  it("accepts a message on a local simulated server without claiming delivery", async () => {
    const server = plainServer();
    servers.push(server);
    const port = await listen(server);
    const result = await createSmtpTransport(smtpEnv(port)).send({
      kind: "invitation",
      to: "person@example.test",
      subject: "Asunto",
      text: "hola"
    });
    assert.equal(result.reason, "SMTP_ACCEPTED");
    assert.equal(result.delivered, false);
    assert.equal(result.accepted, true);
    assert.match(result.messageId, /@argos-it\.local>$/);
  });

  it("records a local rejection as SMTP_REJECTED", async () => {
    const server = net.createServer((socket) => {
      let step = 0;
      socket.on("error", () => {});
      socket.write("220 ready\r\n");
      socket.on("data", (chunk) => {
        const line = chunk.toString("utf8").trim();
        const upper = line.toUpperCase();
        step += 1;
        if (upper.startsWith("EHLO")) socket.write("250 AUTH LOGIN\r\n");
        else if (upper === "AUTH LOGIN" || step === 3) socket.write("334 x\r\n");
        else if (step === 4) socket.write("235 ok\r\n");
        else if (upper.startsWith("MAIL FROM")) socket.write("550 denied\r\n");
        else socket.write("250 ok\r\n");
      });
    });
    servers.push(server);
    const port = await listen(server);
    const result = await createSmtpTransport(smtpEnv(port)).send({
      kind: "invitation",
      to: "person@example.test",
      subject: "Asunto",
      text: "hola"
    });
    assert.equal(result.reason, "SMTP_REJECTED");
    assert.equal(result.delivered, false);
    assert.equal(result.retryable, false);
  });

  it("refuses a self-signed TLS listener", async () => {
    const dir = fs.mkdtempSync("/tmp/argos-v75-smtp-");
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-keyout", `${dir}/key.pem`, "-out", `${dir}/cert.pem`, "-days", "1", "-nodes", "-subj", "/CN=localhost"], { stdio: "ignore" });
    const server = tls.createServer({
      key: fs.readFileSync(`${dir}/key.pem`),
      cert: fs.readFileSync(`${dir}/cert.pem`)
    }, (socket) => socket.end());
    servers.push(server);
    const port = await listen(server);
    const env = smtpEnv(port);
    env.SMTP_SECURE = "true";
    const result = await createSmtpTransport(env).send({
      kind: "invitation",
      to: "person@example.test",
      subject: "Asunto",
      text: "hola"
    });
    assert.equal(result.reason, "SMTP_TLS_INVALID");
    assert.equal(result.delivered, false);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
