import { Server as SocketIOServer, Socket } from "socket.io";
import { NotificationService } from "./notificationService.js";

interface ConnectedUser {
  socketId: string;
  userId: string;
  userType: "admin" | "hospital" | "organization";
  hospitalId?: string;
  organizationId?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // User authentication and registration
      socket.on("register", (data: {
        userId: string;
        userType: "admin" | "hospital" | "organization";
        hospitalId?: string;
        organizationId?: string;
      }) => {
        this.registerUser(socket.id, data);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.unregisterUser(socket.id);
        console.log(`🔌 User disconnected: ${socket.id}`);
      });

      // Handle notification read status
      socket.on("mark-notification-read", (notificationId: string) => {
        this.handleNotificationRead(socket.id, notificationId);
      });

      // Handle notification deletion
      socket.on("delete-notification", (notificationId: string) => {
        this.handleNotificationDelete(socket.id, notificationId);
      });
    });
  }

  private registerUser(socketId: string, data: {
    userId: string;
    userType: "admin" | "hospital" | "organization";
    hospitalId?: string;
    organizationId?: string;
  }) {
    const connectedUser: ConnectedUser = {
      socketId,
      userId: data.userId,
      userType: data.userType,
      hospitalId: data.hospitalId,
      organizationId: data.organizationId,
    };

    this.connectedUsers.set(socketId, connectedUser);
    console.log(`👤 User registered: ${data.userType} - ${data.userId}`);
  }

  private unregisterUser(socketId: string) {
    this.connectedUsers.delete(socketId);
  }

  private handleNotificationRead(socketId: string, notificationId: string) {
    // Update notification read status in database
    // This would typically call a service method
    console.log(`📖 Notification marked as read: ${notificationId}`);
  }

  private handleNotificationDelete(socketId: string, notificationId: string) {
    // Delete notification from database
    // This would typically call a service method
    console.log(`🗑️ Notification deleted: ${notificationId}`);
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, userType: "admin" | "hospital" | "organization", notification: any) {
    const userSockets = Array.from(this.connectedUsers.values())
      .filter(user => user.userId === userId && user.userType === userType)
      .map(user => user.socketId);

    userSockets.forEach(socketId => {
      this.io.to(socketId).emit("notification", notification);
    });
  }

  // Send notification to all users of a specific type
  public sendNotificationToUserType(userType: "admin" | "hospital" | "organization", notification: any) {
    const userSockets = Array.from(this.connectedUsers.values())
      .filter(user => user.userType === userType)
      .map(user => user.socketId);

    userSockets.forEach(socketId => {
      this.io.to(socketId).emit("notification", notification);
    });
  }

  // Send notification to all hospitals
  public sendNotificationToAllHospitals(notification: any) {
    this.sendNotificationToUserType("hospital", notification);
  }

  // Send notification to all organizations
  public sendNotificationToAllOrganizations(notification: any) {
    this.sendNotificationToUserType("organization", notification);
  }

  // Send notification to specific hospital
  public sendNotificationToHospital(hospitalId: string, notification: any) {
    const userSockets = Array.from(this.connectedUsers.values())
      .filter(user => user.userType === "hospital" && user.hospitalId === hospitalId)
      .map(user => user.socketId);

    userSockets.forEach(socketId => {
      this.io.to(socketId).emit("notification", notification);
    });
  }

  // Send notification to specific organization
  public sendNotificationToOrganization(organizationId: string, notification: any) {
    const userSockets = Array.from(this.connectedUsers.values())
      .filter(user => user.userType === "organization" && user.organizationId === organizationId)
      .map(user => user.socketId);

    userSockets.forEach(socketId => {
      this.io.to(socketId).emit("notification", notification);
    });
  }

  // Send notification to all organizations except the proposer
  public sendNotificationToOrganizationsExcept(proposerOrgId: string, notification: any) {
    const userSockets = Array.from(this.connectedUsers.values())
      .filter(user => user.userType === "organization" && user.organizationId !== proposerOrgId)
      .map(user => user.socketId);

    userSockets.forEach(socketId => {
      this.io.to(socketId).emit("notification", notification);
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users by type
  public getConnectedUsersByType(userType: "admin" | "hospital" | "organization"): number {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.userType === userType).length;
  }
}

// Global instance
let socketService: SocketService | null = null;

export function initializeSocketService(io: SocketIOServer): SocketService {
  if (!socketService) {
    socketService = new SocketService(io);
  }
  return socketService;
}

export function getSocketService(): SocketService | null {
  return socketService;
}
