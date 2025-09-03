import { Router, Response } from "express";
import { pool } from "../config/database";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard statistics
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    // Get hospital count
    const hospitalCount = await pool.query("SELECT COUNT(*) FROM hospitals");

    // Get organization count
    const orgCount = await pool.query("SELECT COUNT(*) FROM organizations");

    // Get active policies count
    const activePolicies = await pool.query(
      "SELECT COUNT(*) FROM policies WHERE status = 'active'",
    );

    // Get successful transplants count (mock data for now)
    const transplants = 1247;

    // Get system health metrics
    const systemStats = {
      uptime: "99.9%",
      responseTime: "145ms",
      activeSessions: "2,647",
      databaseSize: "1.27 TB",
    };

    // Get recent activities
    const recentActivities = [
      {
        id: 1,
        type: "hospital_registered",
        title: "New Hospital Registered",
        description: "Central Medical Center has been added to the network",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: "active",
      },
      {
        id: 2,
        type: "policy_created",
        title: "Policy Proposal Created",
        description: "Updated Age Limits policy created by Hope Foundation",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        status: "info",
      },
      {
        id: 3,
        type: "system_alert",
        title: "System Alert",
        description: "High database load detected - monitoring required",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        status: "warning",
      },
      {
        id: 4,
        type: "emergency_transplant",
        title: "Emergency Transplant",
        description: "Heart transplant completed successfully at Metro Medical",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        status: "success",
      },
    ];

    res.json({
      stats: {
        totalHospitals: parseInt(hospitalCount.rows[0].count),
        totalOrganizations: parseInt(orgCount.rows[0].count),
        activePolicies: parseInt(activePolicies.rows[0].count),
        successfulTransplants: transplants,
      },
      systemHealth: systemStats,
      recentActivities,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get system alerts
router.get("/alerts", async (req: AuthRequest, res: Response) => {
  try {
    const alerts = [
      {
        id: 1,
        type: "Database Load High",
        message: "Consider optimizing queries",
        severity: "warning",
        timestamp: new Date(),
      },
      {
        id: 2,
        type: "Backup Completed",
        message: "Daily backup successful",
        severity: "success",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 3,
        type: "Security Scan Clean",
        message: "No threats detected",
        severity: "success",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ];

    res.json({ alerts });
  } catch (error) {
    console.error("Get alerts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get quick actions data
router.get("/quick-actions", async (req: AuthRequest, res: Response) => {
  try {
    const actions = [
      {
        id: "add_hospital",
        title: "Add Hospital",
        description: "Register new hospital",
        icon: "plus",
        color: "blue",
      },
      {
        id: "add_organization",
        title: "Add Organization",
        description: "Add new organization",
        icon: "plus",
        color: "green",
      },
      {
        id: "view_ipfs",
        title: "View IPFS Logs",
        description: "Check file storage",
        icon: "file",
        color: "purple",
      },
      {
        id: "system_settings",
        title: "System Settings",
        description: "Configure system",
        icon: "settings",
        color: "gray",
      },
    ];

    res.json({ actions });
  } catch (error) {
    console.error("Get quick actions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
