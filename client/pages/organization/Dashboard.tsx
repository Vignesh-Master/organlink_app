import Layout from "@/components/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { useState, useEffect } from "react";
import { 
  FileText, 
  Vote, 
  BarChart3, 
  History, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  Eye,
  Calendar,
  Target,
  Award,
  Activity
} from "lucide-react";

interface DashboardStats {
  totalProposals: number;
  activeVotes: number;
  approvedPolicies: number;
  rejectedPolicies: number;
  myVotes: number;
  participationRate: number;
}

interface RecentActivity {
  id: string;
  type: 'proposal' | 'vote' | 'finalized';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface UpcomingDeadline {
  id: number;
  title: string;
  endTime: string;
  hoursLeft: number;
  canVote: boolean;
}

interface OrganizationInfo {
  id: number;
  name: string;
  email: string;
  activeMembers: number;
  totalPoliciesProposed: number;
  successRate: number;
}

export default function OrganizationDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProposals: 0,
    activeVotes: 0,
    approvedPolicies: 0,
    rejectedPolicies: 0,
    myVotes: 0,
    participationRate: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be separate API calls
      // For now, we'll use mock data that demonstrates the functionality
      
      // Mock organization info
      setOrgInfo({
        id: 1,
        name: "World Health Organization",
        email: "who@organlink.org",
        activeMembers: 150,
        totalPoliciesProposed: 12,
        successRate: 75
      });

