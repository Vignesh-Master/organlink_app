import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import { Database } from "lucide-react";

interface IPFSLog {
  id: string;
  hash: string;
  file_type: string;
  upload_date: string;
  size_mb: number;
  status: string;
  uploaded_by: string;
}

export default function IPFSLogs() {
  const [logs, setLogs] = useState<IPFSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const columns = [
    {
      key: "file_hash",
      label: "File Hash",
      render: (_, row: IPFSLog) => (
        <div>
          <div className="font-mono text-sm text-gray-900">{row.hash}</div>
          <div className="text-xs text-gray-500">IPFS Hash</div>
        </div>
      ),
    },
    {
      key: "file_type",
      label: "File Type",
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge
          className={
            value === "active"
              ? "bg-green-100 text-green-800"
              : value === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "size_mb",
      label: "Size",
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value} MB</span>
      ),
    },
    {
      key: "uploaded_by",
      label: "Uploaded By",
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: "upload_date",
      label: "Date",
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filters = [
    {
      key: "fileType",
      label: "File Type",
      options: [
        { value: "signature", label: "Signature" },
        { value: "document", label: "Document" },
        { value: "certificate", label: "Certificate" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
      ],
    },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (
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

      const response = await fetch(`/api/admin/logs/ipfs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch IPFS logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="IPFS File Logs"
      subtitle="View and monitor all IPFS file storage"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-medical-600" />
          <span className="text-lg font-medium">
            File Logs ({pagination.total})
          </span>
        </div>

        <DataTable
          data={logs}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search logs..."
          onFilterChange={(filters) => fetchLogs(filters, undefined, 1)}
          onSearchChange={(search) => fetchLogs(undefined, search, 1)}
          pagination={{
            ...pagination,
            onPageChange: (page) => fetchLogs(undefined, undefined, page),
          }}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}
