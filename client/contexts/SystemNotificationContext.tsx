import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";

export interface SystemNotification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "approval_request";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
  category:
    | "general"
    | "policy"
    | "blockchain"
    | "export"
    | "security"
    | "system";
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  recipientType: "admin" | "hospital" | "organization";
  recipientId?: string;
}

export interface ExportRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterType: "hospital" | "organization";
  dataType: string;
  format: string;
  includesPersonalData: boolean;
  requestedAt: string;
  status: "pending" | "approved" | "rejected" | "completed";
  reason?: string;
  adminComments?: string;
  approvedBy?: string;
  approvedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export interface PasswordChangeRequest {
  id: string;
  userId: string;
  userType: "hospital" | "organization";
  userName: string;
  userEmail: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected" | "completed";
  reason: string;
  adminComments?: string;
  approvedBy?: string;
  approvedAt?: string;
  temporaryPassword?: string;
}

interface SystemNotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  exportRequests: ExportRequest[];
  passwordChangeRequests: PasswordChangeRequest[];

  // Notification methods
  addNotification: (
    notification: Omit<SystemNotification, "id" | "timestamp">,
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearExpiredNotifications: () => void;

  // Export request methods
  submitExportRequest: (
    request: Omit<ExportRequest, "id" | "requestedAt" | "status">,
  ) => Promise<string>;
  approveExportRequest: (
    requestId: string,
    adminComments?: string,
  ) => Promise<void>;
  rejectExportRequest: (requestId: string, reason: string) => Promise<void>;

  // Password change request methods
  submitPasswordChangeRequest: (
    request: Omit<PasswordChangeRequest, "id" | "requestedAt" | "status">,
  ) => Promise<string>;
  approvePasswordChangeRequest: (
    requestId: string,
    temporaryPassword: string,
    adminComments?: string,
  ) => Promise<void>;
  rejectPasswordChangeRequest: (
    requestId: string,
    reason: string,
  ) => Promise<void>;

  // Real-time methods
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
}

const SystemNotificationContext = createContext<
  SystemNotificationContextType | undefined
>(undefined);

interface SystemNotificationProviderProps {
  children: ReactNode;
  userType: "admin" | "hospital" | "organization";
  userId?: string;
}

