import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Users,
  FileText,
  Vote,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Award,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState, useEffect } from "react";

interface AnalyticsData {
  overview: {
    totalProposals: number;
    totalVotes: number;
    successRate: number;
    participationRate: number;
    averageVotingTime: number;
  };
  trends: {
    proposalsOverTime: Array<{ period: string; count: number }>;
    votingPatterns: Array<{
      period: string;
      votes: number;
      participation: number;
    }>;
    successRateOverTime: Array<{ period: string; rate: number }>;
  };
  proposalBreakdown: {
    byCategory: Array<{ category: string; count: number; successRate: number }>;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    byMonth: Array<{ month: string; created: number; finalized: number }>;
  };
  votingAnalysis: {
    responseTime: Array<{ range: string; count: number }>;
    votingPattern: Array<{ vote: string; count: number; percentage: number }>;
    participationByMonth: Array<{
      month: string;
      eligible: number;
      participated: number;
    }>;
  };
  comparisons: {
    industryAverage: {
      successRate: number;
      participationRate: number;
      proposalsPerMonth: number;
    };
    organizationRanking: number;
    totalOrganizations: number;
  };
}

export default function OrganizationAnalytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [dataType, setDataType] = useState("all");
  const [loading, setLoading] = useState(true);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalProposals: 12,
      totalVotes: 24,
      successRate: 75,
      participationRate: 87.5,
      averageVotingTime: 18.5,
    },
    trends: {
      proposalsOverTime: [
        { period: "Jan", count: 2 },
        { period: "Feb", count: 1 },
        { period: "Mar", count: 3 },
        { period: "Apr", count: 2 },
        { period: "May", count: 1 },
        { period: "Jun", count: 3 },
      ],
      votingPatterns: [
        { period: "Jan", votes: 4, participation: 85 },
        { period: "Feb", votes: 3, participation: 90 },
        { period: "Mar", votes: 5, participation: 88 },
        { period: "Apr", votes: 4, participation: 92 },
        { period: "May", votes: 3, participation: 85 },
        { period: "Jun", votes: 5, participation: 87 },
      ],
      successRateOverTime: [
        { period: "Jan", rate: 70 },
        { period: "Feb", rate: 75 },
        { period: "Mar", rate: 80 },
        { period: "Apr", rate: 75 },
        { period: "May", rate: 85 },
        { period: "Jun", rate: 75 },
      ],
    },
    proposalBreakdown: {
      byCategory: [
        { category: "Health Policy", count: 5, successRate: 80 },
        { category: "Emergency Response", count: 3, successRate: 67 },
        { category: "International Cooperation", count: 2, successRate: 100 },
        { category: "Data Standards", count: 2, successRate: 50 },
      ],
      byStatus: [
        { status: "Approved", count: 9, percentage: 75 },
        { status: "Rejected", count: 2, percentage: 17 },
        { status: "Pending", count: 1, percentage: 8 },
      ],
      byMonth: [
        { month: "Jan", created: 2, finalized: 1 },
        { month: "Feb", created: 1, finalized: 2 },
        { month: "Mar", created: 3, finalized: 1 },
        { month: "Apr", created: 2, finalized: 3 },
        { month: "May", created: 1, finalized: 2 },
        { month: "Jun", created: 3, finalized: 3 },
      ],
    },
    votingAnalysis: {
      responseTime: [
        { range: "< 4 hours", count: 8 },
        { range: "4-12 hours", count: 12 },
        { range: "12-24 hours", count: 3 },
        { range: "> 24 hours", count: 1 },
      ],
      votingPattern: [
        { vote: "For", count: 15, percentage: 62.5 },
        { vote: "Against", count: 6, percentage: 25 },
        { vote: "Abstain", count: 3, percentage: 12.5 },
      ],
      participationByMonth: [
        { month: "Jan", eligible: 5, participated: 4 },
        { month: "Feb", eligible: 4, participated: 4 },
        { month: "Mar", eligible: 6, participated: 5 },
        { month: "Apr", eligible: 5, participated: 5 },
        { month: "May", eligible: 4, participated: 3 },
        { month: "Jun", eligible: 6, participated: 5 },
      ],
    },
    comparisons: {
      industryAverage: {
        successRate: 68,
        participationRate: 78,
        proposalsPerMonth: 1.5,
      },
      organizationRanking: 3,
      totalOrganizations: 12,
    },
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, dataType]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from API with filters
      // const response = await fetch(`/api/organization/analytics?timeRange=${timeRange}&dataType=${dataType}`);
      // const data = await response.json();
      // setAnalyticsData(data);

      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // In real implementation, trigger data export
    console.log("Exporting analytics data...");
  };

  const getChangeIndicator = (current: number, comparison: number) => {
    const change = current - comparison;
    const isPositive = change > 0;
    return {
      value: Math.abs(change),
      isPositive,
      icon: isPositive ? ArrowUp : ArrowDown,
      color: isPositive ? "text-green-600" : "text-red-600",
    };
  };

  if (loading) {
    return (
      <OrganizationLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout
      title="Analytics Dashboard"
      subtitle="Insights into your organization's policy governance performance"
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="proposals">Proposals Only</SelectItem>
                  <SelectItem value="voting">Voting Only</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Total Proposals
                </span>
                <FileText className="h-4 w-4 text-medical-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {analyticsData.overview.totalProposals}
                </span>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +2
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Success Rate
                </span>
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {analyticsData.overview.successRate}%
                </span>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +7%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Participation Rate
                </span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {analyticsData.overview.participationRate}%
                </span>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +2.5%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Avg. Response Time
                </span>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">
                  {analyticsData.overview.averageVotingTime}h
                </span>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  -2.1h
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance vs Industry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Success Rate</span>
                  <Badge className="bg-green-100 text-green-800">
                    Above Average
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Organization</span>
                    <span className="font-medium">
                      {analyticsData.overview.successRate}%
                    </span>
                  </div>
                  <Progress
                    value={analyticsData.overview.successRate}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Industry Average</span>
                    <span>
                      {analyticsData.comparisons.industryAverage.successRate}%
                    </span>
                  </div>
                  <Progress
                    value={
                      analyticsData.comparisons.industryAverage.successRate
                    }
                    className="h-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Participation Rate
                  </span>
                  <Badge className="bg-green-100 text-green-800">
                    Above Average
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Organization</span>
                    <span className="font-medium">
                      {analyticsData.overview.participationRate}%
                    </span>
                  </div>
                  <Progress
                    value={analyticsData.overview.participationRate}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Industry Average</span>
                    <span>
                      {
                        analyticsData.comparisons.industryAverage
                          .participationRate
                      }
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      analyticsData.comparisons.industryAverage
                        .participationRate
                    }
                    className="h-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Organization Ranking
                  </span>
                  <Badge className="bg-medical-100 text-medical-800">
                    #{analyticsData.comparisons.organizationRanking}
                  </Badge>
                </div>
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-medical-600">
                    #{analyticsData.comparisons.organizationRanking}
                  </div>
                  <div className="text-sm text-gray-600">
                    out of {analyticsData.comparisons.totalOrganizations}{" "}
                    organizations
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proposal Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Proposal Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proposals by Status */}
              <div>
                <h4 className="font-medium mb-3">Proposals by Status</h4>
                <div className="space-y-2">
                  {analyticsData.proposalBreakdown.byStatus.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {item.status === "Approved" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {item.status === "Rejected" && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {item.status === "Pending" && (
                          <Clock className="h-4 w-4 text-orange-600" />
                        )}
                        <span className="text-sm">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {item.count}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposals by Category */}
              <div>
                <h4 className="font-medium mb-3">Performance by Category</h4>
                <div className="space-y-3">
                  {analyticsData.proposalBreakdown.byCategory.map((item) => (
                    <div key={item.category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.count} proposals
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={item.successRate}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {item.successRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Voting Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voting Pattern */}
              <div>
                <h4 className="font-medium mb-3">Voting Pattern</h4>
                <div className="space-y-2">
                  {analyticsData.votingAnalysis.votingPattern.map((item) => (
                    <div
                      key={item.vote}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            item.vote === "For"
                              ? "bg-green-500"
                              : item.vote === "Against"
                                ? "bg-red-500"
                                : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-sm">{item.vote}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {item.count}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div>
                <h4 className="font-medium mb-3">Response Time Distribution</h4>
                <div className="space-y-2">
                  {analyticsData.votingAnalysis.responseTime.map((item) => (
                    <div
                      key={item.range}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{item.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-medical-600 h-2 rounded-full"
                            style={{ width: `${(item.count / 24) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-6">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Participation */}
              <div>
                <h4 className="font-medium mb-3">Monthly Participation</h4>
                <div className="space-y-2">
                  {analyticsData.votingAnalysis.participationByMonth.map(
                    (item) => (
                      <div
                        key={item.month}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{item.month}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {item.participated}/{item.eligible}
                          </span>
                          <span className="text-xs text-gray-500">
                            (
                            {Math.round(
                              (item.participated / item.eligible) * 100,
                            )}
                            %)
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-medium mb-4">Proposals Created</h4>
                <div className="space-y-2">
                  {analyticsData.trends.proposalsOverTime.map((item, index) => (
                    <div
                      key={item.period}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">
                        {item.period}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-medical-600 h-2 rounded-full"
                            style={{ width: `${(item.count / 3) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-4">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Voting Participation</h4>
                <div className="space-y-2">
                  {analyticsData.trends.votingPatterns.map((item) => (
                    <div
                      key={item.period}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">
                        {item.period}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.participation}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {item.participation}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Success Rate</h4>
                <div className="space-y-2">
                  {analyticsData.trends.successRateOverTime.map((item) => (
                    <div
                      key={item.period}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">
                        {item.period}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${item.rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-green-600">Strengths</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>
                      Above-average success rate (75% vs 68% industry average)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>High participation rate in voting (87.5%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Fast response times (avg 18.5 hours)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>
                      Strong performance in International Cooperation policies
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-orange-600">
                  Areas for Improvement
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>
                      Improve success rate for Data Standards policies
                      (currently 50%)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>
                      Consider more detailed rationales for rejected proposals
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span>Engage more in cross-organization collaboration</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
