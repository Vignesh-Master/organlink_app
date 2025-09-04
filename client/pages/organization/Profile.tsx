import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Calendar,
  Save,
  Upload,
  Edit3,
  ExternalLink,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  RefreshCw,
  Camera,
  Verified,
} from "lucide-react";
import { useState, useEffect } from "react";

interface OrganizationData {
  id: number;
  name: string;
  type: string;
  description: string;
  foundedYear: string;
  website: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  representatives: {
    primary: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    alternate: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
  };
  statistics: {
    proposalsCreated: number;
    votesParticipated: number;
    successRate: number;
    joinedDate: string;
    lastActive: string;
  };
  verification: {
    status: "verified" | "pending" | "unverified";
    verifiedDate?: string;
    documents: string[];
  };
  socialMedia: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

export default function OrganizationProfile() {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [orgData, setOrgData] = useState<OrganizationData>({
    id: 1,
    name: "World Health Organization",
    type: "International Health Agency",
    description: "The World Health Organization is a specialized agency of the United Nations responsible for international public health. We work worldwide to promote health, keep the world safe, and serve the vulnerable.",
    foundedYear: "1948",
    website: "https://www.who.int",
    email: "who@organlink.org",
    phone: "+41 22 791 21 11",
    address: {
      street: "Avenue Appia 20",
      city: "Geneva",
      state: "Geneva",
      country: "Switzerland",
      zipCode: "1211",
    },
    representatives: {
      primary: {
        name: "Dr. Sarah Johnson",
        title: "Policy Director",
        email: "s.johnson@who.int",
        phone: "+41 22 791 22 22",
      },
      alternate: {
        name: "Dr. Michael Chen",
        title: "Deputy Policy Director",
        email: "m.chen@who.int",
        phone: "+41 22 791 33 33",
      },
    },
    statistics: {
      proposalsCreated: 12,
      votesParticipated: 24,
      successRate: 75,
      joinedDate: "2024-01-15",
      lastActive: "2024-01-22",
    },
    verification: {
      status: "verified",
      verifiedDate: "2024-01-16",
      documents: ["Legal Registration", "Government Authorization", "Representative Credentials"],
    },
    socialMedia: {
      twitter: "https://twitter.com/WHO",
      linkedin: "https://linkedin.com/company/world-health-organization",
    },
  });

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from API
      // const response = await fetch('/api/organization/profile');
      // const data = await response.json();
      // setOrgData(data);
    } catch (error) {
      console.error("Failed to load organization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      // In real implementation, save to API
      // await fetch('/api/organization/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(orgData)
      // });

      setHasChanges(false);
      setEditing(false);
      console.log("Profile saved successfully");
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setOrgData(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case "verified": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <OrganizationLayout
      title="Organization Profile"
      subtitle="Manage your organization's information and settings"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge className={getVerificationColor(orgData.verification.status)}>
              <Verified className="h-3 w-3 mr-1" />
              {orgData.verification.status === "verified" ? "Verified Organization" : 
               orgData.verification.status === "pending" ? "Verification Pending" : "Unverified"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setHasChanges(false);
                    loadOrganizationData();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveProfile}
                  disabled={loading || !hasChanges}
                  className="bg-medical-600 hover:bg-medical-700"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                className="bg-medical-600 hover:bg-medical-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" alt={orgData.name} />
                      <AvatarFallback className="text-lg font-bold bg-medical-100 text-medical-700">
                        {orgData.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <button className="absolute -bottom-1 -right-1 p-1 bg-medical-600 text-white rounded-full hover:bg-medical-700">
                        <Camera className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={orgData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        disabled={!editing}
                        className="font-semibold text-lg"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="orgType">Organization Type</Label>
                      <Input
                        id="orgType"
                        value={orgData.type}
                        onChange={(e) => updateField('type', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={orgData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    disabled={!editing}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="foundedYear">Founded Year</Label>
                    <Input
                      id="foundedYear"
                      value={orgData.foundedYear}
                      onChange={(e) => updateField('foundedYear', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="flex gap-2">
                      <Input
                        id="website"
                        value={orgData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        disabled={!editing}
                      />
                      {!editing && orgData.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={orgData.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Primary Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={orgData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="space-y-3 mt-2">
                    <Input
                      placeholder="Street Address"
                      value={orgData.address.street}
                      onChange={(e) => updateField('address.street', e.target.value)}
                      disabled={!editing}
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Input
                        placeholder="City"
                        value={orgData.address.city}
                        onChange={(e) => updateField('address.city', e.target.value)}
                        disabled={!editing}
                      />
                      <Input
                        placeholder="State"
                        value={orgData.address.state}
                        onChange={(e) => updateField('address.state', e.target.value)}
                        disabled={!editing}
                      />
                      <Input
                        placeholder="Country"
                        value={orgData.address.country}
                        onChange={(e) => updateField('address.country', e.target.value)}
                        disabled={!editing}
                      />
                      <Input
                        placeholder="ZIP Code"
                        value={orgData.address.zipCode}
                        onChange={(e) => updateField('address.zipCode', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Representatives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organization Representatives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Representative */}
                <div>
                  <h4 className="font-medium mb-3">Primary Representative</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryName">Full Name</Label>
                      <Input
                        id="primaryName"
                        value={orgData.representatives.primary.name}
                        onChange={(e) => updateField('representatives.primary.name', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryTitle">Title</Label>
                      <Input
                        id="primaryTitle"
                        value={orgData.representatives.primary.title}
                        onChange={(e) => updateField('representatives.primary.title', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryEmail">Email</Label>
                      <Input
                        id="primaryEmail"
                        type="email"
                        value={orgData.representatives.primary.email}
                        onChange={(e) => updateField('representatives.primary.email', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryPhone">Phone</Label>
                      <Input
                        id="primaryPhone"
                        value={orgData.representatives.primary.phone}
                        onChange={(e) => updateField('representatives.primary.phone', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Alternate Representative */}
                <div>
                  <h4 className="font-medium mb-3">Alternate Representative</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="alternateName">Full Name</Label>
                      <Input
                        id="alternateName"
                        value={orgData.representatives.alternate.name}
                        onChange={(e) => updateField('representatives.alternate.name', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="alternateTitle">Title</Label>
                      <Input
                        id="alternateTitle"
                        value={orgData.representatives.alternate.title}
                        onChange={(e) => updateField('representatives.alternate.title', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="alternateEmail">Email</Label>
                      <Input
                        id="alternateEmail"
                        type="email"
                        value={orgData.representatives.alternate.email}
                        onChange={(e) => updateField('representatives.alternate.email', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="alternatePhone">Phone</Label>
                      <Input
                        id="alternatePhone"
                        value={orgData.representatives.alternate.phone}
                        onChange={(e) => updateField('representatives.alternate.phone', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Media & Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={orgData.socialMedia.twitter || ''}
                      onChange={(e) => updateField('socialMedia.twitter', e.target.value)}
                      disabled={!editing}
                      placeholder="https://twitter.com/yourorg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={orgData.socialMedia.linkedin || ''}
                      onChange={(e) => updateField('socialMedia.linkedin', e.target.value)}
                      disabled={!editing}
                      placeholder="https://linkedin.com/company/yourorg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-medical-50 rounded-lg">
                  <p className="text-2xl font-bold text-medical-600">
                    {orgData.statistics.proposalsCreated}
                  </p>
                  <p className="text-sm text-gray-600">Proposals Created</p>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {orgData.statistics.votesParticipated}
                  </p>
                  <p className="text-sm text-gray-600">Votes Participated</p>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {orgData.statistics.successRate}%
                  </p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium">{formatDate(orgData.statistics.joinedDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="font-medium">{formatDate(orgData.statistics.lastActive)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Verified Organization</span>
                </div>
                
                {orgData.verification.verifiedDate && (
                  <p className="text-sm text-gray-600">
                    Verified on {formatDate(orgData.verification.verifiedDate)}
                  </p>
                )}

                <div>
                  <h4 className="font-medium mb-2">Verified Documents:</h4>
                  <div className="space-y-1">
                    {orgData.verification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Proposal Created</p>
                    <p className="text-xs text-gray-600">Pediatric Priority Policy • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Vote Cast</p>
                    <p className="text-xs text-gray-600">Geographic Proximity Rule • 1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Profile Updated</p>
                    <p className="text-xs text-gray-600">Contact information • 3 days ago</p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OrganizationLayout>
  );
}
