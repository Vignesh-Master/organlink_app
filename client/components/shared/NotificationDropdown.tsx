import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  Clock,
  User,
  Shield,
  FileText,
  Download,
  Vote,
  Activity,
  Trash2,
} from "lucide-react";
import { useSystemNotifications, SystemNotification } from "@/contexts/SystemNotificationContext";
import { formatDistance } from "date-fns";

interface NotificationDropdownProps {
  userType: "admin" | "hospital" | "organization";
  className?: string;
}

export default function NotificationDropdown({
  userType,
  className = "",
}: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSystemNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (notification: SystemNotification) => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "approval_request":
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "policy":
        return <Vote className="h-3 w-3" />;
      case "blockchain":
        return <Shield className="h-3 w-3" />;
      case "export":
        return <Download className="h-3 w-3" />;
      case "security":
        return <Shield className="h-3 w-3" />;
      case "system":
        return <Activity className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const handleNotificationClick = (notification: SystemNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const formatTimeAgo = (timestamp: string) => {
    return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
  };

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const today = new Date();
    const notifDate = new Date(notification.timestamp);
    const diffDays = Math.floor((today.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));

    let group: string;
    if (diffDays === 0) {
      group = "Today";
    } else if (diffDays === 1) {
      group = "Yesterday";
    } else if (diffDays < 7) {
      group = "This week";
    } else {
      group = "Older";
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {} as Record<string, SystemNotification[]>);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2 hover:bg-gray-100 ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[600px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                <div key={group}>
                  <div className="px-4 py-2 bg-gray-50">
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {group}
                    </span>
                  </div>
                  {groupNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-0 cursor-pointer ${
                        !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3 p-4 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              !notification.read ? "text-gray-900" : "text-gray-700"
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 ml-2">
                              {notification.urgent && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          <p className={`text-xs mb-2 line-clamp-2 ${
                            !notification.read ? "text-gray-800" : "text-gray-600"
                          }`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-gray-500">
                                {getCategoryIcon(notification.category)}
                                <span className="text-xs capitalize">
                                  {notification.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                              </div>
                            </div>

                            {notification.actionUrl && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <ExternalLink className="h-3 w-3" />
                                <span className="text-xs">
                                  {notification.actionLabel || "View"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = `/${userType}/notifications`;
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
