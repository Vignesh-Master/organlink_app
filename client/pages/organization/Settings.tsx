import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExportModal, { ExportOptions } from "@/components/shared/ExportModal";
import { useSystemNotifications } from "@/contexts/SystemNotificationContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Bell,
  Shield,
  User,
  Globe,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
  Mail,
  Smartphone,
  Clock,
  Download,
  Upload,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  proposalCreated: boolean;
  votingReminders: boolean;
  proposalFinalized: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  loginNotifications: boolean;
  deviceTracking: boolean;
  allowedIPs: string[];
}

interface OrganizationPreferences {
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;
  votingRemindersHours: string;
  autoLogout: boolean;
}

export default function OrganizationSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Export and password change modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [passwordChangeModalOpen, setPasswordChangeModalOpen] = useState(false);
  const [passwordChangeReason, setPasswordChangeReason] = useState("");

  const { submitExportRequest, submitPasswordChangeRequest, addNotification } = useSystemNotifications();

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    proposalCreated: true,
    votingReminders: true,
    proposalFinalized: true,
    systemUpdates: true,
    securityAlerts: true,
    weeklyDigest: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: "24",
    loginNotifications: true,
    deviceTracking: true,
    allowedIPs: [],
  });

  const [preferences, setPreferences] = useState<OrganizationPreferences>({
    timezone: "UTC",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    votingRemindersHours: "24",
    autoLogout: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    email: "who@organlink.org",
    phone: "",
    backupEmail: "",
  });

  useEffect(() => {
    // Load settings from API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from API
      // const response = await fetch('/api/organization/settings');
      // const data = await response.json();
      // setNotifications(data.notifications);
      // setSecurity(data.security);
      // setPreferences(data.preferences);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // In real implementation, save to API
      const settingsData = {
        notifications,
        security,
        preferences,
      };
      
      // await fetch('/api/organization/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settingsData)
      // });

      setHasChanges(false);
      // Show success toast
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateSecurity = (key: keyof SecuritySettings, value: any) => {
    setSecurity(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updatePreferences = (key: keyof OrganizationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleExportData = async (options: ExportOptions) => {
    try {
      await submitExportRequest({
        requesterId: "org_1", // Get from auth context
        requesterName: "World Health Organization",
        requesterType: "organization",
        dataType: "organization_settings",
        format: options.format,
        includesPersonalData: options.includePersonalData || false,
      });

      addNotification({
        type: "success",
        title: "Export Request Submitted",
        message: `Your settings export request (${options.format.toUpperCase()}) has been submitted for admin approval.`,
        read: false,
        urgent: false,
        category: "export",
        recipientType: "organization",
      });
    } catch (error) {
      console.error("Export request failed:", error);
      addNotification({
        type: "error",
        title: "Export Request Failed",
        message: "Failed to submit export request. Please try again.",
        read: false,
        urgent: true,
        category: "export",
        recipientType: "organization",
      });
    }
  };

  const handlePasswordChangeRequest = async () => {
    try {
      if (!passwordChangeReason.trim()) {
        addNotification({
          type: "warning",
          title: "Reason Required",
          message: "Please provide a reason for the password change request.",
          read: false,
          urgent: false,
          category: "security",
          recipientType: "organization",
        });
        return;
      }

      await submitPasswordChangeRequest({
        userId: "org_1", // Get from auth context
        userType: "organization",
        userName: "World Health Organization",
        userEmail: "who@organlink.org",
        reason: passwordChangeReason,
      });

      addNotification({
        type: "success",
        title: "Password Change Request Submitted",
        message: "Your password change request has been submitted for admin approval.",
        read: false,
        urgent: false,
        category: "security",
        recipientType: "organization",
      });

      setPasswordChangeModalOpen(false);
      setPasswordChangeReason("");
    } catch (error) {
      console.error("Password change request failed:", error);
      addNotification({
        type: "error",
        title: "Request Failed",
        message: "Failed to submit password change request. Please try again.",
        read: false,
        urgent: true,
        category: "security",
        recipientType: "organization",
      });
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "account", label: "Account", icon: User },
    { id: "data", label: "Data & Privacy", icon: Globe },
  ];

  return (
    <OrganizationLayout
      title="Settings"
      subtitle="Manage your organization's preferences and security"
    >
      <div className="space-y-6">
        {/* Save Changes Alert */}
        {hasChanges && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>You have unsaved changes.</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadSettings();
                      setHasChanges(false);
                    }}
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSettings}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-medical-50 text-medical-700 border border-medical-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle>General Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => updatePreferences("timezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                          <SelectItem value="CET">Central European Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => updatePreferences("language", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) => updatePreferences("dateFormat", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="votingReminders">Voting Reminder Time</Label>
                      <Select
                        value={preferences.votingRemindersHours}
                        onValueChange={(value) => updatePreferences("votingRemindersHours", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour before</SelectItem>
                          <SelectItem value="6">6 hours before</SelectItem>
                          <SelectItem value="24">24 hours before</SelectItem>
                          <SelectItem value="72">3 days before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoLogout">Auto Logout</Label>
                        <p className="text-sm text-gray-600">
                          Automatically log out after period of inactivity
                        </p>
                      </div>
                      <Switch
                        id="autoLogout"
                        checked={preferences.autoLogout}
                        onCheckedChange={(checked) => updatePreferences("autoLogout", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => updateNotification("emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-600">
                          Receive urgent notifications via SMS
                        </p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) => updateNotification("smsNotifications", checked)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Proposal Notifications</h4>
                    
                    <div className="space-y-4 ml-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="proposalCreated">New Proposals</Label>
                          <p className="text-sm text-gray-600">
                            When new proposals are created by other organizations
                          </p>
                        </div>
                        <Switch
                          id="proposalCreated"
                          checked={notifications.proposalCreated}
                          onCheckedChange={(checked) => updateNotification("proposalCreated", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="votingReminders">Voting Reminders</Label>
                          <p className="text-sm text-gray-600">
                            Reminders before voting deadlines
                          </p>
                        </div>
                        <Switch
                          id="votingReminders"
                          checked={notifications.votingReminders}
                          onCheckedChange={(checked) => updateNotification("votingReminders", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="proposalFinalized">Proposal Results</Label>
                          <p className="text-sm text-gray-600">
                            When proposals are finalized with results
                          </p>
                        </div>
                        <Switch
                          id="proposalFinalized"
                          checked={notifications.proposalFinalized}
                          onCheckedChange={(checked) => updateNotification("proposalFinalized", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">System Notifications</h4>
                    
                    <div className="space-y-4 ml-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="systemUpdates">System Updates</Label>
                          <p className="text-sm text-gray-600">
                            Platform updates and maintenance notices
                          </p>
                        </div>
                        <Switch
                          id="systemUpdates"
                          checked={notifications.systemUpdates}
                          onCheckedChange={(checked) => updateNotification("systemUpdates", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="securityAlerts">Security Alerts</Label>
                          <p className="text-sm text-gray-600">
                            Important security notifications (always enabled)
                          </p>
                        </div>
                        <Switch
                          id="securityAlerts"
                          checked={true}
                          disabled={true}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                          <p className="text-sm text-gray-600">
                            Weekly summary of platform activity
                          </p>
                        </div>
                        <Switch
                          id="weeklyDigest"
                          checked={notifications.weeklyDigest}
                          onCheckedChange={(checked) => updateNotification("weeklyDigest", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-600">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {security.twoFactorEnabled && (
                            <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                          )}
                          <Switch
                            id="twoFactor"
                            checked={security.twoFactorEnabled}
                            onCheckedChange={(checked) => updateSecurity("twoFactorEnabled", checked)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="loginNotifications">Login Notifications</Label>
                          <p className="text-sm text-gray-600">
                            Get notified of new login attempts
                          </p>
                        </div>
                        <Switch
                          id="loginNotifications"
                          checked={security.loginNotifications}
                          onCheckedChange={(checked) => updateSecurity("loginNotifications", checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="sessionTimeout">Session Timeout</Label>
                        <Select
                          value={security.sessionTimeout}
                          onValueChange={(value) => updateSecurity("sessionTimeout", value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <Button className="w-full md:w-auto">
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Settings */}
            {activeTab === "account" && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Primary Email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="backupEmail">Backup Email</Label>
                      <Input
                        id="backupEmail"
                        type="email"
                        value={formData.backupEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, backupEmail: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                        <Button variant="outline" size="sm">
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Connected Devices</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-gray-600">Chrome on Windows • Current location</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Current</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">Mobile Device</p>
                          <p className="text-sm text-gray-600">Safari on iOS • Last seen 2 hours ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data & Privacy */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Export</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Export your organization's data including proposals, votes, and activity history.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Deactivate Organization</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Temporarily deactivate your organization. You won't be able to propose or vote until reactivated.
                      </p>
                      <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                        Deactivate Organization
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Delete Organization</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Permanently delete your organization and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Organization
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </OrganizationLayout>
  );
}
