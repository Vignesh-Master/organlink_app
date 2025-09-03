import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Heart,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Bell,
  MapPin,
  Phone,
} from "lucide-react";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { useToast } from "@/contexts/ToastContext";
import HospitalLayout from "@/components/hospital/HospitalLayout";

interface Patient {
  patient_id: string;
  full_name: string;
  blood_type: string;
  organ_needed: string;
  urgency_level: string;
  age: number;
}

interface DonorMatch {
  donor_id: string;
  donor_name: string;
  blood_type: string;
  organs_available: string[];
  hospital_id: string;
  hospital_name: string;
  match_score: number;
  distance_score: number;
  compatibility_score: number;
  urgency_bonus: number;
  medical_risk_score: number;
  explanation?: string;
}

interface IncomingMatch {
  id: string;
  notification_id: string;
  title: string;
  message: string;
  patient_id: string;
  organ_type: string;
  blood_type: string;
  urgency_level: string;
  requesting_hospital_name: string;
  created_at: string;
  metadata: any;
}

export default function AIMatching() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [incomingMatches, setIncomingMatches] = useState<IncomingMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingMatches, setSearchingMatches] = useState(false);

  const { hospital } = useHospitalAuth();
  const { error: showError, success: showSuccess, warning: showWarning } = useToast();

  useEffect(() => {
    fetchPatients();
    fetchIncomingMatches();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(
          data.patients.filter((p: Patient) => p.urgency_level !== "Low"),
        );
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const fetchIncomingMatches = async () => {
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/matching/incoming-matches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIncomingMatches(data.incoming_matches);
      }
    } catch (error) {
      console.error("Failed to fetch incoming matches:", error);
    }
  };

  const searchMatches = async (patient: Patient) => {
    setSearchingMatches(true);
    setSelectedPatient(patient);
    setMatches([]);

    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/matching/enhanced-matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patient.patient_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setMatches(data.matches);
        if (data.total_matches === 0) {
          showWarning("No matches found for this patient");
        } else {
          showSuccess(
            `Found ${data.total_matches} potential matches using Enhanced AI Algorithm!`
          );
        }
      } else {
        showError(data.error || "Failed to search matches");
      }
    } catch (error) {
      console.error("Search matches error:", error);
      showError("Failed to search matches");
    } finally {
      setSearchingMatches(false);
    }
  };

  const createMatchingRequest = async (patient: Patient, match: DonorMatch) => {
    try {
      const token = localStorage.getItem("hospital_token");
      const response = await fetch("/api/hospital/matching/create-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patient.patient_id,
          organ_type: patient.organ_needed,
          blood_type: patient.blood_type,
          urgency_level: patient.urgency_level,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        showSuccess("Matching request sent successfully!");
      } else {
        showError(data.error || "Failed to send request");
      }
    } catch (error) {
      console.error("Create request error:", error);
      showError("Failed to send request");
    }
  };

  const respondToMatch = async (
    match: IncomingMatch,
    response: "accept" | "reject",
    donorId?: string,
  ) => {
    try {
      const token = localStorage.getItem("hospital_token");
      const res = await fetch("/api/hospital/matching/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request_id: match.notification_id,
          donor_id: donorId,
          response: response,
        }),
      });

      if (!res.ok) {
        throw new Error(`Response failed with status ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        showSuccess(`Match ${response}ed successfully!`);
        fetchIncomingMatches(); // Refresh incoming matches
      } else {
        showError(data.error || "Failed to respond");
      }
    } catch (error) {
      console.error("Respond to match error:", error);
      showError("Failed to respond to match");
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <HospitalLayout title="AI Organ Matching" subtitle="Advanced AI-powered organ matching system">
      <div className="max-w-7xl mx-auto">

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Find Matches</TabsTrigger>
            <TabsTrigger value="incoming" className="relative">
              Incoming Requests
              {incomingMatches.length > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {incomingMatches.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Find Matches Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Select Patient
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <div
                        key={patient.patient_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPatient?.patient_id === patient.patient_id
                            ? "border-medical-600 bg-medical-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => searchMatches(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {patient.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Age: {patient.age} • Blood Type:{" "}
                              {patient.blood_type}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge
                              className={getUrgencyColor(patient.urgency_level)}
                            >
                              {patient.urgency_level}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                              {patient.organ_needed}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No patients requiring organs found
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Match Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Match Results
                    {searchingMatches && (
                      <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-medical-600"></div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPatient ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          Searching for: {selectedPatient.organ_needed} •{" "}
                          {selectedPatient.blood_type}
                        </p>
                        <p className="text-sm text-blue-700">
                          Patient: {selectedPatient.full_name} (
                          {selectedPatient.urgency_level} priority)
                        </p>
                      </div>

                      {matches.length > 0 ? (
                        <div className="space-y-3">
                          {matches.slice(0, 5).map((match, index) => (
                            <div
                              key={match.donor_id}
                              className="border rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {match.donor_name}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {match.hospital_name} • {match.blood_type}
                                  </p>
                                </div>
                                <Badge
                                  className={getMatchScoreColor(
                                    match.match_score,
                                  )}
                                >
                                  {match.match_score}% Match
                                </Badge>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Blood: {match.compatibility_score}%</div>
                                  <div>Distance: {match.distance_score}%</div>
                                  <div>Urgency: {match.urgency_bonus}%</div>
                                  <div>Medical: {match.medical_risk_score}%</div>
                                </div>
                                {match.explanation && (
                                  <p className="text-xs text-gray-600 italic">
                                    {match.explanation}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1 mb-3">
                                {match.organs_available.map((organ) => (
                                  <Badge
                                    key={organ}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {organ}
                                  </Badge>
                                ))}
                              </div>

                              <Button
                                size="sm"
                                className="w-full bg-medical-600 hover:bg-medical-700"
                                onClick={() =>
                                  createMatchingRequest(selectedPatient, match)
                                }
                              >
                                Send Match Request
                              </Button>
                            </div>
                          ))}

                          {matches.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                              Showing top 5 of {matches.length} matches
                            </p>
                          )}
                        </div>
                      ) : (
                        !searchingMatches && (
                          <p className="text-gray-500 text-center py-8">
                            {selectedPatient
                              ? "No matches found"
                              : "Click on a patient to search for matches"}
                          </p>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Select a patient to search for matching donors
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incoming Requests Tab */}
          <TabsContent value="incoming" className="space-y-6">
            <div className="grid gap-6">
              {incomingMatches.length > 0 ? (
                incomingMatches.map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <Bell className="h-5 w-5 text-medical-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {match.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                From: {match.requesting_hospital_name}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4">{match.message}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <Label className="text-xs text-gray-500">
                                Organ Needed
                              </Label>
                              <p className="font-medium">{match.organ_type}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Blood Type
                              </Label>
                              <p className="font-medium">{match.blood_type}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Urgency
                              </Label>
                              <Badge
                                className={getUrgencyColor(match.urgency_level)}
                              >
                                {match.urgency_level}
                              </Badge>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Received
                              </Label>
                              <p className="text-sm">
                                {new Date(
                                  match.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {match.metadata?.matches && (
                            <div className="mb-4">
                              <Label className="text-sm font-medium text-gray-700">
                                Your Matching Donors:
                              </Label>
                              <div className="mt-2 space-y-2">
                                {match.metadata.matches
                                  .slice(0, 3)
                                  .map((donor: any) => (
                                    <div
                                      key={donor.donor_id}
                                      className="p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">
                                            {donor.donor_name}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {donor.blood_type} •{" "}
                                            {donor.organs_available.join(", ")}
                                          </p>
                                        </div>
                                        <Badge
                                          className={getMatchScoreColor(
                                            donor.match_score,
                                          )}
                                        >
                                          {donor.match_score}% Match
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-6">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => respondToMatch(match, "accept")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToMatch(match, "reject")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Incoming Requests
                    </h3>
                    <p className="text-gray-600">
                      No hospitals have requested organs from your donors yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HospitalLayout>
  );
}
