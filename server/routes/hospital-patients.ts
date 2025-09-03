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

    // Validate required fields
    if (!full_name || !age || !gender || !blood_type || !organ_needed) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: full_name, age, gender, blood_type, and organ_needed are required",
      });
    }

    // Split full_name into first_name and last_name
    const nameParts = full_name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Calculate approximate date_of_birth from age
    const currentDate = new Date();
    const birthYear = currentDate.getFullYear() - parseInt(age.toString());
    const date_of_birth = `${birthYear}-01-01`; // Use January 1st as default

    // Generate unique patient ID
    const patient_id = `PAT_${hospital_id}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const result = await pool.query(
      `INSERT INTO patients (
        patient_id, hospital_id, first_name, last_name, date_of_birth, gender, blood_type,
        organ_needed, urgency_level, medical_condition, phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        patient_id,
        hospital_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        blood_type,
        organ_needed,
        urgency_level,
        medical_condition,
        contact_phone,
        contact_email,
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
      error: `Failed to register patient: ${error.message}`,
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
      const { signature_ipfs_hash, verification_tx_hash, ocr_verified, blockchain_verified } =
        req.body;

      const result = await pool.query(
        `UPDATE patients
       SET signature_ipfs_hash = $1, verification_tx_hash = $2, ocr_verified = $3, blockchain_verified = $4, updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $5 AND hospital_id = $6
       RETURNING *`,
        [
          signature_ipfs_hash,
          verification_tx_hash || null,
          ocr_verified || false,
          blockchain_verified || false,
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
    const { status } = req.body;

    // Validate status value
    const validStatuses = ['active', 'matched', 'completed', 'inactive'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await pool.query(
      `UPDATE patients
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE patient_id = $2 AND hospital_id = $3
       RETURNING *`,
      [status || 'active', patient_id, hospital_id],
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

    // Split full_name into first_name and last_name
    const nameParts = full_name ? full_name.trim().split(' ') : ['', ''];
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    // Calculate approximate date_of_birth from age if provided
    let date_of_birth = null;
    if (age) {
      const currentDate = new Date();
      const birthYear = currentDate.getFullYear() - parseInt(age.toString());
      date_of_birth = `${birthYear}-01-01`;
    }

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
        first_name = $1, last_name = $2, date_of_birth = COALESCE($3, date_of_birth), gender = $4, blood_type = $5,
        organ_needed = $6, urgency_level = $7, medical_condition = $8,
        phone = $9, email = $10, updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = $11 AND hospital_id = $12
      RETURNING *`,
      [
        first_name,
        last_name,
        date_of_birth,
        gender,
        blood_type,
        organ_needed,
        urgency_level,
        medical_condition,
        contact_phone,
        contact_email,
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
