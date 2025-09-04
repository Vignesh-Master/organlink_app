import express from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { generateId, generateSalt, hashWithSalt } from "../utils/crypto.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Validation schemas
const CreatePasswordChangeRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(["hospital", "organization"]),
  userName: z.string(),
  userEmail: z.string().email(),
  reason: z.string().min(1).max(500),
});

const ApproveRequestSchema = z.object({
  temporaryPassword: z.string().min(8),
  adminComments: z.string().optional(),
});

const RejectRequestSchema = z.object({
  reason: z.string().min(1),
});

// Submit password change request
router.post("/", async (req, res) => {
  try {
    const userType = req.headers["x-user-type"] as string;
    const validatedData = CreatePasswordChangeRequestSchema.parse(req.body);
    
    const requestId = generateId(validatedData.userId, "password_change", Date.now().toString());
    
    await pool.query(
      `INSERT INTO password_change_requests (
        id, user_id, user_type, user_name, user_email, reason, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
      [
        requestId,
        validatedData.userId,
        validatedData.userType,
        validatedData.userName,
        validatedData.userEmail,
        validatedData.reason,
      ]
    );

    // Create notification for admin
    await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, recipient_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        "approval_request",
        "Password Change Request",
        `${validatedData.userName} (${validatedData.userType}) has requested a password change. Reason: ${validatedData.reason}`,
        true,
        "security",
        requestId,
        "admin",
      ]
    );

    res.json({
      success: true,
      requestId,
      message: "Password change request submitted successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
    }

    console.error("Submit password change request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit password change request",
    });
  }
});

// Get user's password change requests
router.get("/my-requests", async (req, res) => {
  try {
    const userType = req.headers["x-user-type"] as string;
    const userId = req.user?.id;
    
    const result = await pool.query(
      `SELECT id, reason, status, created_at, approved_at, admin_comments 
       FROM password_change_requests 
       WHERE user_id = $1 AND user_type = $2 
       ORDER BY created_at DESC`,
      [userId, userType]
    );

    const requests = result.rows.map(row => ({
      id: row.id,
      reason: row.reason,
      status: row.status,
      requestedAt: row.created_at,
      approvedAt: row.approved_at,
      adminComments: row.admin_comments,
    }));

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get user password requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch password change requests",
    });
  }
});

// Admin routes
const adminRouter = express.Router();

// Get all password change requests (admin only)
adminRouter.get("/password-change-requests", async (req, res) => {
  try {
    const { status, userType } = req.query;
    
    let query = "SELECT * FROM password_change_requests WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (userType) {
      query += ` AND user_type = $${paramIndex++}`;
      params.push(userType);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);

    const requests = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userType: row.user_type,
      userName: row.user_name,
      userEmail: row.user_email,
      reason: row.reason,
      status: row.status,
      requestedAt: row.created_at,
      adminComments: row.admin_comments,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
    }));

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get admin password requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch password change requests",
    });
  }
});

// Approve password change request (admin only)
adminRouter.post("/password-change-requests/:requestId/approve", async (req, res) => {
  try {
    const { requestId } = req.params;
    const validatedData = ApproveRequestSchema.parse(req.body);
    const adminId = req.user?.id;

    // Get request details
    const requestResult = await pool.query(
      "SELECT * FROM password_change_requests WHERE id = $1",
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Password change request not found",
      });
    }

    const request = requestResult.rows[0];

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(validatedData.temporaryPassword, 12);

    // Update the user's password in the appropriate table
    const userTable = request.user_type === "hospital" ? "hospitals" : "organizations";
    await pool.query(
      `UPDATE ${userTable} SET password = $1, password_changed_at = NOW() WHERE id = $2`,
      [hashedPassword, request.user_id]
    );

    // Update request status
    await pool.query(
      `UPDATE password_change_requests 
       SET status = 'approved', admin_comments = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3`,
      [validatedData.adminComments, adminId, requestId]
    );

    // Create notification for requester
    await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, recipient_type, recipient_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        "success",
        "Password Change Approved",
        `Your password has been reset. A temporary password has been sent to your email (${request.user_email}). Please change it after your next login.`,
        true,
        "security",
        requestId,
        request.user_type,
        request.user_id,
      ]
    );

    // In a real implementation, you would send an email with the temporary password
    // For now, we'll just log it (DO NOT DO THIS IN PRODUCTION)
    console.log(`Temporary password for ${request.user_email}: ${validatedData.temporaryPassword}`);

    res.json({
      success: true,
      message: "Password change approved and temporary password sent",
      temporaryPasswordSent: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid approval data",
        details: error.errors,
      });
    }

    console.error("Approve password change request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve password change request",
    });
  }
});

// Reject password change request (admin only)
adminRouter.post("/password-change-requests/:requestId/reject", async (req, res) => {
  try {
    const { requestId } = req.params;
    const validatedData = RejectRequestSchema.parse(req.body);
    const adminId = req.user?.id;

    // Get request details
    const requestResult = await pool.query(
      "SELECT * FROM password_change_requests WHERE id = $1",
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Password change request not found",
      });
    }

    const request = requestResult.rows[0];

    // Update request status
    await pool.query(
      `UPDATE password_change_requests 
       SET status = 'rejected', admin_comments = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3`,
      [validatedData.reason, adminId, requestId]
    );

    // Create notification for requester
    await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, recipient_type, recipient_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        "warning",
        "Password Change Request Rejected",
        `Your password change request was rejected. Reason: ${validatedData.reason}`,
        true,
        "security",
        requestId,
        request.user_type,
        request.user_id,
      ]
    );

    res.json({
      success: true,
      message: "Password change request rejected",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid rejection data",
        details: error.errors,
      });
    }

    console.error("Reject password change request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject password change request",
    });
  }
});

// Generate temporary password endpoint (admin helper)
adminRouter.post("/generate-temp-password", async (req, res) => {
  try {
    // Generate a secure temporary password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let tempPassword = "";
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    res.json({
      success: true,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error("Generate temp password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate temporary password",
    });
  }
});

export { router as passwordChangeRequestsRouter, adminRouter as adminPasswordChangeRequestsRouter };
