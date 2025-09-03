import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Heart,
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Database,
  Blocks,
  RotateCcw,
  Settings,
  Bell,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Manage Hospitals",
    href: "/admin/hospitals",
    icon: Building2,
  },
  {
    name: "Manage Organizations",
    href: "/admin/organizations",
    icon: Users,
  },
  {
    name: "Policies",
    href: "/admin/policies",
    icon: FileText,
  },
  {
    name: "IPFS Logs",
    href: "/admin/ipfs-logs",
    icon: Database,
  },
  {
    name: "Blockchain Logs",
    href: "/admin/blockchain-logs",
    icon: Blocks,
  },
  {
    name: "Reset Passwords",
    href: "/admin/reset-passwords",
    icon: RotateCcw,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-medical-600 p-2 rounded-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">
              OrganLink Admin
            </span>
            <p className="text-xs text-gray-500">System Control Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-medical-50 text-medical-700 border-r-2 border-medical-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-medical-600" : "text-gray-400",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-medical-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              System Admin
            </p>
            <p className="text-xs text-gray-500 truncate">
              admin@organlink.org
            </p>
          </div>
          <Bell className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
