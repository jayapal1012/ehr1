// db.ts or wherever you configure Drizzle
import * as dotenv from "dotenv";
dotenv.config(); // 👈 ensures env vars from .env are loaded
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema"; // or wherever your schema.ts is

//const pool = new Pool({
  //connectionString: process.env.DATABASE_URL, // e.g. postgres://user:pass@localhost:5432/db
  
//});
const pool = new Pool({
  connectionString: "postgres://ehr_user:ehr_password@localhost:5432/ehr",
});

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
