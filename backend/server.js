require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const pool = require("./db");
const { isAllowedWsActionType, sanitizeWsDetails } = require("./lib/wsActions");
const { ensureRefreshSessionsTable } = require("./lib/ensureRefreshSessions");
const { ensureClientDiagnosticsTable } = require("./lib/ensureClientDiagnosticsTable");

const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");
const securityRoutes = require("./routes/security");
const contactRoutes = require("./routes/contact");
const clientRoutes = require("./routes/client");
const { generalLimiter, detectBot, aiLimiter } = require("./middleware/security");
const authMiddleware = require("./middleware/auth");
const csrfOriginGuard = require("./middleware/csrfOrigin");

const app = express();
// Trust the single Traefik hop so rate limits use the real client IP.
app.set("trust proxy", 1);
const server = http.createServer(app);
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true
};

const socketIoEnabled = process.env.ENABLE_SOCKET_IO !== "false";

/** @type {import("socket.io").Server | null} */
let io = null;

if (socketIoEnabled) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.length < 32) {
        return next(new Error("Servidor sin JWT configurado"));
      }
      const token =
        socket.handshake.auth?.token ||
        (typeof socket.handshake.query?.token === "string" ? socket.handshake.query.token : null);
      if (!token || typeof token !== "string") {
        return next(new Error("Token de autenticacion requerido"));
      }
      const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
      const decoded = jwt.verify(raw, secret);
      const userId = decoded?.id;
      if (!userId) {
        return next(new Error("Token invalido"));
      }
      socket.data.userId = userId;
      socket.data.role = decoded.role || "cliente";
      socket.data.email = decoded.email;
      next();
    } catch (err) {
      next(new Error("Token invalido o expirado"));
    }
  });

  io.on("connection", (socket) => {
    const sessionUserId = socket.data.userId;
    const role = socket.data.role || "cliente";
    if (role === "admin" || role === "super_admin") {
      socket.join("admin");
    }
    console.log(`[WS] Usuario conectado: ${socket.id} (user ${sessionUserId})`);

    socket.on("user_action", async (data) => {
      try {
        const type = data?.type;
        const details = sanitizeWsDetails(data?.details);

        if (!type || !isAllowedWsActionType(type)) {
          socket.emit("chico_error", { message: "Tipo de accion no permitido" });
          return;
        }

        console.log(`[CHICO] Accion detectada: ${type} (user ${sessionUserId})`);

        await pool.query(
          "INSERT INTO activity_logs(user_id, action_type, details) VALUES($1, $2, $3)",
          [sessionUserId, type, JSON.stringify(details)]
        );

        if (type === "login_failed") {
          socket.emit("chico_alert", {
            level: "warning",
            message: "⚠️ Intento de login fallido detectado"
          });
        }

        if (type === "suspicious_behavior") {
          socket.emit("chico_alert", {
            level: "critical",
            message: "🔒 Comportamiento sospechoso detectado. Verificando..."
          });
        }

        if (details?.risk_level === "high" && io) {
          io.to("admin").emit("security_alert", {
            user: sessionUserId,
            action: type,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error("[CHICO ERROR]", error);
        socket.emit("chico_error", { message: "Error procesando acción" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[WS] Usuario desconectado: ${socket.id}`);
    });
  });
}

// Middlewares globales
app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "512kb" }));
app.use(morgan("combined"));
app.use(detectBot);
app.use(generalLimiter);
app.use(csrfOriginGuard(allowedOrigins));

// Rutas públicas
app.use("/api/auth", authRoutes);
app.use("/api/ai/public", aiLimiter, require("./routes/ai-public"));
app.use("/api/contact", contactRoutes);

// Rutas protegidas
app.use("/api/ai", aiLimiter, authMiddleware, aiRoutes);
app.use("/api/security", authMiddleware, securityRoutes);
app.use("/api/client", authMiddleware, clientRoutes);

// Health check — verifies database connectivity
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "OK", db: "connected", timestamp: new Date() });
  } catch (_err) {
    res.status(503).json({ status: "DEGRADED", db: "disconnected", timestamp: new Date() });
  }
});

// Global error handler — prevents stack traces and internal paths from reaching the client
app.use((err, _req, res, _next) => {
  if (String(err.message).includes("CORS")) {
    res.status(403).json({ error: "Origen no permitido" });
    return;
  }

  console.error("[SERVER] Unhandled error:", err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const PORT = process.env.PORT || 4000;

server.on("error", (err) => {
  console.error("Error en servidor HTTP:", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(`Puerto ${PORT} en uso. Cierra el otro proceso o define PORT distinto.`);
  }
  process.exit(1);
});

async function start() {
  try {
    await ensureRefreshSessionsTable(pool);
    await ensureClientDiagnosticsTable(pool);
  } catch (err) {
    console.error("❌ No se pudo asegurar la tabla refresh_sessions:", err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
    if (socketIoEnabled) {
      console.log(`📡 WebSockets disponibles`);
    } else {
      console.log(`📡 WebSockets desactivados (ENABLE_SOCKET_IO=false)`);
    }
    console.log(`🤖 IA (Chico + Dumbo) lista`);
  });
}

start();

module.exports = { app, io };
