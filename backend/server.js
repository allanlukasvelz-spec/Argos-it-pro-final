require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");
const securityRoutes = require("./routes/security");
const contactRoutes = require("./routes/contact");
const clientRoutes = require("./routes/client");
const { generalLimiter, detectBot, aiLimiter } = require("./middleware/security");
const authMiddleware = require("./middleware/auth");

const app = express();
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

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true
  }
});

// Middlewares globales
app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));
app.use(detectBot);
app.use(generalLimiter);

// Rutas públicas
app.use("/api/auth", authRoutes);
app.use("/api/ai/public", aiLimiter, require("./routes/ai-public"));
app.use("/api/contact", contactRoutes);

// Rutas protegidas
app.use("/api/ai", aiLimiter, authMiddleware, aiRoutes);
app.use("/api/security", authMiddleware, securityRoutes);
app.use("/api/client", authMiddleware, clientRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// WebSockets - Chico Guardian
io.on("connection", (socket) => {
  console.log(`[WS] Usuario conectado: ${socket.id}`);

  socket.on("user_action", async (data) => {
    try {
      const { type, userId, details = {} } = data || {};

      console.log(`[CHICO] Acción detectada: ${type}`);

      // Guardar en DB
      if (type) {
        await pool.query(
          "INSERT INTO activity_logs(user_id, action_type, details) VALUES($1, $2, $3)",
          [userId || null, type, JSON.stringify(details)]
        );
      }

      // Análisis de seguridad en tiempo real
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

      // Notificar a admin si es crítico
      if (details?.risk_level === "high") {
        io.to("admin").emit("security_alert", {
          user: userId,
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

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 WebSockets disponibles`);
  console.log(`🤖 IA (Chico + Dumbo) lista`);
});

module.exports = { app, io };
