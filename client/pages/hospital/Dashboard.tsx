import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Heart,
  UserCheck,
  AlertTriangle,
  Plus,
  Search,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  PieChart,
} from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useToast } from "@/contexts/ToastContext";
import HospitalLayout from "@/components/hospital/HospitalLayout";

interface DashboardStats {
  patients: {
    total_patients: number;
    active_patients: number;
    verified_patients: number;
    urgent_patients: number;
  };
  donors: {
    total_donors: number;
    active_donors: number;
    verified_donors: number;
  };
  matching: {
    total_requests: number;
    pending_requests: number;
    successful_matches: number;
    rejected_requests: number;
  };
  notifications: {
    unread_count: number;
  };
}

interface RecentActivity {
  type: string;
  record_id: string;
  name: string;
  activity: string;
  created_at: string;
}

interface OrganDistribution {
  organ_needed: string;
  count: number;
}

interface BloodTypeDistribution {
  blood_type: string;
  patient_count: number;
  donor_count: number;
}

export default function HospitalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [organDistribution, setOrganDistribution] = useState<
    OrganDistribution[]
  >([]);
  const [bloodTypeDistribution, setBloodTypeDistribution] = useState<
    BloodTypeDistribution[]
  >([]);
  const [loading, setLoading] = useState(true);

  const { hospital } = useHospitalAuth();
  const { error: showError } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivities(data.recentActivities);
        setOrganDistribution(data.organDistribution);
        setBloodTypeDistribution(data.bloodTypeDistribution);
      } else {
        showError("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      title={`Welcome back, ${hospital?.hospital_name || "Hospital"}`}
      subtitle={`${hospital?.city}, ${hospital?.state} • ${hospital?.country}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Quick Action Buttons */}
        <div className="mb-8 flex gap-3">
          <Link to="/hospital/patients/register">
            <Button className="bg-medical-600 hover:bg-medical-700">
              <Plus className="h-4 w-4 mr-2" />
              Register Patient
            </Button>
          </Link>
          <Link to="/hospital/donors/register">
            <Button variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Register Donor
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Patients */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Patients
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.patients.total_patients || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats?.patients.active_patients || 0} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Donors */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Donors
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.donors.total_donors || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats?.donors.active_donors || 0} active
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verified Records */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Verified Records
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(stats?.patients.verified_patients || 0) +
                      (stats?.donors.verified_donors || 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Blockchain verified
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Cases */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Urgent Cases
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.patients.urgent_patients || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Requires immediate attention
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link to="/hospital/patients">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    View Patients
                  </Button>
                </Link>
                <Link to="/hospital/donors">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
                  >
                    <Heart className="h-6 w-6 mb-2" />
                    View Donors
                  </Button>
                </Link>
                <Link to="/hospital/ai-matching">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
                  >
                    <Search className="h-6 w-6 mb-2" />
                    AI Matching
                  </Button>
                </Link>
                <Link to="/hospital/faqs">
                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
                  >
                    <PieChart className="h-6 w-6 mb-2" />
                    View Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Matching Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Matching Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Pending Requests
                  </span>
                  <Badge variant="secondary">
                    {stats?.matching.pending_requests || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Successful Matches
                  </span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats?.matching.successful_matches || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <Badge variant="outline">
                    {stats?.matching.total_requests || 0}
                  </Badge>
                </div>
                <Link to="/hospital/ai-matching">
                  <Button className="w-full mt-4 bg-medical-600 hover:bg-medical-700">
                    <Search className="h-4 w-4 mr-2" />
                    Find Matches
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities & Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          activity.type === "patient"
                            ? "bg-blue-100"
                            : "bg-green-100"
                        }`}
                      >
                        {activity.type === "patient" ? (
                          <Users
                            className={`h-4 w-4 ${
                              activity.type === "patient"
                                ? "text-blue-600"
                                : "text-green-600"
                            }`}
                          />
                        ) : (
                          <Heart className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.activity}
                        </p>
                        <p className="text-sm text-gray-500">{activity.name}</p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(activity.created_at)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No recent activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Blood Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Blood Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bloodTypeDistribution.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-medical-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-medical-600">
                          {item.blood_type}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        Type {item.blood_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {item.patient_count} patients
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.donor_count} donors
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HospitalLayout>
  );
}
