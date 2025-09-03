import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User, Menu } from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useHospitalNotifications } from "@/contexts/HospitalNotificationContext";
import HospitalSidebar from "./HospitalSidebar";
import HospitalNotificationDropdown from "./HospitalNotificationDropdown";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface HospitalLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function HospitalLayout({
  children,
  title = "Dashboard",
  subtitle,
}: HospitalLayoutProps) {
  const { hospital, logout, loading } = useHospitalAuth();
  const { unreadCount } = useHospitalNotifications();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !hospital) {
      navigate("/hospital/login");
    }
  }, [hospital, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/hospital/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  if (!hospital) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - desktop only */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <HospitalSidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <HospitalSidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
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
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
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
                <HospitalNotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {hospital.hospital_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {hospital.city}, {hospital.state}
                  </p>
                </div>
                <div className="w-8 h-8 bg-medical-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
