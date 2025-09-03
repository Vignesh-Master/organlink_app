import Layout from "@/components/shared/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Vote, BarChart3, History } from "lucide-react";
import OrganizationLayout from "@/components/organization/OrganizationLayout";

export default function OrganizationDashboard() {
  return (
    <OrganizationLayout title="Organization Dashboard">
      <div className="px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Organization Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Propose New Policy</span>
                <FileText className="h-5 w-5 text-medical-600" />
              </div>
              <Button className="w-full" variant="outline" asChild>
                <a href="/organization/policies/propose">Create</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Vote on Policies</span>
                <Vote className="h-5 w-5 text-medical-600" />
              </div>
              <Button className="w-full" variant="outline" asChild>
                <a href="/organization/policies/vote">Open</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Policy History</span>
                <History className="h-5 w-5 text-medical-600" />
              </div>
              <Button className="w-full" variant="outline" asChild>
                <a href="/organization/policies">View</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Analytics</span>
                <BarChart3 className="h-5 w-5 text-medical-600" />
              </div>
              <Button className="w-full" variant="outline">
                Insights
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Recent Activity</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Voted on Pediatric Priority Policy — Approved</li>
                <li>Proposed Geographic Proximity Rule — Pending</li>
                <li>Voted on Emergency Protocol — Approved</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-0">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Active Proposals</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Cross-Border Allocation (Kidney) — Voting</li>
                <li>AI Matching Enhancement — Voting</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </OrganizationLayout>
  );
}
