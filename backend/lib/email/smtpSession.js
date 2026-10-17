const net = require("net");
const tls = require("tls");

function attachReplyReader(socket) {
  let buffer = "";
  let lines = [];
  let pending = null;

  function flush() {
    if (!pending) return;
    const index = lines.findIndex((line) => /^\d{3} /.test(line));
    if (index < 0) return;
    const consumed = lines.slice(0, index + 1);
    lines = lines.slice(index + 1);
    const current = pending;
    pending = null;
    current.resolve({ code: Number(consumed.at(-1).slice(0, 3)), lines: consumed });
  }

  function fail(error) {
    const current = pending;
    pending = null;
    if (current) current.reject(error);
  }

  function onData(chunk) {
    buffer += chunk.toString("utf8");
    const parts = buffer.split(/\r?\n/);
    buffer = parts.pop() || "";
    lines.push(...parts.filter((line) => line.length > 0));
    flush();
  }

  function onTimeout() {
    const error = new Error("SMTP timeout");
    error.code = "ETIMEDOUT";
    socket.destroy();
    fail(error);
  }

  socket.on("data", onData);
  socket.on("error", fail);
  socket.on("timeout", onTimeout);

  return {
    readReply() {
      if (pending) {
        return Promise.reject(Object.assign(new Error("SMTP reply pending"), { code: "ECONNECTION" }));
      }
      return new Promise((resolve, reject) => {
        pending = { resolve, reject };
        flush();
      });
    },
    detach() {
      socket.off("data", onData);
      socket.off("error", fail);
      socket.off("timeout", onTimeout);
    }
  };
}

function openSocket(options, secure) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({
          host: options.host,
          port: options.port,
          servername: net.isIP(options.host) ? undefined : options.host,
          rejectUnauthorized: true
        })
      : net.connect({ host: options.host, port: options.port });
    socket.setTimeout(options.socketTimeout);
    const onError = (error) => {
      socket.destroy();
      reject(error);
    };
    socket.once("error", onError);
    socket.once(secure ? "secureConnect" : "connect", () => {
      socket.off("error", onError);
      resolve(socket);
    });
  });
}

function upgradeStartTls(socket, options) {
  return new Promise((resolve, reject) => {
    const secure = tls.connect({
      socket,
      servername: net.isIP(options.host) ? undefined : options.host,
      rejectUnauthorized: true
    });
    secure.setTimeout(options.socketTimeout);
    secure.once("error", reject);
    secure.once("secureConnect", () => resolve(secure));
  });
}

function dotStuff(text) {
  return String(text || "")
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

async function expectCode(reply, expected, code) {
  if (!expected.includes(reply.code)) {
    const error = new Error("SMTP rejected");
    error.code = code || "ECONNECTION";
    error.responseCode = reply.code;
    throw error;
  }
}

async function sendSmtpMessage(options, message) {
  if (!options?.tls || options.tls.rejectUnauthorized !== true) {
    const error = new Error("SMTP TLS verification disabled");
    error.code = "ESOCKET";
    throw error;
  }
  let socket = await openSocket(options, options.secure);
  let reader = attachReplyReader(socket);
  try {
    await expectCode(await reader.readReply(), [220]);
    let hello = await command(socket, reader, "EHLO argos-it.local");
    await expectCode(hello, [250]);
    if (!options.secure && hello.lines.some((line) => /STARTTLS/i.test(line))) {
      await expectCode(await command(socket, reader, "STARTTLS"), [220]);
      reader.detach();
      socket = await upgradeStartTls(socket, options);
      reader = attachReplyReader(socket);
      hello = await command(socket, reader, "EHLO argos-it.local");
      await expectCode(hello, [250]);
    }
    await expectCode(await command(socket, reader, "AUTH LOGIN"), [334], "EAUTH");
    await expectCode(await command(socket, reader, Buffer.from(options.auth.user).toString("base64")), [334], "EAUTH");
    await expectCode(await command(socket, reader, Buffer.from(options.auth.pass).toString("base64")), [235], "EAUTH");
    await expectCode(await command(socket, reader, `MAIL FROM:<${message.from}>`), [250]);
    await expectCode(await command(socket, reader, `RCPT TO:<${message.to}>`), [250]);
    await expectCode(await command(socket, reader, "DATA"), [354]);
    const messageId = `<${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}@argos-it.local>`;
    const headers = [
      `From: <${message.from}>`,
      `To: <${message.to}>`,
      `Subject: ${message.subject}`,
      message.replyTo ? `Reply-To: <${message.replyTo}>` : null,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      `Message-ID: ${messageId}`
    ].filter(Boolean);
    socket.write(`${headers.join("\r\n")}\r\n\r\n${dotStuff(message.text)}\r\n.\r\n`);
    await expectCode(await reader.readReply(), [250]);
    socket.write("QUIT\r\n");
    return { messageId };
  } finally {
    socket.on("error", () => {});
    socket.destroy();
  }
}

function command(socket, reader, line) {
  socket.write(`${line}\r\n`);
  return reader.readReply();
}

function createNodeSmtpTransporter(options) {
  return {
    async sendMail(message) {
      return sendSmtpMessage(options, message);
    }
  };
}

module.exports = {
  createNodeSmtpTransporter,
  sendSmtpMessage
};
