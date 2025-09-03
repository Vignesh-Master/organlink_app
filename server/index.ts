import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import { initializeDatabase, checkDatabaseConnection, createDefaultAdminIfNotExists } from "./config/init-db.js";
import { handleDemo } from "./routes/demo";
import adminAuthRoutes from "./routes/admin-auth";
import hospitalRoutes from "./routes/hospitals";
import organizationRoutes from "./routes/organizations";
import dashboardRoutes from "./routes/dashboard";
import logsRoutes from "./routes/logs";
import hospitalAuthRoutes from "./routes/hospital-auth";
import hospitalPatientsRoutes from "./routes/hospital-patients";
import hospitalDonorsRoutes from "./routes/hospital-donors";
import hospitalDashboardRoutes from "./routes/hospital-dashboard";
import fileUploadRoutes from "./routes/file-upload";
import hospitalMatchingRoutes from "./routes/hospital-matching";
import hospitalReportsRoutes from "./routes/hospital-reports";
import hospitalNotificationsRoutes from "./routes/hospital-notifications";
import hospitalCleanupRoutes from "./routes/hospital-cleanup";
import adminBlockchainRoutes from "./routes/admin-blockchain";
import organizationAuthRoutes from "./routes/organization-auth";
import organizationPoliciesRoutes from "./routes/organization-policies";

export function createServer() {
  const app = express();

  // Middleware
  const corsOrigin = process.env.CORS_ORIGIN || "*";
  app.use(
    cors({ origin: corsOrigin === "*" ? true : corsOrigin, credentials: true }),
  );
  app.use(
    helmet({
      frameguard: false, // allow iframe embedding in Builder preview
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  // CSRF protection disabled for development
  // app.use(csrf({ cookie: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Admin routes
  app.use("/api/admin/auth", adminAuthRoutes);
  app.use("/api/admin/hospitals", hospitalRoutes);
  app.use("/api/admin/organizations", organizationRoutes);
  app.use("/api/admin/dashboard", dashboardRoutes);
  app.use("/api/admin/logs", logsRoutes);
  app.use("/api/admin/blockchain", adminBlockchainRoutes);

  // Organization routes
  app.use("/api/organization/auth", organizationAuthRoutes);
  app.use("/api/organization/policies", organizationPoliciesRoutes);

  // Hospital routes
  app.use("/api/hospital/auth", hospitalAuthRoutes);
  app.use("/api/hospital/patients", hospitalPatientsRoutes);
  app.use("/api/hospital/donors", hospitalDonorsRoutes);
  app.use("/api/hospital/dashboard", hospitalDashboardRoutes);
  app.use("/api/hospital/upload", fileUploadRoutes);
  app.use("/api/hospital/matching", hospitalMatchingRoutes);
  app.use("/api/hospital/reports", hospitalReportsRoutes);
  app.use("/api/hospital/notifications", hospitalNotificationsRoutes);
  app.use("/api/hospital/cleanup", hospitalCleanupRoutes);

  return app;
}

// Initialize database on server startup
async function startServer() {
  try {
    console.log('🚀 Starting OrganLink server...');

    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('❌ Cannot connect to database. Please check your DATABASE_URL environment variable.');
      process.exit(1);
    }

    // Initialize database schema
    await initializeDatabase();

    // Create default admin if needed
    await createDefaultAdminIfNotExists();

    console.log('✅ OrganLink server initialized successfully');
    console.log('📖 Ready to serve requests...');

  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

// Initialize when module is imported
startServer().catch(console.error);
