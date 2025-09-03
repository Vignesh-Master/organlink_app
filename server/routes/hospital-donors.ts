import express from "express";
import { pool } from "../config/database.js";
import { authenticateHospital } from "../middleware/auth.js";

const router = express.Router();

// Get all donors for a hospital
router.get("/", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    const result = await pool.query(
      `SELECT * FROM donors 
       WHERE hospital_id = $1 
       ORDER BY created_at DESC`,
      [hospital_id],
    );

    res.json({
      success: true,
      donors: result.rows,
    });
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donors",
    });
  }
});

// Get single donor
router.get("/:donor_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM donors WHERE donor_id = $1 AND hospital_id = $2",
      [donor_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch donor",
    });
  }
});

// Register new donor
router.post("/register", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const {
      full_name,
      age,
      gender,
      blood_type,
      organs_to_donate,
      medical_history,
      contact_phone,
      contact_email,
      emergency_contact,
      emergency_phone,
    } = req.body;

    // Generate unique donor ID
    const donor_id = `DON_${hospital_id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const result = await pool.query(
      `INSERT INTO donors (
        donor_id, hospital_id, full_name, age, gender, blood_type, 
        organs_to_donate, medical_history, contact_phone, 
        contact_email, emergency_contact, emergency_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        donor_id,
        hospital_id,
        full_name,
        age,
        gender,
        blood_type,
        organs_to_donate,
        medical_history,
        contact_phone,
        contact_email,
        emergency_contact,
        emergency_phone,
      ],
    );

    res.json({
      success: true,
      message: "Donor registered successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error registering donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register donor",
    });
  }
});

// Update donor signature and blockchain info
router.post("/:donor_id/signature", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;
    const { signature_ipfs_hash, blockchain_tx_hash, signature_verified } =
      req.body;

    const result = await pool.query(
      `UPDATE donors
       SET signature_ipfs_hash = $1, blockchain_tx_hash = $2, signature_verified = $3, updated_at = CURRENT_TIMESTAMP
       WHERE donor_id = $4 AND hospital_id = $5
       RETURNING *`,
      [
        signature_ipfs_hash,
        blockchain_tx_hash || null,
        signature_verified || false,
        donor_id,
        hospital_id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor signature updated successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating donor signature:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor signature",
    });
  }
});

// Update donor status
router.patch("/:donor_id/status", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      `UPDATE donors 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE donor_id = $2 AND hospital_id = $3
       RETURNING *`,
      [is_active, donor_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor status updated successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating donor status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor status",
    });
  }
});

// Delete donor
router.delete("/:donor_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;

    const result = await pool.query(
      "DELETE FROM donors WHERE donor_id = $1 AND hospital_id = $2 RETURNING *",
      [donor_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found",
      });
    }

    res.json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete donor",
    });
  }
});

// Update donor
router.put("/:donor_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;
    const {
      full_name,
      age,
      gender,
      blood_type,
      organs_to_donate,
      medical_history,
      contact_phone,
      contact_email,
      emergency_contact,
      emergency_phone,
    } = req.body;

    // Verify donor belongs to this hospital
    const donorCheck = await pool.query(
      "SELECT donor_id FROM donors WHERE donor_id = $1 AND hospital_id = $2",
      [donor_id, hospital_id],
    );

    if (donorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found or doesn't belong to your hospital",
      });
    }

    const result = await pool.query(
      `UPDATE donors SET
        full_name = $1, age = $2, gender = $3, blood_type = $4,
        organs_to_donate = $5, medical_history = $6, contact_phone = $7,
        contact_email = $8, emergency_contact = $9, emergency_phone = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE donor_id = $11 AND hospital_id = $12
      RETURNING *`,
      [
        full_name,
        age,
        gender,
        blood_type,
        organs_to_donate,
        medical_history,
        contact_phone,
        contact_email,
        emergency_contact,
        emergency_phone,
        donor_id,
        hospital_id,
      ],
    );

    res.json({
      success: true,
      message: "Donor updated successfully",
      donor: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update donor",
    });
  }
});

// Delete donor
router.delete("/:donor_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { donor_id } = req.params;

    // Verify donor belongs to this hospital
    const donorCheck = await pool.query(
      "SELECT donor_id FROM donors WHERE donor_id = $1 AND hospital_id = $2",
      [donor_id, hospital_id],
    );

    if (donorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Donor not found or doesn't belong to your hospital",
      });
    }

    // Delete the donor
    await pool.query(
      "DELETE FROM donors WHERE donor_id = $1 AND hospital_id = $2",
      [donor_id, hospital_id],
    );

    res.json({
      success: true,
      message: "Donor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete donor",
    });
  }
});

export default router;
