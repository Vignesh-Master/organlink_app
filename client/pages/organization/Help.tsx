import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HelpCircle,
  FileText,
  Vote,
  Users,
  Shield,
  Link2,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  Book,
  Video,
  Download,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: any;
  articles: number;
  category: string;
}

export default function OrganizationHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const helpTopics: HelpTopic[] = [
    {
      id: "proposals",
      title: "Creating Proposals",
      description: "Learn how to create and submit policy proposals",
      icon: FileText,
      articles: 8,
      category: "proposals",
    },
    {
      id: "voting",
      title: "Voting Process",
      description: "Understanding the voting mechanism and deadlines",
      icon: Vote,
      articles: 12,
      category: "voting",
    },
    {
      id: "blockchain",
      title: "Blockchain Integration",
      description: "How blockchain ensures transparency and immutability",
      icon: Shield,
      articles: 6,
      category: "technical",
    },
    {
      id: "governance",
      title: "Governance Framework",
      description: "Rules and procedures for organizational governance",
      icon: Users,
      articles: 10,
      category: "governance",
    },
    {
      id: "notifications",
      title: "Notifications & Alerts",
      description: "Managing your notification preferences",
      icon: Bell,
      articles: 5,
      category: "account",
    },
    {
      id: "profile",
      title: "Organization Profile",
      description: "Managing your organization's information",
      icon: Building2,
      articles: 4,
      category: "account",
    },
  ];

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "How do I create a new policy proposal?",
      answer: "To create a new policy proposal, navigate to the 'Propose Policy' section in the sidebar. Fill in all required fields including title, rationale, and policy parameters. Your proposal will be uploaded to IPFS and recorded on the blockchain for transparency.",
      category: "proposals",
      tags: ["proposal", "create", "policy"],
    },
    {
      id: "2",
      question: "When can I vote on proposals?",
      answer: "You can vote on proposals created by other organizations during their active voting period. Note that you cannot vote on proposals created by your own organization. Voting deadlines are clearly displayed in the dashboard.",
      category: "voting",
      tags: ["voting", "deadline", "eligibility"],
    },
    {
      id: "3",
      question: "How is the voting outcome determined?",
      answer: "A proposal passes if it receives 'For' votes from at least 50% of eligible organizations (excluding the proposer). The system takes a snapshot of active organizations at proposal creation time.",
      category: "voting",
      tags: ["voting", "outcome", "majority"],
    },
    {
      id: "4",
      question: "What happens if I miss a voting deadline?",
      answer: "If you miss a voting deadline, you cannot cast your vote for that proposal. The system will proceed to finalization with the votes received. We recommend enabling notifications to stay updated on upcoming deadlines.",
      category: "voting",
      tags: ["deadline", "missed", "notification"],
    },
    {
      id: "5",
      question: "How is blockchain used in the system?",
      answer: "Blockchain ensures immutability and transparency. All proposals, votes, and finalizations are recorded on the Ethereum Sepolia testnet. Supporting documents are stored on IPFS with their CIDs recorded on-chain.",
      category: "technical",
      tags: ["blockchain", "transparency", "ipfs"],
    },
    {
      id: "6",
      question: "Can I change my vote after submission?",
      answer: "No, votes are immutable once submitted to the blockchain. Please review your decision carefully before casting your vote. You can view proposal details and supporting documents before voting.",
      category: "voting",
      tags: ["vote", "change", "immutable"],
    },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "All Topics", count: faqs.length },
    { id: "proposals", label: "Proposals", count: faqs.filter(f => f.category === "proposals").length },
    { id: "voting", label: "Voting", count: faqs.filter(f => f.category === "voting").length },
    { id: "governance", label: "Governance", count: faqs.filter(f => f.category === "governance").length },
    { id: "technical", label: "Technical", count: faqs.filter(f => f.category === "technical").length },
    { id: "account", label: "Account", count: faqs.filter(f => f.category === "account").length },
  ];

  return (
    <OrganizationLayout
      title="Help & Support"
      subtitle="Get help with OrganLink's organization portal"
    >
      <div className="space-y-6">
        {/* Quick Start Guide */}
        <Alert className="border-medical-200 bg-medical-50">
          <Info className="h-4 w-4 text-medical-600" />
          <AlertDescription>
            <strong>New to OrganLink?</strong> Start with our quick guide to
            understanding the policy governance process and how to participate
            effectively.
          </AlertDescription>
        </Alert>

        {/* Emergency Contact */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>Emergency Support:</strong> For urgent technical issues
            affecting voting deadlines, contact our 24/7 support at{" "}
            <a
              href="mailto:emergency@organlink.org"
              className="text-orange-600 underline"
            >
              emergency@organlink.org
            </a>{" "}
            or call +1-800-ORGANLINK.
          </AlertDescription>
        </Alert>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Help Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search FAQs, guides, and help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Video className="h-8 w-8 text-medical-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-gray-600 mb-4">
                Watch step-by-step guides for all platform features
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch Now
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Book className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">User Manual</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive documentation for all features
              </p>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get instant help from our support team
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Browse Help Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {helpTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-medical-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-medical-100 rounded-lg flex items-center justify-center mr-4">
                    <topic.icon className="h-5 w-5 text-medical-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{topic.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      {topic.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {topic.articles} articles
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No FAQs found matching your search.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <div key={faq.id}>
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <h4 className="font-medium text-gray-900 flex-1">
                          {faq.question}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {faq.category}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                        </div>
                      </summary>
                      <div className="p-4 bg-white border border-gray-200 rounded-b-lg">
                        <p className="text-gray-700 mb-3">{faq.answer}</p>
                        <div className="flex flex-wrap gap-1">
                          {faq.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </details>
                    {index < filteredFAQs.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Mail className="h-6 w-6 text-medical-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Email Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Get help via email within 24 hours
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:support@organlink.org">
                    Email Us
                  </a>
                </Button>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Phone className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Phone Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Mon-Fri, 9 AM - 6 PM EST
                </p>
                <Button variant="outline" size="sm">
                  +1-800-ORGANLINK
                </Button>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <h4 className="font-medium mb-1">Emergency</h4>
                <p className="text-sm text-gray-600 mb-3">
                  24/7 for critical issues
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:emergency@organlink.org">
                    Emergency Contact
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Blockchain Network</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">IPFS Storage</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Database</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" asChild>
                <a href="https://status.organlink.org" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Status Page
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
