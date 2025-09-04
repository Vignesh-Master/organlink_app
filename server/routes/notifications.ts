import express from "express";
import { z } from "zod";
import pool from "../config/database.js";

const router = express.Router();

// Validation schemas
const CreateNotificationSchema = z.object({
  type: z.enum(["info", "success", "warning", "error", "approval_request"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  urgent: z.boolean().default(false),
  category: z.enum(["general", "policy", "blockchain", "export", "security", "system"]),
  relatedId: z.string().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().optional(),
  recipientType: z.enum(["admin", "hospital", "organization"]),
  recipientId: z.string().optional(),
});

const UpdateNotificationSchema = z.object({
  read: z.boolean().optional(),
  urgent: z.boolean().optional(),
});

// Get notifications for user
router.get("/", async (req, res) => {
  try {
    const userType = req.headers["x-user-type"] as string;
    const userId = req.user?.id; // From auth middleware
    
    let query = `
      SELECT * FROM notifications 
      WHERE recipient_type = $1 
      AND (recipient_id IS NULL OR recipient_id = $2)
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query, [userType, userId]);
    
    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      timestamp: row.created_at,
      read: row.read,
      urgent: row.urgent,
      category: row.category,
      relatedId: row.related_id,
      actionUrl: row.action_url,
      actionLabel: row.action_label,
      metadata: row.metadata,
      expiresAt: row.expires_at,
      recipientType: row.recipient_type,
      recipientId: row.recipient_id,
    }));

    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
});

// Create notification
router.post("/", async (req, res) => {
  try {
    const validatedData = CreateNotificationSchema.parse(req.body);
    
    const result = await pool.query(
      `INSERT INTO notifications (
        type, title, message, urgent, category, related_id, action_url, action_label,
        metadata, expires_at, recipient_type, recipient_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id`,
      [
        validatedData.type,
        validatedData.title,
        validatedData.message,
        validatedData.urgent,
        validatedData.category,
        validatedData.relatedId,
        validatedData.actionUrl,
        validatedData.actionLabel,
        JSON.stringify(validatedData.metadata),
        validatedData.expiresAt,
        validatedData.recipientType,
        validatedData.recipientId,
      ]
    );

    res.json({
      success: true,
      notificationId: result.rows[0].id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification data",
        details: error.errors,
      });
    }

    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create notification",
    });
  }
});

// Update notification
router.patch("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const validatedData = UpdateNotificationSchema.parse(req.body);
    
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (validatedData.read !== undefined) {
      updateFields.push(`read = $${paramIndex++}`);
      values.push(validatedData.read);
    }
    
    if (validatedData.urgent !== undefined) {
      updateFields.push(`urgent = $${paramIndex++}`);
      values.push(validatedData.urgent);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(notificationId);

    const query = `
      UPDATE notifications 
      SET ${updateFields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification: result.rows[0],
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid update data",
        details: error.errors,
      });
    }

    console.error("Update notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update notification",
    });
  }
});

// Mark all notifications as read
router.post("/mark-all-read", async (req, res) => {
  try {
    const userType = req.headers["x-user-type"] as string;
    const userId = req.user?.id;

    await pool.query(
      `UPDATE notifications 
       SET read = true, updated_at = NOW()
       WHERE recipient_type = $1 
       AND (recipient_id IS NULL OR recipient_id = $2)
       AND read = false`,
      [userType, userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notifications as read",
    });
  }
});

// Delete notification
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const result = await pool.query(
      "DELETE FROM notifications WHERE id = $1 RETURNING id",
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
});

// Clean up expired notifications
router.post("/cleanup", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM notifications WHERE expires_at < NOW() RETURNING COUNT(*)"
    );

    res.json({
      success: true,
      deletedCount: result.rows[0].count,
    });
  } catch (error) {
    console.error("Cleanup notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup notifications",
    });
  }
});

export default router;
