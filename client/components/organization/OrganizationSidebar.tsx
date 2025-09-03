import { useLocation, NavLink } from "react-router-dom";
import { LayoutGrid, FileText, Vote } from "lucide-react";

interface Props {
  onNavigate?: () => void;
}

export default function OrganizationSidebar({ onNavigate }: Props) {
  const location = useLocation();
  const navigation = [
    {
      name: "Dashboard",
      href: "/organization/dashboard",
      icon: LayoutGrid,
    },
    {
      name: "Policies",
      href: "/organization/policies",
      icon: FileText,
    },
    {
      name: "Propose Policy",
      href: "/organization/policies/propose",
      icon: FileText,
    },
    {
      name: "Vote",
      href: "/organization/policies/vote",
      icon: Vote,
    },
  ];
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">OrganLink</h2>
            <p className="text-xs text-gray-500">Organization Portal</p>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => onNavigate?.()}
              className={
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-medical-50 text-medical-700 border border-medical-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>OrganLink Organization Portal</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
