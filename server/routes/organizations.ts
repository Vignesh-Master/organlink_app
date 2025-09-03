import { Router, Response } from "express";
import bcrypt from "bcryptjs";
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

// Get all organizations with filters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { search, country, type, status, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT id, name, country, type, email, phone, address, website,
             status, last_activity, created_at
      FROM organizations 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (country && country !== "all") {
      paramCount++;
      query += ` AND country = $${paramCount}`;
      params.push(country);
    }

    if (type && type !== "all") {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (status && status !== "all") {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM organizations WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (country && country !== "all") {
      countParamCount++;
      countQuery += ` AND country = $${countParamCount}`;
      countParams.push(country);
    }

    if (type && type !== "all") {
      countParamCount++;
      countQuery += ` AND type = $${countParamCount}`;
      countParams.push(type);
    }

    if (status && status !== "all") {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      organizations: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get organizations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get organization by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM organizations WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const organization = result.rows[0];
    delete organization.password; // Don't send password

    res.json(organization);
  } catch (error) {
    console.error("Get organization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new organization
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, country, type, email, phone, address, website, password } =
      req.body;

    // Check if email already exists
    const existingOrg = await pool.query(
      "SELECT id FROM organizations WHERE email = $1",
      [email],
    );

    if (existingOrg.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO organizations (
        name, country, type, email, phone, address, website, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, country, type, email, phone, address, website,
                status, created_at
    `,
      [name, country, type, email, phone, address, website, hashedPassword],
    );

    res.status(201).json({
      message: "Organization created successfully",
      organization: result.rows[0],
    });
  } catch (error) {
    console.error("Create organization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update organization
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, country, type, email, phone, address, website, status } =
      req.body;

    const result = await pool.query(
      `
      UPDATE organizations SET
        name = $1, country = $2, type = $3, email = $4, phone = $5,
        address = $6, website = $7, status = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, name, country, type, email, phone, address, website,
                status, updated_at
    `,
      [name, country, type, email, phone, address, website, status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({
      message: "Organization updated successfully",
      organization: result.rows[0],
    });
  } catch (error) {
    console.error("Update organization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete organization
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM organizations WHERE id = $1 RETURNING name",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error("Delete organization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset organization password
router.post("/:id/reset-password", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      "UPDATE organizations SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING name",
      [hashedPassword, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
