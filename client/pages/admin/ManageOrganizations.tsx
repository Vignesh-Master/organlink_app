import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import EditOrganizationModal from "@/components/admin/EditOrganizationModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ToastContainer from "@/components/admin/ToastContainer";
import { useToast } from "@/contexts/ToastContext";
import { Plus, Users, Edit, Trash2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  country: string;
  type: string;
  email: string;
  phone: string;
  website: string;
  status: string;
  last_activity: string;
  created_at: string;
}

export default function ManageOrganizations() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingOrganization, setDeletingOrganization] =
    useState<Organization | null>(null);
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
      key: "organization_info",
      label: "Organization",
      render: (_, row: Organization) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.type}</div>
        </div>
      ),
    },
    {
      key: "country",
      label: "Country",
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: "quality",
      label: "Quality",
      render: () => (
        <Badge className="bg-green-100 text-green-800">Excellent</Badge>
      ),
    },
    {
      key: "roles",
      label: "Roles",
      render: () => <Badge variant="outline">Policy Maker</Badge>,
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
      key: "type",
      label: "Type",
      options: [
        { value: "foundation", label: "Foundation" },
        { value: "government", label: "Government" },
        { value: "nonprofit", label: "Non-Profit" },
        { value: "research", label: "Research Institute" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (organization: Organization) => {
    setDeletingOrganization(organization);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrganization) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/organizations/${deletingOrganization.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setOrganizations((prev) =>
          prev.filter((o) => o.id !== deletingOrganization.id),
        );
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        success(
          "Organization deleted successfully",
          `${deletingOrganization.name} has been removed from the system.`,
        );
        setIsDeleteModalOpen(false);
        setDeletingOrganization(null);
      } else {
        error(
          "Failed to delete organization",
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

  const handleUpdate = (updatedOrganization: Organization) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === updatedOrganization.id ? updatedOrganization : o,
      ),
    );
    success(
      "Organization updated successfully",
      `${updatedOrganization.name} information has been updated.`,
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
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async (
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

      const response = await fetch(`/api/admin/organizations?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Manage Organizations"
      subtitle="View and manage all registered organizations"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-medical-600" />
            <span className="text-lg font-medium">
              Organizations ({pagination.total})
            </span>
          </div>
          <Button onClick={() => navigate("/admin/organizations/register")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>

        <DataTable
          data={organizations}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search organizations..."
          onFilterChange={(filters) =>
            fetchOrganizations(filters, undefined, 1)
          }
          onSearchChange={(search) => fetchOrganizations(undefined, search, 1)}
          actions={actions}
          pagination={{
            ...pagination,
            onPageChange: (page) =>
              fetchOrganizations(undefined, undefined, page),
          }}
          loading={loading}
        />

        <EditOrganizationModal
          organization={editingOrganization}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingOrganization(null);
          }}
          onUpdate={handleUpdate}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingOrganization(null);
          }}
          onConfirm={handleDeleteConfirm}
          title={`Delete ${deletingOrganization?.name || "Organization"}`}
          description={`Are you sure you want to delete "${deletingOrganization?.name}"? This will permanently remove the organization and all associated data from the system.`}
          isLoading={isDeleting}
        />

        <ToastContainer />
      </div>
    </AdminLayout>
  );
}
