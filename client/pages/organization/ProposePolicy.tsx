import Layout from "@/components/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function ProposePolicy() {
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");
  const [parameters, setParameters] = useState("");
  const [hours, setHours] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<number | null>(null);

  const submit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("organization_token");
      const res = await fetch("/api/organization/policies/propose-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, rationale, parameters, hours }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setTx(data.txHash);
      setProposalId(data.proposalId);
    } catch (e: any) {
      alert(e.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OrganizationLayout
      title="Propose Policy"
      subtitle="Create a policy proposal for voting"
    >
      <div className="max-w-3xl">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Propose New Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-gray-600">
              Fill the form. We pin your policy to IPFS and use the resulting
              CID in the on-chain proposal. Others get notified and can vote in
              real time.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Pediatric Priority Policy"
                />
              </div>
              <div>
                <Label>Rationale</Label>
                <Textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={4}
                  placeholder="Why this policy is needed and expected impact"
                />
              </div>
              <div>
                <Label>Parameters (JSON)</Label>
                <Textarea
                  value={parameters}
                  onChange={(e) => setParameters(e.target.value)}
                  rows={4}
                  placeholder='{"organ":"kidney","age_priority":true}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  We pin this content to IPFS; the resulting CID is referenced
                  on-chain.
                </p>
              </div>
              <div>
                <Label>Voting Window (hours)</Label>
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) =>
                    setHours(parseInt(e.target.value || "0", 10))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={submitting || !title || !rationale}
                onClick={submit}
                className="bg-medical-600 hover:bg-medical-700"
              >
                Submit Proposal
              </Button>
            </div>
            {tx && (
              <div className="text-sm text-green-700 break-all">
                Submitted. TX:{" "}
                <a
                  className="underline"
                  target="_blank"
                  href={`https://sepolia.etherscan.io/tx/${tx}`}
                >
                  {tx}
                </a>
                {proposalId !== null && <span> · Proposal #{proposalId}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
}
