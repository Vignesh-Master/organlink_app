import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import { FileText } from "lucide-react";

interface Policy {
  id: string;
  title: string;
  category: string;
  status: string;
  created_date: string;
  votes_for: number;
  votes_against: number;
  proposer_name: string;
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const columns = [
    {
      key: "title",
      label: "Policy",
      render: (_, row: Policy) => (
        <div>
          <div className="font-medium text-gray-900">{row.title}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge
          className={
            value === "approved"
              ? "bg-green-100 text-green-800"
              : value === "voting"
                ? "bg-blue-100 text-blue-800"
                : value === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "votes",
      label: "Voting",
      render: (_, row: Policy) => (
        <div className="text-sm">
          <div className="text-green-600">For: {row.votes_for}</div>
          <div className="text-red-600">Against: {row.votes_against}</div>
        </div>
      ),
    },
    {
      key: "proposer_name",
      label: "Proposer",
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value || "Unknown"}</span>
      ),
    },
    {
      key: "created_date",
      label: "Created",
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filters = [
    {
      key: "category",
      label: "Category",
      options: [
        { value: "organ-rules", label: "Organ Rules" },
        { value: "technical", label: "Technical" },
        { value: "international", label: "International" },
        { value: "emergency", label: "Emergency" },
        { value: "legal", label: "Legal" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "approved", label: "Approved" },
        { value: "voting", label: "Voting" },
        { value: "rejected", label: "Rejected" },
        { value: "draft", label: "Draft" },
      ],
    },
  ];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async (
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

      const response = await fetch(`/api/admin/logs/policies?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Policy Overview"
      subtitle="Monitor and manage all organizational policies and voting status"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-medical-600" />
          <span className="text-lg font-medium">
            Policies ({pagination.total})
          </span>
        </div>

        <DataTable
          data={policies}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search policies..."
          onFilterChange={(filters) => fetchPolicies(filters, undefined, 1)}
          onSearchChange={(search) => fetchPolicies(undefined, search, 1)}
          pagination={{
            ...pagination,
            onPageChange: (page) => fetchPolicies(undefined, undefined, page),
          }}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}
