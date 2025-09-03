import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Heart,
  UserPlus,
  HeartHandshake,
  Search,
  HelpCircle,
  Activity,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/hospital/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "View Patients",
    href: "/hospital/patients",
    icon: Users,
  },
  {
    name: "View Donors",
    href: "/hospital/donors",
    icon: Heart,
  },
  {
    name: "Register Patient",
    href: "/hospital/patients/register",
    icon: UserPlus,
  },
  {
    name: "Register Donor",
    href: "/hospital/donors/register",
    icon: HeartHandshake,
  },
  {
    name: "AI Matching",
    href: "/hospital/ai-matching",
    icon: Search,
  },
  {
    name: "Reports",
    href: "/hospital/reports",
    icon: Activity,
  },
  {
    name: "FAQs",
    href: "/hospital/faqs",
    icon: HelpCircle,
  },
];

export default function HospitalSidebar({
  onNavigate,
}: { onNavigate?: () => void } = {}) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">OrganLink</h2>
            <p className="text-xs text-gray-500">Hospital Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-medical-50 text-medical-700 border border-medical-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>OrganLink Hospital Portal</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
