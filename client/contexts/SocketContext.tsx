import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "approval_request";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
  category?: string;
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
  expiresAt?: string;
  recipientType: "admin" | "hospital" | "organization";
  recipientId?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  connect: (userData: {
    userId: string;
    userType: "admin" | "hospital" | "organization";
    hospitalId?: string;
    organizationId?: string;
  }) => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const connect = (userData: {
    userId: string;
    userType: "admin" | "hospital" | "organization";
    hospitalId?: string;
    organizationId?: string;
  }) => {
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("🔌 Connected to Socket.IO server");
      setIsConnected(true);

      // Register user with server
      newSocket.emit("register", userData);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from Socket.IO server");
      setIsConnected(false);
    });

    // Listen for real-time notifications
    newSocket.on("notification", (notification: Notification) => {
      console.log("📬 New notification received:", notification);

      setNotifications(prev => {
        // Check if notification already exists
        const existingIndex = prev.findIndex(n => n.id === notification.id);
        if (existingIndex >= 0) {
          // Update existing notification
          const updated = [...prev];
          updated[existingIndex] = notification;
          return updated;
        } else {
          // Add new notification
          return [notification, ...prev];
        }
      });
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    if (socket) {
      socket.emit("mark-notification-read", notificationId);
    }

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    if (socket) {
      socket.emit("mark-all-read");
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    if (socket) {
      socket.emit("delete-notification", notificationId);
    }

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
