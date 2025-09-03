import express from "express";
import { pool } from "../config/database.js";
import { authenticateHospital } from "../middleware/auth.js";

const router = express.Router();

// Get all patients for a hospital
router.get("/", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    const result = await pool.query(
      `SELECT * FROM patients 
       WHERE hospital_id = $1 
       ORDER BY created_at DESC`,
      [hospital_id],
    );

    res.json({
      success: true,
      patients: result.rows,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patients",
    });
  }
});

// Get single patient
router.get("/:patient_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    res.json({
      success: true,
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient",
    });
  }
});

// Register new patient
router.post("/register", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const {
      full_name,
      age,
      gender,
      blood_type,
      organ_needed,
      urgency_level,
      medical_condition,
      contact_phone,
      contact_email,
      emergency_contact,
      emergency_phone,
    } = req.body;

    // Generate unique patient ID
    const patient_id = `PAT_${hospital_id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const result = await pool.query(
      `INSERT INTO patients (
        patient_id, hospital_id, full_name, age, gender, blood_type, 
        organ_needed, urgency_level, medical_condition, contact_phone, 
        contact_email, emergency_contact, emergency_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        patient_id,
        hospital_id,
        full_name,
        age,
        gender,
        blood_type,
        organ_needed,
        urgency_level,
        medical_condition,
        contact_phone,
        contact_email,
        emergency_contact,
        emergency_phone,
      ],
    );

    res.json({
      success: true,
      message: "Patient registered successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Error registering patient:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register patient",
    });
  }
});

// Update patient signature and blockchain info
router.post(
  "/:patient_id/signature",
  authenticateHospital,
  async (req, res) => {
    try {
      const hospital_id = req.hospital?.hospital_id;
      const { patient_id } = req.params;
      const { signature_ipfs_hash, blockchain_tx_hash, signature_verified } =
        req.body;

      const result = await pool.query(
        `UPDATE patients
       SET signature_ipfs_hash = $1, blockchain_tx_hash = $2, signature_verified = $3, updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $4 AND hospital_id = $5
       RETURNING *`,
        [
          signature_ipfs_hash,
          blockchain_tx_hash || null,
          signature_verified || false,
          patient_id,
          hospital_id,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Patient not found",
        });
      }

      res.json({
        success: true,
        message: "Patient signature updated successfully",
        patient: result.rows[0],
      });
    } catch (error) {
      console.error("Error updating patient signature:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update patient signature",
      });
    }
  },
);

// Update patient status
router.patch("/:patient_id/status", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id } = req.params;
    const { is_active } = req.body;

    const result = await pool.query(
      `UPDATE patients 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $2 AND hospital_id = $3
       RETURNING *`,
      [is_active, patient_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient status updated successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating patient status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update patient status",
    });
  }
});

// Delete patient
router.delete("/:patient_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id } = req.params;

    const result = await pool.query(
      "DELETE FROM patients WHERE patient_id = $1 AND hospital_id = $2 RETURNING *",
      [patient_id, hospital_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete patient",
    });
  }
});

// Update patient
router.put("/:patient_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id } = req.params;
    const {
      full_name,
      age,
      gender,
      blood_type,
      organ_needed,
      urgency_level,
      medical_condition,
      contact_phone,
      contact_email,
      emergency_contact,
      emergency_phone,
    } = req.body;

    // Verify patient belongs to this hospital
    const patientCheck = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found or doesn't belong to your hospital",
      });
    }

    const result = await pool.query(
      `UPDATE patients SET
        full_name = $1, age = $2, gender = $3, blood_type = $4,
        organ_needed = $5, urgency_level = $6, medical_condition = $7,
        contact_phone = $8, contact_email = $9, emergency_contact = $10,
        emergency_phone = $11, updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = $12 AND hospital_id = $13
      RETURNING *`,
      [
        full_name,
        age,
        gender,
        blood_type,
        organ_needed,
        urgency_level,
        medical_condition,
        contact_phone,
        contact_email,
        emergency_contact,
        emergency_phone,
        patient_id,
        hospital_id,
      ],
    );

    res.json({
      success: true,
      message: "Patient updated successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update patient",
    });
  }
});

// Delete patient
router.delete("/:patient_id", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id } = req.params;

    // Verify patient belongs to this hospital
    const patientCheck = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found or doesn't belong to your hospital",
      });
    }

    // Delete the patient
    await pool.query(
      "DELETE FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete patient",
    });
  }
});

export default router;
