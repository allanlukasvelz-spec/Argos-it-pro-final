const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no configurada. Define esta variable en tu entorno.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on("error", (err) => {
  console.error("Error en pool PostgreSQL:", err);
});

module.exports = pool;
