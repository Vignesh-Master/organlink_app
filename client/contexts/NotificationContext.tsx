import React, { createContext, useContext, useState, ReactNode } from "react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "security" | "warning" | "success" | "info";
  time: string;
  read: boolean;
  fullMessage?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Password Reset Request",
      message: "Metro Medical Center has requested a password reset",
      fullMessage:
        "Metro Medical Center (ID: MMC001) located in Delhi, India has submitted a password reset request. The request was initiated by Dr. Rajesh Kumar at 14:30 IST. Please verify the identity and process the request accordingly.",
      type: "security",
      time: "5 mins ago",
      read: false,
    },
    {
      id: 2,
      title: "System Performance Alert",
      message: "Database query response time increased by 23%",
      fullMessage:
        "System monitoring has detected that database query response times have increased by 23% over the last hour. Current average response time is 145ms, up from 118ms. Consider checking for slow queries or high load conditions.",
      type: "warning",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "Backup Completed",
      message: "Daily system backup completed successfully",
      fullMessage:
        "The scheduled daily backup process has completed successfully at 02:00 UTC. Total backup size: 2.3 GB. All critical data including hospital records, organization data, and transaction logs have been secured.",
      type: "success",
      time: "2 hours ago",
      read: true,
    },
    {
      id: 4,
      title: "New Hospital Registration",
      message: "Apollo Hospital has been registered and is pending approval",
      fullMessage:
        "Apollo Hospital from Chennai, Tamil Nadu, India has completed their registration process. Hospital ID: APOLLO001. All required documentation has been submitted and the application is now pending admin approval.",
      type: "info",
      time: "3 hours ago",
      read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
