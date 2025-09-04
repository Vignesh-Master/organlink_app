import express from "express";
import { z } from "zod";
import pool from "../config/database.js";
import { generateId } from "../utils/crypto.js";

const router = express.Router();

// Validation schemas
const CreateExportRequestSchema = z.object({
  requesterId: z.string(),
  requesterName: z.string(),
  requesterType: z.enum(["hospital", "organization"]),
  dataType: z.string(),
  format: z.enum(["pdf", "excel", "csv", "json"]),
  includesPersonalData: z.boolean(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  filters: z.record(z.any()).optional(),
});

const ApproveRequestSchema = z.object({
  adminComments: z.string().optional(),
});

const RejectRequestSchema = z.object({
  reason: z.string().min(1),
});

// Submit export request
router.post("/", async (req, res) => {
  try {
    const userType = req.headers["x-user-type"] as string;
    const validatedData = CreateExportRequestSchema.parse(req.body);

    const requestId = generateId(
      validatedData.requesterId,
      validatedData.dataType,
      Date.now().toString(),
    );

    await pool.query(
      `INSERT INTO export_requests (
        id, requester_id, requester_name, requester_type, data_type, format,
        includes_personal_data, date_from, date_to, filters, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())`,
      [
        requestId,
        validatedData.requesterId,
        validatedData.requesterName,
        validatedData.requesterType,
        validatedData.dataType,
        validatedData.format,
        validatedData.includesPersonalData,
        validatedData.dateFrom,
        validatedData.dateTo,
        JSON.stringify(validatedData.filters),
      ],
    );

    // Create notification for admin
    await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, recipient_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        "approval_request",
        "New Export Request",
        `${validatedData.requesterName} has requested to export ${validatedData.dataType} data${validatedData.includesPersonalData ? " (includes personal data)" : ""}.`,
        validatedData.includesPersonalData,
        "export",
        requestId,
        "admin",
      ],
    );

    res.json({
      success: true,
      requestId,
      message: "Export request submitted successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
    }

    console.error("Submit export request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit export request",
    });
  }
});

// Get user's export requests
router.get("/my-requests", async (req, res) => {
  try {
    const userType = req.headers["x-user-type"] as string;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT * FROM export_requests 
       WHERE requester_id = $1 AND requester_type = $2 
       ORDER BY created_at DESC`,
      [userId, userType],
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      dataType: row.data_type,
      format: row.format,
      includesPersonalData: row.includes_personal_data,
      status: row.status,
      requestedAt: row.created_at,
      approvedAt: row.approved_at,
      adminComments: row.admin_comments,
      downloadUrl: row.download_url,
      expiresAt: row.expires_at,
    }));

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get user requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch export requests",
    });
  }
});

// Admin routes
const adminRouter = express.Router();

// Get all export requests (admin only)
adminRouter.get("/export-requests", async (req, res) => {
  try {
    const { status, requesterType } = req.query;

    let query = "SELECT * FROM export_requests WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (requesterType) {
      query += ` AND requester_type = $${paramIndex++}`;
      params.push(requesterType);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);

    const requests = result.rows.map((row) => ({
      id: row.id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      requesterType: row.requester_type,
      dataType: row.data_type,
      format: row.format,
      includesPersonalData: row.includes_personal_data,
      requestedAt: row.created_at,
      status: row.status,
      adminComments: row.admin_comments,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      downloadUrl: row.download_url,
      expiresAt: row.expires_at,
    }));

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get admin requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch export requests",
    });
  }
});

// Approve export request (admin only)
adminRouter.post("/export-requests/:requestId/approve", async (req, res) => {
  try {
    const { requestId } = req.params;
    const validatedData = ApproveRequestSchema.parse(req.body);
    const adminId = req.user?.id;

    // Get request details
    const requestResult = await pool.query(
      "SELECT * FROM export_requests WHERE id = $1",
      [requestId],
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Export request not found",
      });
    }

    const request = requestResult.rows[0];

    // Generate download URL (in real implementation, this would trigger the actual export)
    const downloadUrl = `/api/exports/download/${requestId}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update request status
    await pool.query(
      `UPDATE export_requests 
       SET status = 'approved', admin_comments = $1, approved_by = $2, 
           approved_at = NOW(), download_url = $3, expires_at = $4
       WHERE id = $5`,
      [validatedData.adminComments, adminId, downloadUrl, expiresAt, requestId],
    );

    // Create notification for requester
    await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, action_url, action_label,
        recipient_type, recipient_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        "success",
        "Export Request Approved",
        `Your ${request.data_type} export request has been approved and is ready for download.`,
        true,
        "export",
        requestId,
        downloadUrl,
        "Download",
        request.requester_type,
        request.requester_id,
      ],
    );

    res.json({
      success: true,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid approval data",
        details: error.errors,
      });
    }

    console.error("Approve export request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve export request",
    });
  }
});

// Reject export request (admin only)
adminRouter.post("/export-requests/:requestId/reject", async (req, res) => {
  try {
    const { requestId } = req.params;
    const validatedData = RejectRequestSchema.parse(req.body);
    const adminId = req.user?.id;

    // Get request details
    const requestResult = await pool.query(
      "SELECT * FROM export_requests WHERE id = $1",
      [requestId],
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Export request not found",
      });
    }

    const request = requestResult.rows[0];

    // Update request status
    await pool.query(
      `UPDATE export_requests 
       SET status = 'rejected', admin_comments = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3`,
      [validatedData.reason, adminId, requestId],
    );

    // Create notification for requester
    await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, recipient_type, recipient_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        "warning",
        "Export Request Rejected",
        `Your ${request.data_type} export request was rejected. Reason: ${validatedData.reason}`,
        true,
        "export",
        requestId,
        request.requester_type,
        request.requester_id,
      ],
    );

    res.json({
      success: true,
      message: "Export request rejected",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid rejection data",
        details: error.errors,
      });
    }

    console.error("Reject export request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reject export request",
    });
  }
});

export {
  router as exportRequestsRouter,
  adminRouter as adminExportRequestsRouter,
};
