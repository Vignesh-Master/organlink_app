import Layout from "@/components/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { useState } from "react";
import {
  FileText,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  BookOpen,
  Calendar,
  Tag,
  Lightbulb,
  ExternalLink,
} from "lucide-react";

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  suggestedParameters: any;
  estimatedVotingTime: number;
}

export default function ProposePolicy() {
  const [formData, setFormData] = useState({
    title: "",
    rationale: "",
    parameters: "",
    category: "",
    priority: "medium",
    hours: 72,
    tags: [] as string[],
    template: "",
  });

  const [currentTag, setCurrentTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTemplate, setActiveTemplate] = useState<PolicyTemplate | null>(
    null,
  );

  const policyTemplates: PolicyTemplate[] = [
    {
      id: "medical_priority",
      name: "Medical Priority Framework",
      description: "Establish priority criteria based on medical factors",
      category: "medical",
      estimatedVotingTime: 72,
      suggestedParameters: {
        factors: ["urgency_level", "compatibility_score", "waiting_time"],
        age_considerations: true,
        medical_history_weight: 0.3,
      },
    },
    {
      id: "geographic_allocation",
      name: "Geographic Allocation Policy",
      description: "Define geographical preferences for organ allocation",
      category: "logistics",
      estimatedVotingTime: 96,
      suggestedParameters: {
        local_preference: true,
        max_distance_km: 500,
        transport_time_limit_hours: 6,
      },
    },
    {
      id: "ai_algorithm",
      name: "AI Algorithm Update",
      description: "Modify or enhance AI matching algorithms",
      category: "technology",
      estimatedVotingTime: 120,
      suggestedParameters: {
        algorithm_version: "2.1",
        training_data_sources: ["medical_journals", "historical_outcomes"],
        confidence_threshold: 0.85,
      },
    },
  ];

  const categories = [
    {
      value: "medical",
      label: "Medical",
      icon: "🏥",
      description: "Patient care and medical protocols",
    },
    {
      value: "logistics",
      label: "Logistics",
      icon: "🚚",
      description: "Transportation and coordination",
    },
    {
      value: "technology",
      label: "Technology",
      icon: "🤖",
      description: "AI algorithms and system updates",
    },
    {
      value: "governance",
      label: "Governance",
      icon: "⚖️",
      description: "Organizational and regulatory matters",
    },
    {
      value: "ethics",
      label: "Ethics",
      icon: "🤝",
      description: "Ethical guidelines and principles",
    },
    {
      value: "data",
      label: "Data & Privacy",
      icon: "🔒",
      description: "Data management and privacy policies",
    },
  ];

  const priorityLevels = [
    {
      value: "low",
      label: "Low Priority",
      description: "Can wait for next cycle",
      color: "text-green-600",
    },
    {
      value: "medium",
      label: "Medium Priority",
      description: "Normal review process",
      color: "text-blue-600",
    },
    {
      value: "high",
      label: "High Priority",
      description: "Requires prompt attention",
      color: "text-orange-600",
    },
    {
      value: "urgent",
      label: "Urgent",
      description: "Critical policy change needed",
      color: "text-red-600",
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    }

    if (!formData.rationale.trim()) {
      newErrors.rationale = "Rationale is required";
    } else if (formData.rationale.length < 50) {
      newErrors.rationale = "Rationale must be at least 50 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.parameters) {
      try {
        JSON.parse(formData.parameters);
      } catch {
        newErrors.parameters = "Parameters must be valid JSON";
      }
    }

    if (formData.hours < 24 || formData.hours > 168) {
      newErrors.hours = "Voting period must be between 24 hours and 7 days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = policyTemplates.find((t) => t.id === templateId);
    if (template) {
      setActiveTemplate(template);
      setFormData((prev) => ({
        ...prev,
        template: templateId,
        category: template.category,
        parameters: JSON.stringify(template.suggestedParameters, null, 2),
        hours: template.estimatedVotingTime,
      }));
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const submit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("organization_token");
      const response = await fetch("/api/organization/policies/propose-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          rationale: formData.rationale,
          parameters: formData.parameters || "{}",
          category: formData.category,
          priority: formData.priority,
          tags: formData.tags,
          hours: formData.hours,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit proposal");
      }

      setTx(data.txHash);
      setProposalId(data.proposalId);

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          title: "",
          rationale: "",
          parameters: "",
          category: "",
          priority: "medium",
          hours: 72,
          tags: [],
          template: "",
        });
        setActiveTemplate(null);
      }, 3000);
    } catch (e: any) {
      setErrors({ submit: e.message || "Failed to submit proposal" });
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedParticipants = 11; // Mock data - would come from API
  const estimatedTimeToDecision = Math.ceil(formData.hours / 24);

  return (
    <OrganizationLayout
      title="Propose New Policy"
      subtitle="Create a policy proposal for organizational voting"
    >
      <div className="max-w-4xl space-y-6">
        {/* Success Message */}
        {tx && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Proposal submitted successfully!</strong>
              <div className="mt-2 space-y-1">
                <div>
                  Transaction:{" "}
                  <a
                    className="underline"
                    target="_blank"
                    href={`https://sepolia.etherscan.io/tx/${tx}`}
                    rel="noopener noreferrer"
                  >
                    {tx?.slice(0, 10)}...{tx?.slice(-8)}
                  </a>
                </div>
                {proposalId && <div>Proposal ID: #{proposalId}</div>}
                <div className="mt-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href="/organization/policies">View All Policies</a>
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Policy Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Policy Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Choose a template to get started with pre-configured parameters
              and guidelines.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {policyTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    activeTemplate?.id === template.id
                      ? "border-medical-600 bg-medical-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <h4 className="font-medium mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline">{template.category}</Badge>
                    <span className="text-gray-500">
                      {template.estimatedVotingTime}h voting
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proposal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Policy Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Enhanced Pediatric Priority Protocol"
                    className={errors.title ? "border-red-300" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    A clear, descriptive title that explains the policy's
                    purpose
                  </p>
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger
                        className={errors.category ? "border-red-300" : ""}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <div>
                                <div>{cat.label}</div>
                                <div className="text-xs text-gray-500">
                                  {cat.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${priority.color.replace("text-", "bg-")}`}
                              />
                              <div>
                                <div>{priority.label}</div>
                                <div className="text-xs text-gray-500">
                                  {priority.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rationale */}
                <div>
                  <Label htmlFor="rationale">Policy Rationale *</Label>
                  <Textarea
                    id="rationale"
                    value={formData.rationale}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rationale: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Explain why this policy is needed, its expected impact, and how it will improve organ allocation..."
                    className={errors.rationale ? "border-red-300" : ""}
                  />
                  {errors.rationale && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.rationale}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a comprehensive explanation that will help other
                    organizations understand and evaluate your proposal
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add tag..."
                      className="flex-1"
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add relevant tags to help categorize and search for this
                    policy
                  </p>
                </div>

                {/* Parameters */}
                <div>
                  <Label htmlFor="parameters">Policy Parameters (JSON)</Label>
                  <Textarea
                    id="parameters"
                    value={formData.parameters}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parameters: e.target.value,
                      }))
                    }
                    rows={6}
                    placeholder='{"organ": "kidney", "age_priority": true, "max_waiting_time_months": 24}'
                    className={`font-mono text-sm ${errors.parameters ? "border-red-300" : ""}`}
                  />
                  {errors.parameters && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.parameters}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Define specific parameters that will be stored on IPFS and
                    referenced on-chain
                  </p>
                </div>

                {/* Voting Duration */}
                <div>
                  <Label htmlFor="hours">Voting Duration (hours)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="hours"
                      type="number"
                      min="24"
                      max="168"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hours: parseInt(e.target.value) || 72,
                        }))
                      }
                      className={errors.hours ? "border-red-300 w-32" : "w-32"}
                    />
                    <div className="text-sm text-gray-600">
                      ≈ {estimatedTimeToDecision} day
                      {estimatedTimeToDecision > 1 ? "s" : ""}
                    </div>
                  </div>
                  {errors.hours && (
                    <p className="text-sm text-red-600 mt-1">{errors.hours}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 72-96 hours for standard policies, 24-48 hours
                    for urgent matters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    disabled={
                      submitting || !formData.title || !formData.rationale
                    }
                    onClick={submit}
                    className="bg-medical-600 hover:bg-medical-700 min-w-[140px]"
                  >
                    {submitting ? "Submitting..." : "Submit Proposal"}
                  </Button>
                </div>

                {errors.submit && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proposal Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <strong>Estimated Participants:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{estimatedParticipants} organizations</span>
                  </div>
                </div>

                <div className="text-sm">
                  <strong>Voting Period:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {formData.hours} hours ({estimatedTimeToDecision} days)
                    </span>
                  </div>
                </div>

                <div className="text-sm">
                  <strong>Required for Passage:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span>
                      ≥50% approval ({Math.ceil(estimatedParticipants * 0.5)}{" "}
                      votes)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Clear Title:</strong> Make it descriptive and
                    specific
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Detailed Rationale:</strong> Explain the problem and
                    solution
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Realistic Timeline:</strong> Allow adequate voting
                    time
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>Valid JSON:</strong> Test parameters before
                    submission
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Policy Guidelines
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Examples
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OrganizationLayout>
  );
}
