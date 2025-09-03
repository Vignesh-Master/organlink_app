import Layout from "@/components/shared/Layout";
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
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface Policy {
  id: number;
  proposal_id?: number;
  title: string;
  description: string;
  category: string;
  status: string;
  proposer_org_id: number;
  votes_for: number;
  votes_against: number;
  votes_abstain?: number;
  created_at: string;
  updated_at?: string;
  // Additional mock data for better UI
  eligible_count?: number;
  end_time?: string;
  ipfs_cid?: string;
}

interface FilterState {
  search: string;
  status: string;
  category: string;
  sortBy: string;
}

export default function PoliciesList() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    category: "all",
    sortBy: "newest",
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [policies, filters]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("organization_token");

      // Fetch from multiple sources to get comprehensive data
      const [dbPolicies, adminPolicies] = await Promise.all([
        // Fetch from organization policies endpoint
        fetch("/api/organization/policies", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => ({ ok: false, json: () => ({ policies: [] }) })),

        // Fetch from admin logs for additional policies
        fetch("/api/admin/logs/policies?page=1&limit=50", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => ({ ok: false, json: () => ({ policies: [] }) })),
      ]);

      let allPolicies: Policy[] = [];

      if (dbPolicies.ok) {
        const dbData = await dbPolicies.json();
        allPolicies = [...allPolicies, ...(dbData.policies || [])];
      }

      if (adminPolicies.ok) {
        const adminData = await adminPolicies.json();
        allPolicies = [...allPolicies, ...(adminData.policies || [])];
      }

      // Add some mock data for better demonstration
      const mockPolicies: Policy[] = [
        {
          id: 1,
          proposal_id: 1,
          title: "Pediatric Priority Allocation Policy",
          description:
            "Establishes priority criteria for pediatric patients in organ allocation",
          category: "medical",
          status: "approved",
          proposer_org_id: 1,
          votes_for: 8,
          votes_against: 2,
          votes_abstain: 1,
          eligible_count: 11,
          created_at: "2024-01-15T10:00:00Z",
          end_time: "2024-01-20T10:00:00Z",
          ipfs_cid: "QmPediatricPolicy123",
        },
        {
          id: 2,
          proposal_id: 2,
          title: "Geographic Proximity Preference",
          description:
            "Prioritizes local recipients when medical factors are equivalent",
          category: "logistics",
          status: "voting",
          proposer_org_id: 2,
          votes_for: 5,
          votes_against: 3,
          votes_abstain: 0,
          eligible_count: 10,
          created_at: "2024-01-20T14:30:00Z",
          end_time: "2024-01-25T14:30:00Z",
          ipfs_cid: "QmGeographicPolicy456",
        },
        {
          id: 3,
          proposal_id: 3,
          title: "AI Matching Algorithm Enhancement",
          description:
            "Updates compatibility scoring algorithm with latest medical research",
          category: "technology",
          status: "rejected",
          proposer_org_id: 3,
          votes_for: 3,
          votes_against: 7,
          votes_abstain: 2,
          eligible_count: 12,
          created_at: "2024-01-10T09:15:00Z",
          end_time: "2024-01-15T09:15:00Z",
          ipfs_cid: "QmAIPolicy789",
        },
      ];

      // Merge and deduplicate
      const combinedPolicies = [...mockPolicies, ...allPolicies];
      const uniquePolicies = combinedPolicies.filter(
        (policy, index, self) =>
          index === self.findIndex((p) => p.id === policy.id),
      );

      setPolicies(uniquePolicies);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...policies];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (policy) =>
          policy.title.toLowerCase().includes(searchLower) ||
          policy.description.toLowerCase().includes(searchLower),
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((policy) => policy.status === filters.status);
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(
        (policy) => policy.category === filters.category,
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "votes":
          return (
            b.votes_for + b.votes_against - (a.votes_for + a.votes_against)
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredPolicies(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "voting":
        return (
          <Badge className="bg-blue-100 text-blue-800">Active Voting</Badge>
        );
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medical":
        return <FileText className="h-4 w-4" />;
      case "technology":
        return <TrendingUp className="h-4 w-4" />;
      case "logistics":
        return <Users className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateApprovalRate = (policy: Policy) => {
    const total = policy.votes_for + policy.votes_against;
    if (total === 0) return 0;
    return Math.round((policy.votes_for / total) * 100);
  };

  const isVotingActive = (policy: Policy) => {
    if (policy.status !== "voting" || !policy.end_time) return false;
    return new Date(policy.end_time) > new Date();
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return "Ended";

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const stats = {
    total: policies.length,
    approved: policies.filter((p) => p.status === "approved").length,
    voting: policies.filter((p) => p.status === "voting").length,
    rejected: policies.filter((p) => p.status === "rejected").length,
  };

  return (
    <OrganizationLayout
      title="Policy Governance"
      subtitle="Review and manage organizational policies"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Policies
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approved}
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
                  <p className="text-sm font-medium text-gray-600">
                    Active Votes
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.voting}
                  </p>
                </div>
                <Vote className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search policies..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="voting">Active Voting</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="votes">Most Votes</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Policies List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading policies...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No policies found
                </h3>
                <p className="text-gray-600">
                  {policies.length === 0
                    ? "No policies have been created yet."
                    : "Try adjusting your filters to see more results."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPolicies.map((policy) => (
              <Card
                key={policy.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryIcon(policy.category)}
                        <h3 className="text-lg font-semibold">
                          {policy.title}
                        </h3>
                        {getStatusBadge(policy.status)}
                        {isVotingActive(policy) && (
                          <Badge
                            variant="outline"
                            className="text-orange-700 border-orange-200"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {policy.end_time &&
                              getTimeRemaining(policy.end_time)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {policy.description}
                      </p>

                      {/* Vote Counts */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            {policy.votes_for} For
                          </span>
                          <span className="flex items-center gap-1 text-red-700">
                            <XCircle className="h-4 w-4" />
                            {policy.votes_against} Against
                          </span>
                          {(policy.votes_abstain || 0) > 0 && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Users className="h-4 w-4" />
                              {policy.votes_abstain} Abstain
                            </span>
                          )}
                        </div>

                        <div className="text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(policy.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Approval Rate */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Approval Rate</span>
                          <span className="font-medium">
                            {calculateApprovalRate(policy)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${calculateApprovalRate(policy)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `/organization/policies/vote?id=${policy.proposal_id || policy.id}`,
                            "_blank",
                          )
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>

                      {isVotingActive(policy) && (
                        <Button
                          size="sm"
                          className="bg-medical-600 hover:bg-medical-700"
                          onClick={() => {
                            window.location.href = `/organization/policies/vote?id=${policy.proposal_id || policy.id}`;
                          }}
                        >
                          <Vote className="h-4 w-4 mr-1" />
                          Vote Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                className="bg-medical-600 hover:bg-medical-700"
                onClick={() =>
                  (window.location.href = "/organization/policies/propose")
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Propose New Policy
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "/organization/policies/vote")
                }
              >
                <Vote className="h-4 w-4 mr-2" />
                Vote on Policy
              </Button>
              <Button variant="outline" onClick={fetchPolicies}>
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
