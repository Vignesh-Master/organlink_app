import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Building2, Bell } from "lucide-react";
import OrganizationSidebar from "./OrganizationSidebar";
import OrganizationNotificationDropdown from "./OrganizationNotificationDropdown";
import { useNotifications } from "@/contexts/NotificationContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function OrganizationLayout({
  children,
  title = "Organization Portal",
  subtitle,
}: Props) {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("organization_token")
      : null;

  useEffect(() => {
    if (!token) {
      navigate("/organization/login");
    }
  }, [token, navigate]);

  if (!token) return null;

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <OrganizationSidebar />
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <OrganizationSidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-md border border-gray-200"
                aria-label="Open menu"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-medical-600 rounded-md flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
                <OrganizationNotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("organization_token");
                  navigate("/organization/login");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
