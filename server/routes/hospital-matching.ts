import express from "express";
import { pool } from "../config/database.js";
import { authenticateHospital } from "../middleware/auth.js";
import { aiMatchingService } from "../services/aiMatching.js";
import { findEnhancedMatches, predictTransplantSuccess, generateMatchingInsights } from "../services/enhancedAiMatching";
import NotificationService from "../services/notificationService";

const router = express.Router();

// Find matches for a patient
router.post("/find-matches", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id, organ_type, blood_type, urgency_level } = req.body;

    if (!patient_id || !organ_type || !blood_type || !urgency_level) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: patient_id, organ_type, blood_type, urgency_level",
      });
    }

    // Verify patient belongs to this hospital
    const patientResult = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found or doesn't belong to your hospital",
      });
    }

    const matchingResult = await aiMatchingService.findMatches({
      patient_id,
      organ_type,
      blood_type,
      urgency_level,
      hospital_id: hospital_id!,
    });

    res.json({
      success: true,
      ...matchingResult,
    });
  } catch (error) {
    console.error("Find matches error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find matches",
    });
  }
});

// Create a matching request
router.post("/create-request", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id, organ_type, blood_type, urgency_level } = req.body;

    if (!patient_id || !organ_type || !blood_type || !urgency_level) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Verify patient belongs to this hospital
    const patientResult = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found or doesn't belong to your hospital",
      });
    }

    const requestId = await aiMatchingService.createMatchingRequest({
      patient_id,
      organ_type,
      blood_type,
      urgency_level,
      hospital_id: hospital_id!,
    });

    res.json({
      success: true,
      request_id: requestId,
      message: "Matching request created successfully",
    });
  } catch (error) {
    console.error("Create matching request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create matching request",
    });
  }
});

// Get all matching requests for the hospital
router.get("/requests", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    const requests = await aiMatchingService.getMatchingRequests(hospital_id!);

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get matching requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get matching requests",
    });
  }
});

// Get potential donors for incoming match requests (when other hospitals need organs)
router.get("/incoming-matches", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    // Get notifications about matching requests
    const result = await pool.query(
      `SELECT n.*, mr.patient_id, mr.organ_type, mr.blood_type, mr.urgency_level,
              mr.requesting_hospital_id, h.hospital_name as requesting_hospital_name
       FROM notifications n
       LEFT JOIN matching_requests mr ON n.related_id = mr.request_id
       LEFT JOIN hospital_credentials h ON mr.requesting_hospital_id = h.hospital_id
       WHERE n.hospital_id = $1 AND n.type = 'organ_match' AND n.is_read = false
       ORDER BY n.created_at DESC`,
      [hospital_id],
    );

    res.json({
      success: true,
      incoming_matches: result.rows,
    });
  } catch (error) {
    console.error("Get incoming matches error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get incoming matches",
    });
  }
});

// Respond to a matching request (accept/reject)
router.post("/respond", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { request_id, donor_id, response, notes } = req.body;

    if (!request_id || !response || !["accept", "reject"].includes(response)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid request. Required: request_id, response (accept/reject)",
      });
    }

    // If accepting, verify donor belongs to this hospital
    if (response === "accept" && donor_id) {
      const donorResult = await pool.query(
        "SELECT donor_id FROM donors WHERE donor_id = $1 AND hospital_id = $2",
        [donor_id, hospital_id],
      );

      if (donorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Donor not found or doesn't belong to your hospital",
        });
      }
    }

    // Update matching request
    await pool.query(
      `UPDATE matching_requests 
       SET status = $1, matched_donor_id = $2, matched_hospital_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE request_id = $4`,
      [
        response === "accept" ? "accepted" : "rejected",
        donor_id || null,
        hospital_id,
        request_id,
      ],
    );

    // Create notification for requesting hospital
    const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      `INSERT INTO notifications (notification_id, hospital_id, type, title, message, related_id)
       SELECT $1, requesting_hospital_id, 'match_response', 
              CASE WHEN $2 = 'accept' THEN 'Match Accepted!' ELSE 'Match Declined' END,
              CASE WHEN $2 = 'accept' 
                   THEN 'Your organ request has been accepted. Please coordinate with the donor hospital.'
                   ELSE 'Your organ request has been declined. Continue searching for other matches.'
              END,
              $3
       FROM matching_requests WHERE request_id = $3`,
      [notificationId, response, request_id],
    );

    // Mark the original notification as read
    await pool.query(
      "UPDATE notifications SET is_read = true WHERE related_id = $1 AND hospital_id = $2",
      [request_id, hospital_id],
    );

    res.json({
      success: true,
      message: `Match request ${response === "accept" ? "accepted" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Respond to match error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to respond to match request",
    });
  }
});

// Get match statistics
router.get("/stats", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    // Get outgoing requests stats
    const outgoingStats = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM matching_requests 
       WHERE requesting_hospital_id = $1 
       GROUP BY status`,
      [hospital_id],
    );

    // Get incoming requests stats
    const incomingStats = await pool.query(
      `SELECT COUNT(*) as total_incoming
       FROM notifications 
       WHERE hospital_id = $1 AND type = 'organ_match'`,
      [hospital_id],
    );

    res.json({
      success: true,
      stats: {
        outgoing: outgoingStats.rows,
        incoming: incomingStats.rows[0]?.total_incoming || 0,
      },
    });
  } catch (error) {
    console.error("Get match stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get match statistics",
    });
  }
});

// Enhanced AI matching endpoint
router.post("/enhanced-matches", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;
    const { patient_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        error: "Patient ID is required",
      });
    }

    // Verify patient belongs to this hospital
    const patientResult = await pool.query(
      "SELECT patient_id FROM patients WHERE patient_id = $1 AND hospital_id = $2",
      [patient_id, hospital_id],
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Patient not found or doesn't belong to your hospital",
      });
    }

    const enhancedMatches = await findEnhancedMatches(patient_id);

    res.json({
      success: true,
      matches: enhancedMatches,
      total_matches: enhancedMatches.length,
      algorithm: "enhanced_ai_v2",
    });
  } catch (error) {
    console.error("Enhanced AI matching error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find enhanced matches",
    });
  }
});

// Predict transplant success
router.post("/predict-success", authenticateHospital, async (req, res) => {
  try {
    const { patient_id, donor_id } = req.body;

    if (!patient_id || !donor_id) {
      return res.status(400).json({
        success: false,
        error: "Patient ID and Donor ID are required",
      });
    }

    const prediction = await predictTransplantSuccess(patient_id, donor_id);

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Transplant success prediction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to predict transplant success",
    });
  }
});

// Get matching insights for hospital
router.get("/insights", authenticateHospital, async (req, res) => {
  try {
    const hospital_id = req.hospital?.hospital_id;

    const insights = await generateMatchingInsights(hospital_id!);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("Matching insights error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate matching insights",
    });
  }
});

export default router;
