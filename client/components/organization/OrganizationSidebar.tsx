import { useLocation, NavLink } from "react-router-dom";
import { 
  LayoutGrid, 
  FileText, 
  Vote, 
  PlusCircle, 
  History, 
  BarChart3, 
  Settings, 
  User, 
  Building2,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  onNavigate?: () => void;
}

export default function OrganizationSidebar({ onNavigate }: Props) {
  const location = useLocation();
  
  const mainNavigation = [
    {
      name: "Dashboard",
      href: "/organization/dashboard",
      icon: LayoutGrid,
      description: "Overview & quick actions"
    }
  ];

  const policyNavigation = [
    {
      name: "All Policies",
      href: "/organization/policies",
      icon: FileText,
      description: "Browse all policies",
      badge: "24"
    },
    {
      name: "Active Votes",
      href: "/organization/policies/vote",
      icon: Vote,
      description: "Policies requiring votes",
      badge: "3",
      urgent: true
    },
    {
      name: "Propose Policy",
      href: "/organization/policies/propose",
      icon: PlusCircle,
      description: "Create new proposal"
    }
  ];

  const analyticsNavigation = [
    {
      name: "Analytics",
      href: "/organization/analytics",
      icon: BarChart3,
      description: "Policy insights & trends"
    },
    {
      name: "History",
      href: "/organization/history",
      icon: History,
      description: "Past voting activity"
    }
  ];

  const accountNavigation = [
    {
      name: "Organization Profile",
      href: "/organization/profile",
      icon: Building2,
      description: "Manage organization info"
    },
    {
      name: "Notifications",
      href: "/organization/notifications",
      icon: Bell,
      description: "Alerts & updates",
      badge: "2"
    },
    {
      name: "Settings",
      href: "/organization/settings",
      icon: Settings,
      description: "Preferences & configuration"
    }
  ];

  const NavItem = ({ item, section }: { item: any, section: string }) => {
    const isActive = location.pathname === item.href;
    
    return (
      <NavLink
        key={item.name}
        to={item.href}
        onClick={() => onNavigate?.()}
        className={
          "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 " +
          (isActive
            ? "bg-medical-50 text-medical-700 border border-medical-200 shadow-sm"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
        }
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-medical-600' : 'text-gray-500'}`} />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{item.name}</p>
            {item.description && (
              <p className="text-xs text-gray-500 truncate">{item.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {item.badge && (
            <Badge 
              variant={item.urgent ? "destructive" : "secondary"} 
              className={`text-xs px-1.5 py-0.5 ${item.urgent ? 'bg-red-100 text-red-700' : ''}`}
            >
              {item.badge}
            </Badge>
          )}
          {isActive && <ChevronRight className="h-3 w-3 text-medical-600" />}
        </div>
      </NavLink>
    );
  };

  const orgInfo = {
    name: "World Health Organization",
    email: "who@organlink.org",
    role: "Policy Contributor"
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo & Organization Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-medical-600 rounded-xl flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 truncate">OrganLink</h2>
            <p className="text-xs text-gray-500">Organization Portal</p>
          </div>
        </div>
        
        {/* Current Organization */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <User className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900 truncate">{orgInfo.name}</p>
          </div>
          <p className="text-xs text-gray-600 truncate">{orgInfo.email}</p>
          <Badge variant="outline" className="mt-1 text-xs">
            {orgInfo.role}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Main */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Main
          </h3>
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavItem key={item.name} item={item} section="main" />
            ))}
          </div>
        </div>

        {/* Policy Management */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Policy Management
          </h3>
          <div className="space-y-1">
            {policyNavigation.map((item) => (
              <NavItem key={item.name} item={item} section="policy" />
            ))}
          </div>
        </div>

        {/* Analytics & Reporting */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Analytics
          </h3>
          <div className="space-y-1">
            {analyticsNavigation.map((item) => (
              <NavItem key={item.name} item={item} section="analytics" />
            ))}
          </div>
        </div>

        <Separator />

        {/* Account & Settings */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Account
          </h3>
          <div className="space-y-1">
            {accountNavigation.map((item) => (
              <NavItem key={item.name} item={item} section="account" />
            ))}
          </div>
        </div>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2 mb-4">
          <Button 
            size="sm" 
            className="w-full bg-medical-600 hover:bg-medical-700"
            onClick={() => {
              window.location.href = '/organization/policies/propose';
              onNavigate?.();
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Proposal
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              window.location.href = '/organization/policies/vote';
              onNavigate?.();
            }}
          >
            <Vote className="h-4 w-4 mr-2" />
            Vote Now
          </Button>
        </div>

        {/* Help & Logout */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => {
              localStorage.removeItem("organization_token");
              window.location.href = "/organization/login";
            }}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
        
        {/* Footer */}
        <div className="text-xs text-gray-500 text-center mt-4">
          <p>OrganLink v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
