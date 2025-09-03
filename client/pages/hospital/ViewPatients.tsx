import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Eye,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useToast } from "@/contexts/ToastContext";
import HospitalLayout from "@/components/hospital/HospitalLayout";
import EditPatientModal from "@/components/hospital/EditPatientModal";

interface Patient {
  id: number;
  patient_id: string;
  hospital_id: string;
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
  created_at: string;
  updated_at: string;
}

export default function ViewPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrgan, setFilterOrgan] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterBloodType, setFilterBloodType] = useState("all");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const { hospital } = useHospitalAuth();
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, filterOrgan, filterUrgency, filterBloodType]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
      } else {
        showError("Failed to load patients");
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      showError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.contact_email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Organ filter
    if (filterOrgan && filterOrgan !== "all") {
      filtered = filtered.filter(
        (patient) => patient.organ_needed === filterOrgan,
      );
    }

    // Urgency filter
    if (filterUrgency && filterUrgency !== "all") {
      filtered = filtered.filter(
        (patient) => patient.urgency_level === filterUrgency,
      );
    }

    // Blood type filter
    if (filterBloodType && filterBloodType !== "all") {
      filtered = filtered.filter(
        (patient) => patient.blood_type === filterBloodType,
      );
    }

    setFilteredPatients(filtered);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsEditModalOpen(true);
  };

  const handlePatientUpdate = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.patient_id === updatedPatient.patient_id ? updatedPatient : p,
      ),
    );
    setFilteredPatients((prev) =>
      prev.map((p) =>
        p.patient_id === updatedPatient.patient_id ? updatedPatient : p,
      ),
    );
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPatient(null);
  };

  const handleDeletePatient = async (patientId: string) => {
    setDeletingPatient(patientId);
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch(`/api/hospital/patients/${patientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showSuccess("Patient deleted successfully!");
        // Remove from local state
        setPatients((prev) => prev.filter((p) => p.patient_id !== patientId));
        setFilteredPatients((prev) =>
          prev.filter((p) => p.patient_id !== patientId),
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Failed to delete patient");
    } finally {
      setDeletingPatient(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600"></div>
      </div>
    );
  }

  return (
    <HospitalLayout
      title="Patient Management"
      subtitle="View and manage registered patients"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-4"></div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setExportOpen(true)}
                className="w-full sm:w-auto"
              >
                Export Data
              </Button>
              <Link
                to="/hospital/patients/register"
                className="w-full sm:w-auto"
              >
                <Button className="w-full sm:w-auto bg-medical-600 hover:bg-medical-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Register New Patient
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold">{patients.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Cases</p>
                  <p className="text-2xl font-bold">
                    {patients.filter((p) => p.is_active).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold">
                    {patients.filter((p) => p.signature_verified).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgent Cases</p>
                  <p className="text-2xl font-bold">
                    {
                      patients.filter((p) =>
                        ["High", "Critical"].includes(p.urgency_level),
                      ).length
                    }
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterOrgan} onValueChange={setFilterOrgan}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by organ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organs</SelectItem>
                  {organTypes.map((organ) => (
                    <SelectItem key={organ} value={organ}>
                      {organ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterBloodType}
                onValueChange={setFilterBloodType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blood Types</SelectItem>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterOrgan("all");
                  setFilterUrgency("all");
                  setFilterBloodType("all");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {patient.patient_id} • Age: {patient.age} •{" "}
                            {patient.gender}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge
                            className={getUrgencyColor(patient.urgency_level)}
                          >
                            {patient.urgency_level}
                          </Badge>
                          <Badge variant="outline">{patient.blood_type}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {patient.organ_needed}
                          </Badge>
                          {patient.signature_verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {patient.contact_phone}
                        </div>
                        {patient.contact_email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {patient.contact_email}
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Registered: {formatDate(patient.registration_date)}
                        </div>
                      </div>

                      {patient.medical_condition && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <strong>Medical Condition:</strong>{" "}
                            {patient.medical_condition}
                          </p>
                        </div>
                      )}

                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Emergency Contact:</strong>{" "}
                          {patient.emergency_contact} -{" "}
                          {patient.emergency_phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 md:space-y-2 md:ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPatient(patient)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>

                      {patient.signature_ipfs_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/hospital/upload/ipfs/${patient.signature_ipfs_hash}`,
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                      )}

                      {patient.blockchain_tx_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://sepolia.etherscan.io/tx/${patient.blockchain_tx_hash}`,
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Blockchain
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Patients Found
                </h3>
                <p className="text-gray-600 mb-6">
                  {patients.length === 0
                    ? "No patients have been registered yet."
                    : "No patients match your current filter criteria."}
                </p>
                <Link to="/hospital/patients/register">
                  <Button className="bg-medical-600 hover:bg-medical-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Register First Patient
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditPatientModal
        patient={editingPatient}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handlePatientUpdate}
      />
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Export Patient Data</DialogTitle>
            <DialogDescription>
              Choose format and optional date range
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Export Format</p>
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  className={`px-4 py-2 text-sm ${exportFormat === "pdf" ? "bg-medical-600 text-white" : "bg-white"}`}
                  onClick={() => setExportFormat("pdf")}
                >
                  PDF
                </button>
                <button
                  className={`px-4 py-2 text-sm border-l ${exportFormat === "excel" ? "bg-medical-600 text-white" : "bg-white"}`}
                  onClick={() => setExportFormat("excel")}
                >
                  Excel/CSV
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Date Range (Optional)</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                />
                <Input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const rows = filteredPatients
                  .map((p) => ({
                    PatientID: p.patient_id,
                    Name: p.full_name,
                    Age: p.age,
                    Gender: p.gender,
                    BloodType: p.blood_type,
                    NeededOrgan: p.organ_needed,
                    Urgency: p.urgency_level,
                    Phone: p.contact_phone,
                    Email: p.contact_email,
                    Verified: p.signature_verified ? "Yes" : "No",
                    Registered: new Date(p.registration_date)
                      .toISOString()
                      .slice(0, 10),
                    TxHash: p.blockchain_tx_hash || "",
                  }))
                  .filter((r) => {
                    if (
                      exportFrom &&
                      new Date(r.Registered) < new Date(exportFrom)
                    )
                      return false;
                    if (exportTo && new Date(r.Registered) > new Date(exportTo))
                      return false;
                    return true;
                  });
                if (!rows.length) {
                  setExportOpen(false);
                  return;
                }
                if (exportFormat === "pdf") {
                  const jsPDF = (await import("jspdf")).default;
                  const autoTable = (await import("jspdf-autotable"))
                    .default as any;
                  const doc = new jsPDF({ orientation: "landscape" });
                  const cols = Object.keys(rows[0]);
                  doc.text("Patient Report", 14, 14);
                  autoTable(doc, {
                    head: [cols],
                    body: rows.map((r) => cols.map((c) => (r as any)[c])),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [22, 163, 74] },
                    startY: 20,
                    theme: "grid",
                  });
                  doc.save(`patients_${Date.now()}.pdf`);
                } else {
                  const XLSX = (await import("xlsx")).default as any;
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Patients");
                  XLSX.writeFile(wb, `patients_${Date.now()}.xlsx`);
                }
                setExportOpen(false);
              }}
            >
              Export {exportFormat === "pdf" ? "PDF" : "Excel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HospitalLayout>
  );
}