export function SystemNotificationProvider({
  children,
  userType,
  userId,
}: SystemNotificationProviderProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [passwordChangeRequests, setPasswordChangeRequests] = useState<
    PasswordChangeRequest[]
  >([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load initial data
  useEffect(() => {
    loadNotifications();
    if (userType === "admin") {
      loadExportRequests();
      loadPasswordChangeRequests();
    }
    subscribeToNotifications();

    return () => unsubscribeFromNotifications();
  }, [userType, userId]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem(`${userType}_token`);
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Type": userType,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const loadExportRequests = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/export-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExportRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load export requests:", error);
    }
  };

  const loadPasswordChangeRequests = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/password-change-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPasswordChangeRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to load password change requests:", error);
    }
  };

  const addNotification = (
    notification: Omit<SystemNotification, "id" | "timestamp">,
  ) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Show toast for important notifications
    if (notification.urgent || notification.type === "error") {
      toast[notification.type === "error" ? "error" : "info"](
        notification.title,
        {
          description: notification.message,
        },
      );
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );

    // Update on server
    updateNotificationStatus(notificationId, { read: true });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Update on server
    updateAllNotificationsStatus({ read: true });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    // Delete on server
    deleteNotificationOnServer(notificationId);
  };

  const clearExpiredNotifications = () => {
    const now = new Date();
    setNotifications((prev) =>
      prev.filter((n) => !n.expiresAt || new Date(n.expiresAt) > now),
    );
  };

  const submitExportRequest = async (
    request: Omit<ExportRequest, "id" | "requestedAt" | "status">,
  ): Promise<string> => {
    try {
      const token = localStorage.getItem(`${userType}_token`);
      const response = await fetch("/api/export-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Type": userType,
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();

        // Add notification for user
        addNotification({
          type: "info",
          title: "Export Request Submitted",
          message: `Your ${request.dataType} export request has been submitted for admin approval.`,
          read: false,
          urgent: false,
          category: "export",
          relatedId: data.requestId,
          recipientType: userType,
          recipientId: userId,
        });

        return data.requestId;
      } else {
        throw new Error("Failed to submit export request");
      }
    } catch (error) {
      console.error("Export request submission error:", error);
      throw error;
    }
  };

  const approveExportRequest = async (
    requestId: string,
    adminComments?: string,
  ) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/export-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ adminComments }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setExportRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: "approved",
                  adminComments,
                  approvedAt: new Date().toISOString(),
                }
              : req,
          ),
        );

        // Notify requester
        const request = exportRequests.find((r) => r.id === requestId);
        if (request) {
          addNotification({
            type: "success",
            title: "Export Request Approved",
            message: `Your ${request.dataType} export request has been approved and is being processed.`,
            read: false,
            urgent: true,
            category: "export",
            relatedId: requestId,
            recipientType: request.requesterType,
            recipientId: request.requesterId,
            actionUrl: data.downloadUrl,
            actionLabel: "Download",
          });
        }
      }
    } catch (error) {
      console.error("Export approval error:", error);
      throw error;
    }
  };

  const rejectExportRequest = async (requestId: string, reason: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/export-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      if (response.ok) {
        // Update local state
        setExportRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? { ...req, status: "rejected", adminComments: reason }
              : req,
          ),
        );

        // Notify requester
        const request = exportRequests.find((r) => r.id === requestId);
        if (request) {
          addNotification({
            type: "warning",
            title: "Export Request Rejected",
            message: `Your ${request.dataType} export request was rejected. Reason: ${reason}`,
            read: false,
            urgent: true,
            category: "export",
            relatedId: requestId,
            recipientType: request.requesterType,
            recipientId: request.requesterId,
          });
        }
      }
    } catch (error) {
      console.error("Export rejection error:", error);
      throw error;
    }
  };

  const submitPasswordChangeRequest = async (
    request: Omit<PasswordChangeRequest, "id" | "requestedAt" | "status">,
  ): Promise<string> => {
    try {
      const token = localStorage.getItem(`${userType}_token`);
      const response = await fetch("/api/password-change-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-User-Type": userType,
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();

        // Add notification for user
        addNotification({
          type: "info",
          title: "Password Change Request Submitted",
          message:
            "Your password change request has been submitted for admin approval.",
          read: false,
          urgent: false,
          category: "security",
          relatedId: data.requestId,
          recipientType: userType,
          recipientId: userId,
        });

        return data.requestId;
      } else {
        throw new Error("Failed to submit password change request");
      }
    } catch (error) {
      console.error("Password change request submission error:", error);
      throw error;
    }
  };

  const approvePasswordChangeRequest = async (
    requestId: string,
    temporaryPassword: string,
    adminComments?: string,
  ) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/password-change-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ temporaryPassword, adminComments }),
        },
      );

      if (response.ok) {
        // Update local state
        setPasswordChangeRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: "approved",
                  temporaryPassword,
                  adminComments,
                  approvedAt: new Date().toISOString(),
                }
              : req,
          ),
        );

        // Notify requester
        const request = passwordChangeRequests.find((r) => r.id === requestId);
        if (request) {
          addNotification({
            type: "success",
            title: "Password Change Approved",
            message: `Your password has been reset. Check your email for the temporary password.`,
            read: false,
            urgent: true,
            category: "security",
            relatedId: requestId,
            recipientType: request.userType,
            recipientId: request.userId,
          });
        }
      }
    } catch (error) {
      console.error("Password approval error:", error);
      throw error;
    }
  };

  const rejectPasswordChangeRequest = async (
    requestId: string,
    reason: string,
  ) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/password-change-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      if (response.ok) {
        // Update local state
        setPasswordChangeRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? { ...req, status: "rejected", adminComments: reason }
              : req,
          ),
        );

        // Notify requester
        const request = passwordChangeRequests.find((r) => r.id === requestId);
        if (request) {
          addNotification({
            type: "warning",
            title: "Password Change Request Rejected",
            message: `Your password change request was rejected. Reason: ${reason}`,
            read: false,
            urgent: true,
            category: "security",
            relatedId: requestId,
            recipientType: request.userType,
            recipientId: request.userId,
          });
        }
      }
    } catch (error) {
      console.error("Password rejection error:", error);
      throw error;
    }
  };

  const subscribeToNotifications = () => {
    // In a real implementation, this would use WebSocket or Server-Sent Events
    // For now, we'll use polling
    const interval = setInterval(() => {
      loadNotifications();
      if (userType === "admin") {
        loadExportRequests();
        loadPasswordChangeRequests();
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  };

  const unsubscribeFromNotifications = () => {
    // Cleanup WebSocket connections in real implementation
  };

  // Helper functions for server communication
  const updateNotificationStatus = async (
    notificationId: string,
    updates: Partial<SystemNotification>,
  ) => {
    try {
      const token = localStorage.getItem(`${userType}_token`);
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update notification:", error);
    }
  };

  const updateAllNotificationsStatus = async (
    updates: Partial<SystemNotification>,
  ) => {
    try {
      const token = localStorage.getItem(`${userType}_token`);
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update all notifications:", error);
    }
  };

  const deleteNotificationOnServer = async (notificationId: string) => {
    try {
      const token = localStorage.getItem(`${userType}_token`);
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const value: SystemNotificationContextType = {
    notifications,
    unreadCount,
    exportRequests,
    passwordChangeRequests,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearExpiredNotifications,
    submitExportRequest,
    approveExportRequest,
    rejectExportRequest,
    submitPasswordChangeRequest,
    approvePasswordChangeRequest,
    rejectPasswordChangeRequest,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };

  return (
    <SystemNotificationContext.Provider value={value}>
      {children}
    </SystemNotificationContext.Provider>
  );
}

export function useSystemNotifications() {
  const context = useContext(SystemNotificationContext);
  if (context === undefined) {
    throw new Error(
      "useSystemNotifications must be used within a SystemNotificationProvider",
    );
  }
  return context;
}
