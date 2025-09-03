import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Heart,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useToast } from "@/contexts/ToastContext";
import HospitalLayout from "@/components/hospital/HospitalLayout";

interface PatientFormData {
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
}

interface SignatureUploadStatus {
  uploading: boolean;
  uploaded: boolean;
  ipfsHash: string;
  ocrVerified: boolean;
  blockchainTxHash: string;
  fileName: string;
  docHash?: string;
  ocrScoreBps?: number;
}

export default function RegisterPatient() {
  const [formData, setFormData] = useState<PatientFormData>({
    full_name: "",
    age: 0,
    gender: "",
    blood_type: "",
    organ_needed: "",
    urgency_level: "medium",
    medical_condition: "",
    contact_phone: "",
    contact_email: "",
    emergency_contact: "",
    emergency_phone: "",
  });

  const [signatureStatus, setSignatureStatus] = useState<SignatureUploadStatus>(
    {
      uploading: false,
      uploaded: false,
      ipfsHash: "",
      ocrVerified: false,
      blockchainTxHash: "",
      fileName: "",
    },
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [registeredPatientId, setRegisteredPatientId] = useState("");

  const { hospital } = useHospitalAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (
    field: keyof PatientFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!registeredPatientId) {
      showError("Please register patient details first");
      return;
    }

    setSignatureStatus((prev) => ({ ...prev, uploading: true }));

    try {
      const formDataForUpload = new FormData();
      formDataForUpload.append("signature", file);
      formDataForUpload.append("record_type", "patient");
      formDataForUpload.append("record_id", registeredPatientId);
      formDataForUpload.append("patient_name", formData.full_name);

      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/upload/signature", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataForUpload,
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {}
      if (!response.ok) {
        const serverMsg =
          result?.error || `Upload failed with status ${response.status}`;
        throw new Error(serverMsg);
      }

      if (result && result.success) {
        const verified = Boolean(result.ocrVerification?.isValid);
        const confidence = Number(result.ocrVerification?.confidence ?? 0);
        const bps = Math.max(
          0,
          Math.min(
            10000,
            Math.round(
              (confidence > 1 ? confidence / 100 : confidence) * 10000,
            ),
          ),
        );
        const buf = new Uint8Array(await file.arrayBuffer());
        const { keccak256 } = await import("ethers");
        const docHash = keccak256(buf);
        setSignatureStatus((prev) => ({
          ...prev,
          uploading: false,
          uploaded: true,
          ipfsHash: result.ipfsHash,
          fileName: result.fileName,
          ocrVerified: verified,
          docHash,
          ocrScoreBps: bps,
        }));

        // Update patient record with IPFS hash and verification flag
        await updatePatientSignature(
          registeredPatientId,
          result.ipfsHash,
          verified,
        );

        showSuccess("Signature uploaded successfully!");
        setCurrentStep(3);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      showError(error?.message || "Failed to upload signature");
    } finally {
      setSignatureStatus((prev) => ({ ...prev, uploading: false }));
    }
  };

  const updatePatientSignature = async (
    patientId: string,
    ipfsHash: string,
    verified: boolean,
  ) => {
    try {
      const token = localStorage.getItem("hospital_token");
      await fetch(`/api/hospital/patients/${patientId}/signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signature_ipfs_hash: ipfsHash,
          signature_verified: verified,
        }),
      });
    } catch (error) {
      console.error("Failed to update patient signature:", error);
    }
  };

  const registerToBlockchain = async () => {
    if (!signatureStatus.ipfsHash) {
      showError("Please upload signature first");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/upload/blockchain-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          record_type: "patient",
          record_id: registeredPatientId,
          ipfs_hash: signatureStatus.ipfsHash,
          doc_hash: signatureStatus.docHash,
          ocr_score_bps: signatureStatus.ocrScoreBps,
          verified: signatureStatus.ocrVerified,
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {}
      if (!response.ok) {
        const serverMsg =
          result?.error ||
          `Blockchain registration failed with status ${response.status}`;
        throw new Error(serverMsg);
      }

      if (result.success) {
        setSignatureStatus((prev) => ({
          ...prev,
          blockchainTxHash: result.blockchainTxHash,
        }));

        // Update patient record (ensures verified remains true)
        await updatePatientSignature(
          registeredPatientId,
          signatureStatus.ipfsHash,
          true,
        );

        showSuccess("Patient registered on blockchain successfully!");
        setTimeout(() => {
          navigate("/hospital/patients");
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Blockchain registration error:", error);
      showError(error?.message || "Failed to register on blockchain");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/patients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Registration failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setRegisteredPatientId(result.patient.patient_id);
        showSuccess("Patient details registered successfully!");
        setCurrentStep(2);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      showError("Failed to register patient");
    } finally {
      setIsSubmitting(false);
    }
  };

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
  const urgencyLevels = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  return (
    <HospitalLayout
      title="Register Patient"
      subtitle="Complete patient registration with blockchain verification"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div></div>
            <Badge variant="outline" className="text-medical-600">
              Step {currentStep} of 3
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${currentStep >= 1 ? "text-medical-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? "bg-medical-600 text-white" : "bg-gray-200"
                }`}
              >
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Patient Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div
              className={`flex items-center space-x-2 ${currentStep >= 2 ? "text-medical-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? "bg-medical-600 text-white" : "bg-gray-200"
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Signature Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div
              className={`flex items-center space-x-2 ${currentStep >= 3 ? "text-medical-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? "bg-medical-600 text-white" : "bg-gray-200"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">
                Blockchain Verification
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Patient Details Form */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Personal Information
                    </h3>

                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          handleInputChange("full_name", e.target.value)
                        }
                        placeholder="Enter patient's full name"
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="age">Age *</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.age || ""}
                          onChange={(e) =>
                            handleInputChange("age", parseInt(e.target.value))
                          }
                          placeholder="Age"
                          required
                          min="1"
                          max="120"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) =>
                            handleInputChange("gender", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blood_type">Blood Type *</Label>
                        <Select
                          value={formData.blood_type}
                          onValueChange={(value) =>
                            handleInputChange("blood_type", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
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

                      <div>
                        <Label htmlFor="organ_needed">Organ Needed *</Label>
                        <Select
                          value={formData.organ_needed}
                          onValueChange={(value) =>
                            handleInputChange("organ_needed", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select organ" />
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
                    </div>

                    <div>
                      <Label htmlFor="urgency_level">Urgency Level *</Label>
                      <Select
                        value={formData.urgency_level}
                        onValueChange={(value) =>
                          handleInputChange("urgency_level", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          {urgencyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="medical_condition">
                        Medical Condition
                      </Label>
                      <Textarea
                        id="medical_condition"
                        value={formData.medical_condition}
                        onChange={(e) =>
                          handleInputChange("medical_condition", e.target.value)
                        }
                        placeholder="Describe the patient's medical condition"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Contact Information
                    </h3>

                    <div>
                      <Label htmlFor="contact_phone">Phone Number *</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) =>
                          handleInputChange("contact_phone", e.target.value)
                        }
                        placeholder="+1 (555) 123-4567"
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_email">Email Address</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) =>
                          handleInputChange("contact_email", e.target.value)
                        }
                        placeholder="patient@example.com"
                        className="mt-1"
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
                        placeholder="Emergency contact full name"
                        required
                        className="mt-1"
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
                        placeholder="+1 (555) 987-6543"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-medical-600 hover:bg-medical-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Continue to Signature Upload"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Signature Upload */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Signature Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  {!signatureStatus.uploaded ? (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Upload Patient Consent Document
                        </h3>
                        <p className="text-gray-600">
                          Upload a signed consent form, signature document, or
                          authorization letter
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="signature-upload"
                        disabled={signatureStatus.uploading}
                      />
                      <label htmlFor="signature-upload">
                        <Button
                          type="button"
                          disabled={signatureStatus.uploading}
                          className="bg-medical-600 hover:bg-medical-700"
                          asChild
                        >
                          <span>
                            {signatureStatus.uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <p className="text-sm text-gray-500">
                        Supported formats: JPEG, PNG (Max 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Document Uploaded Successfully
                        </h3>
                        <p className="text-gray-600">
                          {signatureStatus.fileName}
                        </p>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <Badge
                          className={
                            signatureStatus.ocrVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {signatureStatus.ocrVerified ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OCR Verified
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              OCR Pending
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline">
                          IPFS: {signatureStatus.ipfsHash.substring(0, 10)}...
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {signatureStatus.uploaded && (
                <div className="flex flex-col items-center space-y-2">
                  {!signatureStatus.ocrVerified && (
                    <div className="text-center text-sm text-amber-600">
                      Signature uploaded but OCR not verified. You can proceed;
                      verification will be finalized on-chain.
                    </div>
                  )}
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="bg-medical-600 hover:bg-medical-700"
                  >
                    Continue to Blockchain Registration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Blockchain Registration */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                {!signatureStatus.blockchainTxHash ? (
                  <>
                    <div className="p-6 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Ready for Blockchain Registration
                      </h3>
                      <p className="text-gray-600">
                        Register this patient record on the blockchain for
                        permanent verification and immutable record keeping.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Patient Details Registered
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Signature Uploaded to IPFS
                      </Badge>
                    </div>

                    <Button
                      onClick={registerToBlockchain}
                      disabled={isSubmitting || !signatureStatus.ipfsHash}
                      className="bg-medical-600 hover:bg-medical-700"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registering on Blockchain...
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Register on Blockchain
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Registration Complete!
                      </h3>
                      <p className="text-gray-600 mt-2">
                        Patient has been successfully registered and verified on
                        the blockchain.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Badge className="bg-green-100 text-green-800">
                        Patient ID: {registeredPatientId}
                      </Badge>
                      <Badge variant="outline">
                        Blockchain TX:{" "}
                        {signatureStatus.blockchainTxHash.substring(0, 20)}...
                      </Badge>
                    </div>

                    <div className="flex justify-center space-x-4">
                      <Button
                        onClick={() => navigate("/hospital/patients")}
                        className="bg-medical-600 hover:bg-medical-700"
                      >
                        View All Patients
                      </Button>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                      >
                        Register Another Patient
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </HospitalLayout>
  );
}
