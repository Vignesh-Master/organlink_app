import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import AdminLayout from "@/components/admin/AdminLayout";
import { useToast } from "@/contexts/ToastContext";
import ToastContainer from "@/components/admin/ToastContainer";
import { Users, Eye, EyeOff } from "lucide-react";

interface OrganizationFormData {
  organizationName: string;
  organizationId: string;
  organizationType: string;
  foundedYear: string;
  registrationNumber: string;
  taxId: string;
  website: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  contactPerson: string;
  positionTitle: string;
  emailAddress: string;
  phoneNumber: string;
  alternatePhone: string;
  focusAreas: string[];
  permissions: string[];
  password: string;
  confirmPassword: string;
}

const focusAreaOptions = [
  "Organ Donation Awareness",
  "Patient Support",
  "Medical Research",
  "Policy Advocacy",
  "Community Outreach",
  "Education & Training",
  "Donor Family Support",
  "Transplant Coordination",
];

const permissionOptions = [
  {
    id: "create_policies",
    label: "Create Policies",
    description: "Can propose new policies",
  },
  {
    id: "vote_policies",
    label: "Vote on Policies",
    description: "Can vote on policy proposals",
  },
  {
    id: "review_policies",
    label: "Review Policies",
    description: "Can review and comment on policies",
  },
  {
    id: "data_access",
    label: "Data Access",
    description: "Can access aggregate donation data",
  },
  {
    id: "generate_reports",
    label: "Generate Reports",
    description: "Can generate system reports",
  },
  {
    id: "manage_members",
    label: "Manage Members",
    description: "Can manage organization members",
  },
];

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    organizationName: "",
    organizationId: "",
    organizationType: "",
    foundedYear: "",
    registrationNumber: "",
    taxId: "",
    website: "",
    country: "",
    state: "",
    city: "",
    streetAddress: "",
    zipCode: "",
    contactPerson: "",
    positionTitle: "",
    emailAddress: "",
    phoneNumber: "",
    alternatePhone: "",
    focusAreas: [],
    permissions: [],
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (
    field: keyof OrganizationFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFocusAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((f) => f !== area)
        : [...prev.focusAreas, area],
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      error(
        "Password mismatch",
        "Passwords do not match. Please check and try again.",
      );
      return;
    }

    if (formData.password.length < 6) {
      error(
        "Password too short",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.organizationName,
          organization_id: formData.organizationId,
          country: formData.country,
          type: formData.organizationType,
          email: formData.emailAddress,
          phone: formData.phoneNumber,
          address: `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
          website: formData.website,
          founded_year: formData.foundedYear,
          registration_number: formData.registrationNumber,
          tax_id: formData.taxId,
          contact_person: formData.contactPerson,
          position_title: formData.positionTitle,
          alternate_phone: formData.alternatePhone,
          focus_areas: formData.focusAreas,
          permissions: formData.permissions,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        success(
          "Organization registered successfully",
          `${formData.organizationName} has been added to the system.`,
        );
        navigate("/admin/organizations");
      } else {
        error(
          "Registration failed",
          data.error || "Failed to register organization. Please try again.",
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      error("Network error", "Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Register New Organization"
      subtitle="Add a new NGO or organization to the OrganLink network"
    >
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-medical-600" />
              <span>Organization Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Organization Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizationName">
                      Organization Name *
                    </Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) =>
                        handleInputChange("organizationName", e.target.value)
                      }
                      placeholder="Hope for Hearts Foundation"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizationId">Organization ID *</Label>
                    <Input
                      id="organizationId"
                      value={formData.organizationId}
                      onChange={(e) =>
                        handleInputChange("organizationId", e.target.value)
                      }
                      placeholder="ORG001"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizationType">
                      Organization Type *
                    </Label>
                    <Select
                      value={formData.organizationType}
                      onValueChange={(value) =>
                        handleInputChange("organizationType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGO">NGO</SelectItem>
                        <SelectItem value="foundation">Foundation</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                        <SelectItem value="research">
                          Research Institute
                        </SelectItem>
                        <SelectItem value="healthcare">
                          Healthcare Network
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="foundedYear">Founded Year</Label>
                    <Input
                      id="foundedYear"
                      value={formData.foundedYear}
                      onChange={(e) =>
                        handleInputChange("foundedYear", e.target.value)
                      }
                      placeholder="2020"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationNumber">
                      Registration Number *
                    </Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        handleInputChange("registrationNumber", e.target.value)
                      }
                      placeholder="REG12345789"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID/EIN</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) =>
                        handleInputChange("taxId", e.target.value)
                      }
                      placeholder="12-3456789"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="https://www.hopeforhearts.org"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        handleInputChange("country", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usa">United States</SelectItem>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      placeholder="California"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="San Francisco"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Textarea
                    id="streetAddress"
                    value={formData.streetAddress}
                    onChange={(e) =>
                      handleInputChange("streetAddress", e.target.value)
                    }
                    placeholder="123 Nonprofit Drive, Suite 100"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) =>
                      handleInputChange("zipCode", e.target.value)
                    }
                    placeholder="94102"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        handleInputChange("contactPerson", e.target.value)
                      }
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="positionTitle">Position/Title</Label>
                    <Input
                      id="positionTitle"
                      value={formData.positionTitle}
                      onChange={(e) =>
                        handleInputChange("positionTitle", e.target.value)
                      }
                      placeholder="Executive Director"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailAddress">Email Address *</Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) =>
                        handleInputChange("emailAddress", e.target.value)
                      }
                      placeholder="contact@hopeforhearts.org"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This email is the organization's login username for the
                      portal.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={(e) =>
                      handleInputChange("alternatePhone", e.target.value)
                    }
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
              </div>

              {/* Focus Areas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Focus Areas
                </h3>
                <Label>Select Focus Areas</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {focusAreaOptions.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={formData.focusAreas.includes(area)}
                        onCheckedChange={() => handleFocusAreaToggle(area)}
                      />
                      <Label htmlFor={area} className="text-sm">
                        {area}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Permissions
                </h3>
                <Label>Select Permissions</Label>
                <div className="space-y-3">
                  {permissionOptions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() =>
                          handlePermissionToggle(permission.id)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-medium"
                        >
                          {permission.label}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        placeholder="Strong password"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        placeholder="Confirm password"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/organizations")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Organization"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ToastContainer />
      </div>
    </AdminLayout>
  );
}