      // Mock dashboard stats
      setStats({
        totalProposals: 24,
        activeVotes: 3,
        approvedPolicies: 18,
        rejectedPolicies: 3,
        myVotes: 21,
        participationRate: 87.5
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: "1",
          type: "proposal",
          title: "New Pediatric Priority Policy Proposed",
          description: "Your organization proposed a new policy for pediatric organ allocation",
          timestamp: "2024-01-22T10:30:00Z"
        },
        {
          id: "2",
          type: "vote",
          title: "Voted on Geographic Proximity Rule",
          description: "You voted 'For' on the geographic proximity preference policy",
          timestamp: "2024-01-21T15:45:00Z",
          status: "for"
        },
        {
          id: "3",
          type: "finalized",
          title: "AI Matching Enhancement - Rejected",
          description: "The AI matching algorithm update proposal was rejected with 3-7 votes",
          timestamp: "2024-01-20T09:15:00Z",
          status: "rejected"
        },
        {
          id: "4",
          type: "finalized",
          title: "Emergency Protocol Update - Approved",
          description: "The emergency organ allocation protocol was approved with 9-2 votes",
          timestamp: "2024-01-19T14:22:00Z",
          status: "approved"
        },
        {
          id: "5",
          type: "vote",
          title: "Voted on Cross-Border Allocation",
          description: "You voted 'Against' on the international organ sharing policy",
          timestamp: "2024-01-18T11:30:00Z",
          status: "against"
        }
      ]);

      // Mock upcoming deadlines
      setUpcomingDeadlines([
        {
          id: 2,
          title: "Geographic Proximity Preference",
          endTime: "2024-01-25T14:30:00Z",
          hoursLeft: 28,
          canVote: true
        },
        {
          id: 4,
          title: "Cross-Border Allocation Framework",
          endTime: "2024-01-26T16:00:00Z",
          hoursLeft: 42,
          canVote: true
        },
        {
          id: 5,
          title: "Donor Consent Verification Protocol",
          endTime: "2024-01-28T12:00:00Z",
          hoursLeft: 86,
          canVote: false
        }
      ]);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "proposal":
        return <PlusCircle className="h-4 w-4 text-blue-600" />;
      case "vote":
        return <Vote className="h-4 w-4 text-green-600" />;
      case "finalized":
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "for":
        return <Badge className="bg-green-100 text-green-800">Voted For</Badge>;
      case "against":
        return <Badge className="bg-red-100 text-red-800">Voted Against</Badge>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  const getUrgencyColor = (hoursLeft: number) => {
    if (hoursLeft <= 24) return "text-red-600";
    if (hoursLeft <= 72) return "text-orange-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <OrganizationLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout title="Organization Dashboard" subtitle="Monitor your policy governance activities">
      <div className="space-y-6">
        {/* Organization Overview */}
        {orgInfo && (
          <Card className="border-l-4 border-l-medical-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-medical-600" />
                {orgInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-medical-600">{orgInfo.activeMembers}</p>
                  <p className="text-sm text-gray-600">Active Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{orgInfo.totalPoliciesProposed}</p>
                  <p className="text-sm text-gray-600">Policies Proposed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{orgInfo.successRate}%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.participationRate}%</p>
                  <p className="text-sm text-gray-600">Participation Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Total Proposals</span>
                <FileText className="h-5 w-5 text-medical-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{stats.totalProposals}</span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/organization/policies">View All</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Active Votes</span>
                <Vote className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-blue-600">{stats.activeVotes}</span>
                <Button size="sm" asChild>
                  <a href="/organization/policies/vote">Vote Now</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Approved</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-green-600">{stats.approvedPolicies}</span>
                <span className="text-sm text-gray-500">
                  {Math.round((stats.approvedPolicies / stats.totalProposals) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">My Votes Cast</span>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-purple-600">{stats.myVotes}</span>
                <span className="text-sm text-gray-500">
                  of {stats.totalProposals}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-16 bg-medical-600 hover:bg-medical-700" asChild>
                <a href="/organization/policies/propose" className="flex flex-col">
                  <PlusCircle className="h-6 w-6 mb-1" />
                  Propose Policy
                </a>
              </Button>
              <Button variant="outline" className="h-16" asChild>
                <a href="/organization/policies/vote" className="flex flex-col">
                  <Vote className="h-6 w-6 mb-1" />
                  Vote on Policies
                </a>
              </Button>
              <Button variant="outline" className="h-16" asChild>
                <a href="/organization/policies" className="flex flex-col">
                  <History className="h-6 w-6 mb-1" />
                  Policy History
                </a>
              </Button>
              <Button variant="outline" className="h-16">
                <div className="flex flex-col">
                  <BarChart3 className="h-6 w-6 mb-1" />
                  Analytics
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Upcoming Voting Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{deadline.title}</h4>
                      <p className={`text-sm font-medium ${getUrgencyColor(deadline.hoursLeft)}`}>
                        {deadline.hoursLeft <= 24 
                          ? `${deadline.hoursLeft} hours left` 
                          : `${Math.floor(deadline.hoursLeft / 24)} days left`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {deadline.canVote ? (
                        <Button 
                          size="sm" 
                          className="bg-medical-600 hover:bg-medical-700"
                          onClick={() => window.location.href = `/organization/policies/vote?id=${deadline.id}`}
                        >
                          Vote Now
                        </Button>
                      ) : (
                        <Badge variant="outline">Already Voted</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    View All Activity
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participation Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Participation Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Participation Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Voting Participation</span>
                  <span className="text-sm font-semibold">{stats.participationRate}%</span>
                </div>
                <Progress value={stats.participationRate} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">
                  Voted on {stats.myVotes} of {stats.totalProposals} proposals
                </p>
              </div>

              {/* Success Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Proposal Success Rate</span>
                  <span className="text-sm font-semibold">{orgInfo?.successRate}%</span>
                </div>
                <Progress value={orgInfo?.successRate || 0} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">
                  {stats.approvedPolicies} approved out of {orgInfo?.totalPoliciesProposed} proposed
                </p>
              </div>

              {/* Monthly Goal */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Monthly Engagement Goal</span>
                  <span className="text-sm font-semibold">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">
                  Target: Vote on 85% of all proposals this month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notices */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Reminder:</strong> The quarterly policy review meeting is scheduled for next week. 
            Please ensure all pending votes are cast before the deadline.
          </AlertDescription>
        </Alert>
      </div>
    </OrganizationLayout>
  );
}
