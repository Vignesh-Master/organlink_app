import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import { User, Mail, Key } from "lucide-react";

export default function AdminSettings() {
  const [emailSettings, setEmailSettings] = useState({
    adminEmail: "admin@organlink.org",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async () => {
    if (emailSettings.newPassword !== emailSettings.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Implement password change logic
    console.log("Changing password...");
  };

  return (
    <AdminLayout
      title="System Settings"
      subtitle="Configure system settings and administrative profiles"
    >
      <div className="max-w-2xl mx-auto">
        {/* Admin Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-medical-600" />
              <span>Admin Account Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="adminEmail">Admin Email Address</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input
                  id="adminEmail"
                  value={emailSettings.adminEmail}
                  onChange={(e) =>
                    setEmailSettings((prev) => ({
                      ...prev,
                      adminEmail: e.target.value,
                    }))
                  }
                  className="flex-1"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={emailSettings.currentPassword}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={emailSettings.newPassword}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={emailSettings.confirmPassword}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={handlePasswordChange} className="w-full">
                  Update Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
