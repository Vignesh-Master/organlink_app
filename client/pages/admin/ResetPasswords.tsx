import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { RotateCcw, Search } from "lucide-react";

export default function ResetPasswords() {
  const [searchType, setSearchType] = useState<"hospital" | "organization">(
    "hospital",
  );
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setError("Please enter a Hospital ID or Organization name");
      return;
    }

    setIsLoading(true);
    setError("");
    setSearchResult(null);

    try {
      const token = localStorage.getItem("admin_token");
      const endpoint =
        searchType === "hospital" ? "hospitals" : "organizations";
      const response = await fetch(
        `/api/admin/${endpoint}?search=${searchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const results =
          searchType === "hospital" ? data.hospitals : data.organizations;

        if (results.length > 0) {
          setSearchResult(results[0]);
        } else {
          setError(`No ${searchType} found with that identifier`);
        }
      } else {
        setError("Search failed. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!searchResult) {
      setError("Please search and select an entity first");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("admin_token");
      const endpoint =
        searchType === "hospital" ? "hospitals" : "organizations";

      const response = await fetch(
        `/api/admin/${endpoint}/${searchResult.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword }),
        },
      );

      if (response.ok) {
        setSuccess(`Password reset successfully for ${searchResult.name}`);
        setNewPassword("");
        setConfirmPassword("");
        setSearchResult(null);
        setSearchId("");
      } else {
        const data = await response.json();
        setError(data.error || "Password reset failed");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Reset Hospital Password"
      subtitle="Reset login passwords for hospital accounts"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Search Hospital/Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-medical-600" />
              <span>Search {searchType === 'hospital' ? 'Hospital' : 'Organization'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Search Type</Label>
                <Select
                  value={searchType}
                  onValueChange={(value) =>
                    setSearchType(value as "hospital" | "organization")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {searchType === "hospital"
                    ? "Hospital ID"
                    : "Organization Name"}
                </Label>
                <Input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder={
                    searchType === "hospital"
                      ? "Enter Hospital ID (e.g., H001)"
                      : "Enter Organization Name"
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : `Search ${searchType === 'hospital' ? 'Hospital' : 'Organization'}`}
            </Button>
          </CardContent>
        </Card>

        {/* Search Result */}
        {searchResult && (
          <Card>
            <CardHeader>
              <CardTitle>
                Found {searchType === "hospital" ? "Hospital" : "Organization"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">
                  {searchResult.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {searchType === "hospital"
                    ? `${searchResult.city}, ${searchResult.country} • ${searchResult.email}`
                    : `${searchResult.country} • ${searchResult.email}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {searchType === "hospital"
                    ? `Hospital ID: ${searchResult.hospital_id}`
                    : `Type: ${searchResult.type}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reset Password Form */}
        {searchResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RotateCcw className="h-5 w-5 text-medical-600" />
                <span>Reset Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
