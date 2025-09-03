import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import EditHospitalModal from "@/components/admin/EditHospitalModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ToastContainer from "@/components/admin/ToastContainer";
import { useToast } from "@/contexts/ToastContext";
import { Plus, Building2, Edit, Trash2 } from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  country: string;
  city: string;
  hospital_id: string;
  email: string;
  phone: string;
  capacity: number;
  specializations: string[];
  status: string;
  last_activity: string;
  created_at: string;
}

export default function ManageHospitals() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingHospital, setDeletingHospital] = useState<Hospital | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const columns = [
    {
      key: "hospital_info",
      label: "Hospital Info",
      render: (_, row: Hospital) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.hospital_id}</div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (_, row: Hospital) => (
        <div>
          <div className="text-sm text-gray-900">{row.city}</div>
          <div className="text-sm text-gray-500">{row.country}</div>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (_, row: Hospital) => (
        <div>
          <div className="text-sm text-gray-900">{row.email}</div>
          <div className="text-sm text-gray-500">{row.phone}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge
          className={
            value === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "capacity",
      label: "Capacity",
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value || "N/A"}</span>
      ),
    },
    {
      key: "specializations",
      label: "Specializations",
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value && value.length > 0 ? (
            value.slice(0, 2).map((spec, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {spec}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-500">None</span>
          )}
          {value && value.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "last_activity",
      label: "Last Activity",
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : "Never"}
        </span>
      ),
    },
  ];

  const filters = [
    {
      key: "country",
      label: "Country",
      options: [
        { value: "usa", label: "United States" },
        { value: "canada", label: "Canada" },
        { value: "uk", label: "United Kingdom" },
        { value: "india", label: "India" },
        { value: "australia", label: "Australia" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "pending", label: "Pending" },
      ],
    },
  ];

  const handleEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (hospital: Hospital) => {
    setDeletingHospital(hospital);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHospital) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/hospitals/${deletingHospital.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setHospitals((prev) =>
          prev.filter((h) => h.id !== deletingHospital.id),
        );
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        success(
          "Hospital deleted successfully",
          `${deletingHospital.name} has been removed from the system.`,
        );
        setIsDeleteModalOpen(false);
        setDeletingHospital(null);
      } else {
        error(
          "Failed to delete hospital",
          "Please try again or contact support.",
        );
      }
    } catch (err) {
      console.error("Delete error:", err);
      error("Network error", "Please check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (updatedHospital: Hospital) => {
    setHospitals((prev) =>
      prev.map((h) => (h.id === updatedHospital.id ? updatedHospital : h)),
    );
    success(
      "Hospital updated successfully",
      `${updatedHospital.name} information has been updated.`,
    );
  };

  const actions = [
    {
      label: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
      variant: "outline" as const,
    },
    {
      label: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteClick,
      variant: "destructive" as const,
    },
  ];

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async (
    filters?: Record<string, string>,
    search?: string,
    page = 1,
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...filters,
      });

      const response = await fetch(`/api/admin/hospitals?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHospitals(data.hospitals);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch hospitals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    fetchHospitals(filters, undefined, 1);
  };

  const handleSearchChange = (search: string) => {
    fetchHospitals(undefined, search, 1);
  };

  const handlePageChange = (page: number) => {
    fetchHospitals(undefined, undefined, page);
  };

  return (
    <AdminLayout
      title="Manage Hospitals"
      subtitle="View and manage all registered hospitals"
    >
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-medical-600" />
            <span className="text-lg font-medium">
              Hospitals ({pagination.total})
            </span>
          </div>
          <Button onClick={() => navigate("/admin/hospitals/register")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hospital
          </Button>
        </div>

        {/* Hospitals Table */}
        <DataTable
          data={hospitals}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search hospitals..."
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          actions={actions}
          pagination={{
            ...pagination,
            onPageChange: handlePageChange,
          }}
          loading={loading}
        />

        <EditHospitalModal
          hospital={editingHospital}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingHospital(null);
          }}
          onUpdate={handleUpdate}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingHospital(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={`Delete ${deletingHospital?.name || "Hospital"}`}
          description={`Are you sure you want to delete "${deletingHospital?.name}"? This will permanently remove the hospital and all associated data from the system.`}
          isLoading={isDeleting}
        />

        <ToastContainer />
      </div>
    </AdminLayout>
  );
}
