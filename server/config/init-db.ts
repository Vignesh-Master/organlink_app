import { pool } from "./database.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🚀 Initializing database schema...");

    // Read the schema file
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");

    // Execute the schema
    await pool.query(schema);

    console.log("✅ Database schema initialized successfully");

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = result.rows.map((row) => row.table_name);
    console.log(`📊 Created ${tables.length} tables:`, tables.join(", "));
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export async function createDefaultAdminIfNotExists(): Promise<void> {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM admins");
    const adminCount = parseInt(result.rows[0].count);

    if (adminCount === 0) {
      console.log("👤 Creating default admin user...");
      // Password is "admin123" hashed with bcrypt
      await pool.query(
        `
        INSERT INTO admins (email, password, full_name) 
        VALUES ($1, $2, $3)
      `,
        [
          "admin@organlink.org",
          "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
          "System Administrator",
        ],
      );
      console.log("✅ Default admin created (admin@organlink.org / admin123)");
    }
  } catch (error) {
    console.error("❌ Failed to create default admin:", error);
  }
}
