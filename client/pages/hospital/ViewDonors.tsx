import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  Eye,
  ExternalLink,
  UserCheck,
  Trash2,
  Download,
  Pencil,
} from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useToast } from "@/contexts/ToastContext";
import HospitalLayout from "@/components/hospital/HospitalLayout";
import EditDonorModal from "@/components/hospital/EditDonorModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Donor {
  id: number;
  donor_id: string;
  hospital_id: string;
  full_name: string;
  age: number;
  gender: string;
  blood_type: string;
  organs_to_donate: string[];
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
  created_at: string;
  updated_at: string;
}

export default function ViewDonors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrgan, setFilterOrgan] = useState("all");
  const [filterBloodType, setFilterBloodType] = useState("all");
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewDonor, setViewDonor] = useState<Donor | null>(null);
  const [deletingDonor, setDeletingDonor] = useState<string | null>(null);
  const [confirmDeleteDonor, setConfirmDeleteDonor] = useState<Donor | null>(
    null,
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    DonorID: true,
    Name: true,
    Age: true,
    Gender: true,
    BloodType: true,
    Organs: true,
    Phone: true,
    Email: true,
    Status: true,
    Registered: true,
    Verified: true,
    TxHash: true,
  });
  const [exportFrom, setExportFrom] = useState<string>("");
  const [exportTo, setExportTo] = useState<string>("");

  const { hospital } = useHospitalAuth();
  const { error: showError, success: showSuccess } = useToast();

  const buildExportRows = (rows: Donor[]) =>
    rows.map((d) => ({
      DonorID: d.donor_id,
      Name: d.full_name,
      Age: d.age,
      Gender: d.gender,
      BloodType: d.blood_type,
      Organs: d.organs_to_donate.join(", "),
      Phone: d.contact_phone,
      Email: d.contact_email,
      Status: d.is_active ? "ACTIVE" : "INACTIVE",
      Registered: new Date(d.registration_date).toISOString().slice(0, 10),
      Verified: d.signature_verified ? "Yes" : "No",
      TxHash: d.blockchain_tx_hash || "",
    }));

  const exportCSV = () => {
    const rows = buildExportRows(filteredDonors);
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [
      header,
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donors_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const data = buildExportRows(filteredDonors);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Donors");
    XLSX.writeFile(wb, `donors_${Date.now()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Donor Report", 14, 14);
    const rows = buildExportRows(filteredDonors);
    const columns = Object.keys(rows[0] || {});
    autoTable(doc, {
      head: [columns],
      body: rows.map((r) => columns.map((c) => (r as any)[c])),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
      startY: 20,
      theme: "grid",
    });
    doc.save(`donors_${Date.now()}.pdf`);
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    filterDonors();
  }, [donors, searchTerm, filterOrgan, filterBloodType]);

  const fetchDonors = async () => {
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/donors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDonors(data.donors);
      } else {
        showError("Failed to load donors");
      }
    } catch (error) {
      console.error("Failed to fetch donors:", error);
      showError("Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  const filterDonors = () => {
    let filtered = donors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (donor) =>
          donor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donor.donor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donor.contact_email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Organ filter
    if (filterOrgan && filterOrgan !== "all") {
      filtered = filtered.filter((donor) =>
        donor.organs_to_donate.includes(filterOrgan),
      );
    }

    // Blood type filter
    if (filterBloodType && filterBloodType !== "all") {
      filtered = filtered.filter(
        (donor) => donor.blood_type === filterBloodType,
      );
    }

    setFilteredDonors(filtered);
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
    "Skin",
    "Bone",
  ];
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleEditDonor = (donor: Donor) => {
    setEditingDonor(donor);
    setIsEditModalOpen(true);
  };

  const handleDonorUpdate = (updatedDonor: Donor) => {
    setDonors((prev) =>
      prev.map((d) =>
        d.donor_id === updatedDonor.donor_id ? updatedDonor : d,
      ),
    );
    setFilteredDonors((prev) =>
      prev.map((d) =>
        d.donor_id === updatedDonor.donor_id ? updatedDonor : d,
      ),
    );
  };

  const openDeleteConfirm = (donor: Donor) => {
    setConfirmDeleteDonor(donor);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteDonor) return;
    await handleDeleteDonor(confirmDeleteDonor.donor_id);
    setConfirmDeleteDonor(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDonor(null);
  };

  const handleDeleteDonor = async (donorId: string) => {
    setDeletingDonor(donorId);
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch(`/api/hospital/donors/${donorId}`, {
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
        showSuccess("Donor deleted successfully!");
        // Remove from local state
        setDonors((prev) => prev.filter((d) => d.donor_id !== donorId));
        setFilteredDonors((prev) => prev.filter((d) => d.donor_id !== donorId));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Failed to delete donor");
    } finally {
      setDeletingDonor(null);
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
      title="Donor Management"
      subtitle="View and manage registered donors"
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
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Link to="/hospital/donors/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-medical-600 hover:bg-medical-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Register New Donor
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
                  <p className="text-sm text-gray-600">Total Donors</p>
                  <p className="text-2xl font-bold">{donors.length}</p>
                </div>
                <Heart className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Donors</p>
                  <p className="text-2xl font-bold">
                    {donors.filter((d) => d.is_active).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold">
                    {donors.filter((d) => d.signature_verified).length}
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
                  <p className="text-sm text-gray-600">Total Organs</p>
                  <p className="text-2xl font-bold">
                    {donors.reduce(
                      (total, donor) => total + donor.organs_to_donate.length,
                      0,
                    )}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search donors..."
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
                  setFilterBloodType("all");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Donors List */}
        <div className="space-y-4">
          {filteredDonors.length > 0 ? (
            filteredDonors.map((donor) => (
              <Card
                key={donor.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {donor.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {donor.donor_id} • Age: {donor.age} •{" "}
                            {donor.gender}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{donor.blood_type}</Badge>
                          {donor.signature_verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {donor.is_active && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Organs to Donate:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {donor.organs_to_donate.map((organ) => (
                            <Badge
                              key={organ}
                              className="bg-red-100 text-red-800"
                            >
                              <Heart className="h-3 w-3 mr-1" />
                              {organ}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {donor.contact_phone}
                        </div>
                        {donor.contact_email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {donor.contact_email}
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Registered: {formatDate(donor.registration_date)}
                        </div>
                      </div>

                      {donor.medical_history && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <strong>Medical History:</strong>{" "}
                            {donor.medical_history}
                          </p>
                        </div>
                      )}

                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Emergency Contact:</strong>{" "}
                          {donor.emergency_contact} - {donor.emergency_phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 md:space-y-2 md:ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewDonor(donor)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDonor(donor)}
                        title="Edit donor"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteConfirm(donor)}
                        disabled={deletingDonor === donor.donor_id}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        title="Delete donor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      {donor.blockchain_tx_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            !(
                              donor.blockchain_tx_hash.startsWith("0x") &&
                              donor.blockchain_tx_hash.length === 66
                            )
                          }
                          onClick={() => {
                            if (
                              donor.blockchain_tx_hash.startsWith("0x") &&
                              donor.blockchain_tx_hash.length === 66
                            ) {
                              window.open(
                                `https://sepolia.etherscan.io/tx/${donor.blockchain_tx_hash}`,
                                "_blank",
                              );
                            }
                          }}
                          title={
                            donor.blockchain_tx_hash.startsWith("0x")
                              ? "View on Etherscan"
                              : "Demo TX (not on-chain)"
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
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
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Donors Found
                </h3>
                <p className="text-gray-600 mb-6">
                  {donors.length === 0
                    ? "No donors have been registered yet."
                    : "No donors match your current filter criteria."}
                </p>
                <Link to="/hospital/donors/register">
                  <Button className="bg-medical-600 hover:bg-medical-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Register First Donor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditDonorModal
        donor={editingDonor}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleDonorUpdate}
      />

      {viewDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Donor Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDonor(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">
                  Personal Information
                </p>
                <p className="text-gray-600 mt-1">{viewDonor.full_name}</p>
                <p className="text-gray-600">
                  {viewDonor.age} years • {viewDonor.gender}
                </p>
                <p className="text-gray-600">
                  Blood Type: {viewDonor.blood_type}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Contact</p>
                <p className="text-gray-600 mt-1">{viewDonor.contact_phone}</p>
                {viewDonor.contact_email && (
                  <p className="text-gray-600">{viewDonor.contact_email}</p>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-700">Organs</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewDonor.organs_to_donate.map((o) => (
                    <Badge key={o} className="bg-red-100 text-red-800">
                      {o}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700">Blockchain</p>
                {viewDonor.blockchain_tx_hash &&
                viewDonor.blockchain_tx_hash.startsWith("0x") ? (
                  <a
                    className="text-medical-600 underline"
                    target="_blank"
                    href={`https://sepolia.etherscan.io/tx/${viewDonor.blockchain_tx_hash}`}
                  >
                    View on Etherscan
                  </a>
                ) : (
                  <p className="text-gray-600">
                    {viewDonor.blockchain_tx_hash
                      ? "Demo TX (not on-chain)"
                      : "Not registered"}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {viewDonor.signature_ipfs_hash && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://gateway.pinata.cloud/ipfs/${viewDonor.signature_ipfs_hash}`,
                      "_blank",
                    )
                  }
                >
                  View Document
                </Button>
              )}
              <Button
                onClick={() => {
                  setViewDonor(null);
                  handleEditDonor(viewDonor);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDeleteDonor}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete donor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The donor record "
              {confirmDeleteDonor?.full_name}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteDonor(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Export Donor Data</DialogTitle>
            <DialogDescription>
              Choose your export format and customize the data to include
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Export Format</p>
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  className={`px-4 py-2 text-sm ${exportFormat === "pdf" ? "bg-medical-600 text-white" : "bg-white"} `}
                  onClick={() => setExportFormat("pdf")}
                >
                  PDF
                </button>
                <button
                  className={`px-4 py-2 text-sm border-l ${exportFormat === "excel" ? "bg-medical-600 text-white" : "bg-white"} `}
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
            <div>
              <p className="text-sm font-medium mb-2">Columns to Include</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto pr-2">
                {Object.keys(exportColumns).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exportColumns[key]}
                      onChange={(e) =>
                        setExportColumns((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    {key}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const colKeys = Object.keys(exportColumns).filter(
                  (k) => exportColumns[k],
                );
                const rows = buildExportRows(filteredDonors)
                  .filter((r) => {
                    if (
                      exportFrom &&
                      new Date(r.Registered) < new Date(exportFrom)
                    )
                      return false;
                    if (exportTo && new Date(r.Registered) > new Date(exportTo))
                      return false;
                    return true;
                  })
                  .map((r) => {
                    const obj: Record<string, any> = {};
                    colKeys.forEach((k) => (obj[k] = (r as any)[k]));
                    return obj;
                  });
                if (!rows.length) {
                  setExportOpen(false);
                  return;
                }
                if (exportFormat === "pdf") {
                  const doc = new jsPDF({ orientation: "landscape" });
                  doc.text("Donor Report", 14, 14);
                  autoTable(doc, {
                    head: [colKeys],
                    body: rows.map((r) => colKeys.map((c) => (r as any)[c])),
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [22, 163, 74] },
                    startY: 20,
                    theme: "grid",
                  });
                  doc.save(`donors_${Date.now()}.pdf`);
                } else {
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Donors");
                  XLSX.writeFile(wb, `donors_${Date.now()}.xlsx`);
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
