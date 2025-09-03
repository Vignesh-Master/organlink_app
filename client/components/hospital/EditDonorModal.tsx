import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Save } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface Donor {
  donor_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_type: string;
  organs_to_donate: string[] | string;
  medical_history: string;
  contact_phone: string;
  contact_email: string;
  emergency_contact: string;
  emergency_phone: string;
  signature_file_path?: string;
  signature_ipfs_hash?: string;
  blockchain_tx_hash?: string;
  signature_verified: boolean;
  registration_date: string;
  is_active: boolean;
}

interface EditDonorModalProps {
  donor: Donor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedDonor: Donor) => void;
}

export default function EditDonorModal({
  donor,
  isOpen,
  onClose,
  onUpdate,
}: EditDonorModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    age: 0,
    gender: "",
    blood_type: "",
    organs_to_donate: [] as string[],
    medical_history: "",
    contact_phone: "",
    contact_email: "",
    emergency_contact: "",
    emergency_phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const organTypes = [
    "Kidney",
    "Liver",
    "Heart",
    "Lung",
    "Pancreas",
    "Cornea",
    "Bone Marrow",
    "Skin",
    "Bone",
  ];

  useEffect(() => {
    if (donor) {
      const organs = Array.isArray(donor.organs_to_donate)
        ? donor.organs_to_donate
        : typeof donor.organs_to_donate === "string" && donor.organs_to_donate
          ? donor.organs_to_donate
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : [];
      setFormData({
        full_name: donor.full_name,
        age: donor.age,
        gender: donor.gender,
        blood_type: donor.blood_type,
        organs_to_donate: organs,
        medical_history: donor.medical_history,
        contact_phone: donor.contact_phone,
        contact_email: donor.contact_email,
        emergency_contact: donor.emergency_contact,
        emergency_phone: donor.emergency_phone,
      });
    }
  }, [donor]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOrganToggle = (organ: string) => {
    setFormData((prev) => ({
      ...prev,
      organs_to_donate: prev.organs_to_donate.includes(organ)
        ? prev.organs_to_donate.filter((o) => o !== organ)
        : [...prev.organs_to_donate, organ],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donor) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch(`/api/hospital/donors/${donor.donor_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organs_to_donate: formData.organs_to_donate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Update failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showSuccess("Donor updated successfully!");
        onUpdate(result.donor);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Update error:", error);
      showError("Failed to update donor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!donor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Donor Details
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Update donor information. Note: Signature and blockchain data cannot
            be modified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    handleInputChange("age", parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="blood_type">Blood Type *</Label>
                <Select
                  value={formData.blood_type}
                  onValueChange={(value) =>
                    handleInputChange("blood_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Organs to Donate */}
          <div className="space-y-4">
            <Label>Organs to Donate *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {organTypes.map((organ) => (
                <div
                  key={organ}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    formData.organs_to_donate.includes(organ)
                      ? "bg-medical-100 border-medical-300 text-medical-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleOrganToggle(organ)}
                >
                  <span className="text-sm">{organ}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <Label htmlFor="medical_history">Medical History</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) =>
                handleInputChange("medical_history", e.target.value)
              }
              placeholder="Any relevant medical history, allergies, or conditions..."
              rows={3}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_phone">Phone Number *</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    handleInputChange("contact_phone", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Email Address *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    handleInputChange("contact_email", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact">
                  Emergency Contact Name *
                </Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) =>
                    handleInputChange("emergency_contact", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="emergency_phone">
                  Emergency Contact Phone *
                </Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={(e) =>
                    handleInputChange("emergency_phone", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Blockchain Information (Read-only) */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold">Blockchain Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Signature Status</Label>
                <Badge
                  className={
                    donor.signature_verified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {donor.signature_verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              {donor.signature_ipfs_hash && (
                <div>
                  <Label className="text-gray-600">IPFS Hash</Label>
                  <p className="font-mono text-xs">
                    {donor.signature_ipfs_hash}
                  </p>
                </div>
              )}
              {donor.blockchain_tx_hash && (
                <div>
                  <Label className="text-gray-600">
                    Blockchain Transaction
                  </Label>
                  <p className="font-mono text-xs">
                    {donor.blockchain_tx_hash}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Updating..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Donor
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
