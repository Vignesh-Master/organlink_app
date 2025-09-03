import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

const router = express.Router();

import rateLimit from "express-rate-limit";

const orgLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", orgLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Username and password are required" });
    }

    // We treat username as email for organizations
    const result = await pool.query(
      "SELECT * FROM organizations WHERE email = $1 AND status != 'inactive'",
      [username],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const org = result.rows[0];
    const valid = await bcrypt.compare(password, org.password);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        organization_id: org.id,
        email: org.email,
        name: org.name,
        type: "organization",
      },
      process.env.JWT_SECRET || "organlink_secret_key_2024",
      { expiresIn: "24h" },
    );

    res.cookie("organization_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const { password: _, ...orgData } = org;
    res.json({ success: true, token, organization: orgData });
  } catch (err) {
    console.error("Organization login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token)
      return res
        .status(401)
        .json({ success: false, error: "No token provided" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "organlink_secret_key_2024",
    ) as any;
    const result = await pool.query(
      "SELECT * FROM organizations WHERE id = $1",
      [decoded.organization_id],
    );
    if (result.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Organization not found" });

    const { password: _, ...orgData } = result.rows[0];
    res.json({ success: true, organization: orgData });
  } catch (err) {
    console.error("Organization verify error:", err);
    res.status(401).json({ success: false, error: "Invalid token" });
  }
});

// Logout: clear cookie
router.post("/logout", async (_req, res) => {
  res.clearCookie("organization_token");
  res.json({ success: true });
});

export default router;
