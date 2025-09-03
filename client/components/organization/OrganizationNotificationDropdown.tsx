import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, CheckCheck, Info, Trash2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

interface OrganizationNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrganizationNotificationDropdown({
  isOpen,
  onClose,
}: OrganizationNotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

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
                <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 ${notif.read ? "bg-gray-50" : "bg-white"}`}
                >
                  <Info className="h-5 w-5 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{notif.title}</div>
                    <div className="text-sm text-gray-600">{notif.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{notif.time}</div>
                  </div>
                  {!notif.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)}>
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteNotification(notif.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
