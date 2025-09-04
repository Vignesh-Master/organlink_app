import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  History,
  Vote,
  FileText,
  Calendar,
  Filter,
  Download,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";

interface HistoryItem {
  id: string;
  type: "vote" | "proposal" | "finalized";
  title: string;
  description: string;
  date: string;
  status: string;
  proposalId?: string;
  vote?: "For" | "Against" | "Abstain";
  outcome?: "Passed" | "Failed" | "Pending";
  etherscanUrl?: string;
  ipfsUrl?: string;
  metadata?: {
    totalVotes?: number;
    forVotes?: number;
    againstVotes?: number;
    abstainVotes?: number;
  };
}

interface HistoryStats {
  totalActivities: number;
  proposalsCreated: number;
  votesParticipated: number;
  successfulProposals: number;
  participationRate: number;
  averageResponseTime: number;
}

export default function OrganizationHistory() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalActivities: 0,
    proposalsCreated: 0,
    votesParticipated: 0,
    successfulProposals: 0,
    participationRate: 0,
    averageResponseTime: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    loadHistoryData();
  }, [timeRange, filterType, filterStatus]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);

      // Mock data - in real implementation, fetch from API
      const mockHistory: HistoryItem[] = [
        {
          id: "1",
          type: "proposal",
          title: "Pediatric Kidney Transplant Priority Policy",
          description:
            "Proposed new policy to prioritize kidney allocation for patients under 18 years old",
          date: "2024-01-22T10:30:00Z",
          status: "created",
          proposalId: "PROP-001",
          outcome: "Passed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0x123...",
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest123",
          metadata: {
            totalVotes: 11,
            forVotes: 7,
            againstVotes: 3,
            abstainVotes: 1,
          },
        },
        {
          id: "2",
          type: "vote",
          title: "Geographic Proximity Preference Policy",
          description:
            "Voted 'For' on policy to prioritize local organ allocation",
          date: "2024-01-21T15:45:00Z",
          status: "voted",
          proposalId: "PROP-002",
          vote: "For",
          outcome: "Passed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0x456...",
        },
        {
          id: "3",
          type: "finalized",
          title: "AI Matching Enhancement Policy",
          description: "Policy to enhance AI matching algorithms was finalized",
          date: "2024-01-20T09:15:00Z",
          status: "finalized",
          proposalId: "PROP-003",
          outcome: "Failed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0x789...",
          metadata: {
            totalVotes: 10,
            forVotes: 3,
            againstVotes: 7,
            abstainVotes: 0,
          },
        },
        {
          id: "4",
          type: "vote",
          title: "Emergency Protocol Update",
          description:
            "Voted 'For' on emergency organ allocation protocol update",
          date: "2024-01-19T14:22:00Z",
          status: "voted",
          proposalId: "PROP-004",
          vote: "For",
          outcome: "Passed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0xabc...",
        },
        {
          id: "5",
          type: "proposal",
          title: "Cross-Border Allocation Framework",
          description:
            "Proposed framework for international organ sharing agreements",
          date: "2024-01-18T11:30:00Z",
          status: "created",
          proposalId: "PROP-005",
          outcome: "Pending",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0xdef...",
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest456",
        },
        {
          id: "6",
          type: "vote",
          title: "Donor Consent Verification Protocol",
          description:
            "Voted 'Against' on enhanced donor consent verification requirements",
          date: "2024-01-17T16:10:00Z",
          status: "voted",
          proposalId: "PROP-006",
          vote: "Against",
          outcome: "Failed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0xghi...",
        },
        {
          id: "7",
          type: "finalized",
          title: "HLA Matching Standards Update",
          description: "Updated HLA matching standards were finalized",
          date: "2024-01-16T13:45:00Z",
          status: "finalized",
          proposalId: "PROP-007",
          outcome: "Passed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0xjkl...",
          metadata: {
            totalVotes: 12,
            forVotes: 9,
            againstVotes: 2,
            abstainVotes: 1,
          },
        },
        {
          id: "8",
          type: "proposal",
          title: "Blockchain Verification Requirements",
          description:
            "Proposed mandatory blockchain verification for all organ documents",
          date: "2024-01-15T09:20:00Z",
          status: "created",
          proposalId: "PROP-008",
          outcome: "Passed",
          etherscanUrl: "https://sepolia.etherscan.io/tx/0xmno...",
          ipfsUrl: "https://gateway.pinata.cloud/ipfs/QmTest789",
          metadata: {
            totalVotes: 11,
            forVotes: 8,
            againstVotes: 2,
            abstainVotes: 1,
          },
        },
      ];

      // Mock stats
      const mockStats: HistoryStats = {
        totalActivities: mockHistory.length,
        proposalsCreated: mockHistory.filter((h) => h.type === "proposal")
          .length,
        votesParticipated: mockHistory.filter((h) => h.type === "vote").length,
        successfulProposals: mockHistory.filter(
          (h) => h.type === "proposal" && h.outcome === "Passed",
        ).length,
        participationRate: 87.5,
        averageResponseTime: 18.5,
      };

      setHistoryItems(mockHistory);
      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load history data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "proposal":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "vote":
        return <Vote className="h-4 w-4 text-green-600" />;
      case "finalized":
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (item: HistoryItem) => {
    if (item.type === "vote") {
      const voteColors = {
        For: "bg-green-100 text-green-800",
        Against: "bg-red-100 text-red-800",
        Abstain: "bg-gray-100 text-gray-800",
      };
      return (
        <Badge
          className={voteColors[item.vote as keyof typeof voteColors] || ""}
        >
          {item.vote}
        </Badge>
      );
    }

    if (item.outcome) {
      const outcomeColors = {
        Passed: "bg-green-100 text-green-800",
        Failed: "bg-red-100 text-red-800",
        Pending: "bg-yellow-100 text-yellow-800",
      };
      return (
        <Badge
          className={
            outcomeColors[item.outcome as keyof typeof outcomeColors] || ""
          }
        >
          {item.outcome}
        </Badge>
      );
    }

    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const exportHistory = () => {
    const csvData = [
      ["Date", "Type", "Title", "Status", "Outcome", "Proposal ID"],
      ...filteredItems.map((item) => [
        formatDate(item.date),
        item.type,
        item.title,
        item.status,
        item.outcome || "",
        item.proposalId || "",
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organlink_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <OrganizationLayout title="History">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout
      title="Organization History"
      subtitle="Complete record of your organization's policy governance activities"
    >
      <div className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Total Activities
                </span>
                <History className="h-4 w-4 text-medical-600" />
              </div>
              <span className="text-2xl font-bold">
                {stats.totalActivities}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Proposals Created
                </span>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {stats.proposalsCreated}
                </span>
                <span className="text-sm text-gray-500">
                  {stats.successfulProposals} passed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Votes Cast
                </span>
                <Vote className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {stats.votesParticipated}
                </span>
                <span className="text-sm text-gray-500">
                  {stats.participationRate}% rate
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Avg Response
                </span>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {stats.averageResponseTime}h
                </span>
                <span className="text-sm text-gray-500">response time</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="proposal">Proposals</SelectItem>
                  <SelectItem value="vote">Votes</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="voted">Voted</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Showing {filteredItems.length} of {historyItems.length}{" "}
                activities
              </span>
              <Button variant="outline" size="sm" onClick={exportHistory}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  No activities found matching your filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {item.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.date)}
                              </span>
                              {item.proposalId && (
                                <span>ID: {item.proposalId}</span>
                              )}
                              <span className="capitalize">{item.type}</span>
                            </div>

                            {/* Vote breakdown for finalized proposals */}
                            {item.metadata && (
                              <div className="mt-2 flex items-center gap-4 text-xs">
                                <span className="text-green-600">
                                  For: {item.metadata.forVotes}
                                </span>
                                <span className="text-red-600">
                                  Against: {item.metadata.againstVotes}
                                </span>
                                <span className="text-gray-600">
                                  Abstain: {item.metadata.abstainVotes}
                                </span>
                                <span className="text-gray-500">
                                  Total: {item.metadata.totalVotes}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(item.date)}
                            </span>
                            {getStatusBadge(item)}
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="flex items-center gap-2 mt-3">
                          {item.etherscanUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={item.etherscanUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Etherscan
                              </a>
                            </Button>
                          )}
                          {item.ipfsUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={item.ipfsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Document
                              </a>
                            </Button>
                          )}
                          {item.proposalId && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {index < filteredItems.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">Proposal Success Rate</h4>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.proposalsCreated > 0
                    ? Math.round(
                        (stats.successfulProposals / stats.proposalsCreated) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <p className="text-sm text-gray-600">
                  {stats.successfulProposals} of {stats.proposalsCreated}{" "}
                  proposals passed
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Voting Participation</h4>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.participationRate}%
                </div>
                <p className="text-sm text-gray-600">
                  Participated in {stats.votesParticipated} voting processes
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Response Efficiency</h4>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {stats.averageResponseTime}h
                </div>
                <p className="text-sm text-gray-600">
                  Average time to respond to proposals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
