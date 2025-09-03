import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  X,
  Check,
  Heart,
  Users,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { useHospitalNotifications } from "@/contexts/HospitalNotificationContext";
import { cn } from "@/lib/utils";

interface HospitalNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HospitalNotificationDropdown({
  isOpen,
  onClose,
}: HospitalNotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useHospitalNotifications();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "organ_match":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "match_response":
        return <Users className="h-4 w-4 text-green-500" />;
      case "urgent_case":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "system":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 z-50">
      <Card ref={dropdownRef} className="shadow-lg border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-6 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see updates about matches and requests here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors cursor-pointer relative",
                      !notification.is_read && "bg-blue-50 border-l-4 border-l-blue-500"
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.notification_id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={cn(
                            "text-sm font-medium text-gray-900 truncate",
                            !notification.is_read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.notification_id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.notification_id);
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          {notification.type === "organ_match" && (
                            <Badge variant="outline" className="text-xs">
                              Match Request
                            </Badge>
                          )}
                          
                          {notification.type === "match_response" && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              Response
                            </Badge>
                          )}
                          
                          {notification.type === "urgent_case" && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <div className="p-3 text-center border-t">
                    <p className="text-xs text-gray-500">
                      Showing 10 of {notifications.length} notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
