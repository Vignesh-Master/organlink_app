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

interface Patient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_type: string;
  organ_needed: string;
  urgency_level: string;
  medical_condition: string;
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

interface EditPatientModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedPatient: Patient) => void;
}

export default function EditPatientModal({
  patient,
  isOpen,
  onClose,
  onUpdate,
}: EditPatientModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    age: 0,
    gender: "",
    blood_type: "",
    organ_needed: "",
    urgency_level: "",
    medical_condition: "",
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
  ];
  const urgencyLevels = ["Low", "Medium", "High", "Critical"];

  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name,
        age: patient.age,
        gender: patient.gender,
        blood_type: patient.blood_type,
        organ_needed: patient.organ_needed,
        urgency_level: patient.urgency_level,
        medical_condition: patient.medical_condition,
        contact_phone: patient.contact_phone,
        contact_email: patient.contact_email,
        emergency_contact: patient.emergency_contact,
        emergency_phone: patient.emergency_phone,
      });
    }
  }, [patient]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch(
        `/api/hospital/patients/${patient.patient_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        throw new Error(`Update failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showSuccess("Patient updated successfully!");
        onUpdate(result.patient);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Update error:", error);
      showError("Failed to update patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Patient Details
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Update patient information. Note: Signature and blockchain data
            cannot be modified.
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

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organ_needed">Organ Needed *</Label>
                <Select
                  value={formData.organ_needed}
                  onValueChange={(value) =>
                    handleInputChange("organ_needed", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organ needed" />
                  </SelectTrigger>
                  <SelectContent>
                    {organTypes.map((organ) => (
                      <SelectItem key={organ} value={organ}>
                        {organ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency_level">Urgency Level *</Label>
                <Select
                  value={formData.urgency_level}
                  onValueChange={(value) =>
                    handleInputChange("urgency_level", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="medical_condition">Medical Condition *</Label>
              <Textarea
                id="medical_condition"
                value={formData.medical_condition}
                onChange={(e) =>
                  handleInputChange("medical_condition", e.target.value)
                }
                placeholder="Describe the patient's medical condition..."
                required
                rows={3}
              />
            </div>
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
                    patient.signature_verified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {patient.signature_verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              {patient.signature_ipfs_hash && (
                <div>
                  <Label className="text-gray-600">IPFS Hash</Label>
                  <p className="font-mono text-xs">
                    {patient.signature_ipfs_hash}
                  </p>
                </div>
              )}
              {patient.blockchain_tx_hash && (
                <div>
                  <Label className="text-gray-600">
                    Blockchain Transaction
                  </Label>
                  <p className="font-mono text-xs">
                    {patient.blockchain_tx_hash}
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
                  Update Patient
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
