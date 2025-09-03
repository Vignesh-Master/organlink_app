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

// Get all hospitals with filters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { search, country, status, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT id, name, country, state, city, hospital_id, email, phone, address,
             specializations, capacity, status, last_activity, created_at
      FROM hospitals
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR hospital_id ILIKE $${paramCount} OR city ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (country && country !== "all") {
      paramCount++;
      query += ` AND country = $${paramCount}`;
      params.push(country);
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
    let countQuery = "SELECT COUNT(*) FROM hospitals WHERE 1=1";
    const countParams: any[] = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR hospital_id ILIKE $${countParamCount} OR city ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (country && country !== "all") {
      countParamCount++;
      countQuery += ` AND country = $${countParamCount}`;
      countParams.push(country);
    }

    if (status && status !== "all") {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      hospitals: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get hospitals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get hospital by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM hospitals WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    const hospital = result.rows[0];
    delete hospital.password; // Don't send password

    res.json(hospital);
  } catch (error) {
    console.error("Get hospital error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new hospital
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      country,
      state,
      city,
      hospital_id,
      email,
      phone,
      address,
      specializations,
      capacity,
      password,
    } = req.body;

    // Check if hospital_id already exists
    const existingHospital = await pool.query(
      "SELECT id FROM hospitals WHERE hospital_id = $1",
      [hospital_id],
    );

    if (existingHospital.rows.length > 0) {
      return res.status(400).json({ error: "Hospital ID already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO hospitals (
        name, country, state, city, hospital_id, email, phone, address,
        specializations, capacity, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, country, state, city, hospital_id, email, phone, address,
                specializations, capacity, status, created_at
    `,
      [
        name,
        country,
        state,
        city,
        hospital_id,
        email,
        phone,
        address,
        specializations,
        capacity,
        hashedPassword,
      ],
    );

    res.status(201).json({
      message: "Hospital created successfully",
      hospital: result.rows[0],
    });
  } catch (error) {
    console.error("Create hospital error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update hospital
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      country,
      state,
      city,
      email,
      phone,
      address,
      specializations,
      capacity,
      status,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE hospitals SET
        name = $1, country = $2, state = $3, city = $4, email = $5, phone = $6,
        address = $7, specializations = $8, capacity = $9, status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING id, name, country, state, city, hospital_id, email, phone, address,
                specializations, capacity, status, updated_at
    `,
      [
        name,
        country,
        state,
        city,
        email,
        phone,
        address,
        specializations,
        capacity,
        status,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json({
      message: "Hospital updated successfully",
      hospital: result.rows[0],
    });
  } catch (error) {
    console.error("Update hospital error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete hospital
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM hospitals WHERE id = $1 RETURNING hospital_id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json({
      message: "Hospital deleted successfully",
    });
  } catch (error) {
    console.error("Delete hospital error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset hospital password
router.post("/:id/reset-password", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      "UPDATE hospitals SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING hospital_id",
      [hashedPassword, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cleanup utility to remove hospitals with null/empty location fields
router.post(
  "/cleanup-null-locations",
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `DELETE FROM hospitals
       WHERE (country IS NULL OR trim(country) = '')
          OR (state IS NULL OR trim(state) = '')
          OR (city IS NULL OR trim(city) = '')`,
      );
      res.json({ message: "Cleanup completed", deleted: result.rowCount });
    } catch (error) {
      console.error("Cleanup hospitals error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
