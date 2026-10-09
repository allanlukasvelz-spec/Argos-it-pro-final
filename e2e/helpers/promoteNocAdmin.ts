import { spawnSync } from "node:child_process";
import path from "node:path";

/** Eleva un usuario local ya registrado a admin. Solo para E2E local, nunca producción. */
export function promoteEmailToAdmin(email: string) {
  const backendDir = path.join(process.cwd(), "backend");
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `
        require("dotenv").config();
        const { Pool } = require("pg");
        const email = process.argv[1];
        (async () => {
          if (!process.env.DATABASE_URL) process.exit(3);
          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          const r = await pool.query(
            "UPDATE users SET role = 'admin', updated_at = NOW() WHERE lower(trim(email)) = lower(trim($1)) RETURNING id",
            [email]
          );
          await pool.end();
          if (!r.rowCount) process.exit(2);
        })().catch((err) => {
          console.error(err.message);
          process.exit(1);
        });
      `,
      email
    ],
    { cwd: backendDir, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(`No se pudo elevar a admin (${result.status}): ${result.stderr || result.stdout || ""}`);
  }
}
