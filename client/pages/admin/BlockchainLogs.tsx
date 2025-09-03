import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable from "@/components/admin/DataTable";
import { Blocks } from "lucide-react";

interface BlockchainEvent {
  id: string;
  event_type: string;
  transaction_hash: string;
  block_number: number;
  gas_used: number;
  gas_fee: number;
  status: string;
  created_at: string;
}

export default function BlockchainLogs() {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const columns = [
    {
      key: "event_type",
      label: "Event Type",
      render: (value: string) => (
        <Badge
          className={
            value === "DonorRegistered" || value === "PatientRegistered"
              ? "bg-blue-100 text-blue-800"
              : value === "PolicyProposed"
                ? "bg-purple-100 text-purple-800"
                : value === "MatchFound"
                  ? "bg-green-100 text-green-800"
                  : value === "TransplantCompleted"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "transaction_hash",
      label: "Transaction Hash",
      render: (value: string) => (
        <div>
          <div className="font-mono text-sm text-gray-900">
            {value.slice(0, 20)}...
          </div>
          <div className="text-xs text-gray-500">Ethereum Sepolia</div>
        </div>
      ),
    },
    {
      key: "block_number",
      label: "Block",
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value.toLocaleString()}</span>
      ),
    },
    {
      key: "gas_info",
      label: "Gas Info",
      render: (_, row: BlockchainEvent) => (
        <div>
          <div className="text-sm text-gray-900">
            {row.gas_used.toLocaleString()} units
          </div>
          <div className="text-xs text-gray-500">{row.gas_fee} ETH</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge
          className={
            value === "confirmed"
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
      key: "created_at",
      label: "Timestamp",
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleString()}
        </span>
      ),
    },
  ];

  const filters = [
    {
      key: "eventType",
      label: "Event Type",
      options: [
        { value: "DonorRegistered", label: "Donor Registered" },
        { value: "PatientRegistered", label: "Patient Registered" },
        { value: "PolicyProposed", label: "Policy Proposed" },
        { value: "MatchFound", label: "Match Found" },
        { value: "TransplantCompleted", label: "Transplant Completed" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "confirmed", label: "Confirmed" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
      ],
    },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async (
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

      const response = await fetch(`/api/admin/logs/blockchain?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch blockchain events:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Blockchain Event Logs"
      subtitle="View and monitor all blockchain transactions and smart contract events"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Blocks className="h-5 w-5 text-medical-600" />
          <span className="text-lg font-medium">
            Blockchain Events ({pagination.total})
          </span>
        </div>

        <DataTable
          data={events}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search events..."
          onFilterChange={(filters) => fetchEvents(filters, undefined, 1)}
          onSearchChange={(search) => fetchEvents(undefined, search, 1)}
          pagination={{
            ...pagination,
            onPageChange: (page) => fetchEvents(undefined, undefined, page),
          }}
          loading={loading}
        />
      </div>
    </AdminLayout>
  );
}
