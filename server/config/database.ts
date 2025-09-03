import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_gV6OIzYPR0Jh@ep-quiet-thunder-adtsc7t7-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});
