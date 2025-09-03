import Layout from "@/components/shared/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { useEffect, useState } from "react";

export default function PoliciesList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Reuse admin logs endpoint for demo listing (DB backed)
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`/api/admin/logs/policies?page=1&limit=20`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        setItems(data.policies || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <OrganizationLayout
      title="Global Policies"
      subtitle="Review active and finalized proposals"
    >
      <div className="max-w-4xl">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This list aggregates policies with their current tallies for quick
              review.
            </p>
            {items.map((p) => (
              <Card key={p.id || p.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-gray-600">
                        {p.category || "governance"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">For: {p.votes_for ?? 0}</div>
                      <div className="text-sm">
                        Against: {p.votes_against ?? 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </OrganizationLayout>
  );
}
