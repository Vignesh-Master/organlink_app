import Layout from "@/components/shared/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { useState } from "react";

export default function Vote() {
  const [proposalId, setProposalId] = useState<string>("");
  const [tx, setTx] = useState<string | null>(null);

  async function vote(v: 1 | 2 | 3) {
    try {
      const token = localStorage.getItem("organization_token");
      const res = await fetch("/api/organization/policies/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ proposal_id: Number(proposalId), vote: v }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setTx(data.txHash);
    } catch (e: any) {
      alert(e.message || "Failed");
    }
  }

  return (
    <OrganizationLayout
      title="Vote on Policy"
      subtitle="Cast your organization's vote"
    >
      <div className="max-w-xl space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Proposal ID"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => vote(1)} variant="outline">
                Vote For
              </Button>
              <Button onClick={() => vote(2)} variant="outline">
                Against
              </Button>
              <Button onClick={() => vote(3)} variant="outline">
                Abstain
              </Button>
            </div>
            {tx && (
              <div className="text-sm text-green-700 break-all">
                TX:{" "}
                <a
                  className="underline"
                  target="_blank"
                  href={`https://sepolia.etherscan.io/tx/${tx}`}
                >
                  {tx}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
