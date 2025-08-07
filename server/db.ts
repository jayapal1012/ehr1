import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: "postgres://ehr_user:ehr_password@localhost:5432/ehr",
});

// Test DB connection
(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully!");
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
  }
})();

console.log("Connecting to DB with:", process.env.DATABASE_URL);
export const db = drizzle(pool, { schema });
