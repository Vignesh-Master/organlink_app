import Layout from "@/components/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OrganizationLayout from "@/components/organization/OrganizationLayout";
import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Users,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface Proposal {
  id: number;
  proposerOrgId: number;
  ipfsCid: string;
  startTime: number;
  endTime: number;
  status: number; // 0=Active, 1=Finalized, 2=Canceled
  eligibleCount: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  passed: boolean;
}

interface Tally {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  eligibleCount: number;
}

interface ProposalMetadata {
  title?: string;
  rationale?: string;
  parameters?: any;
  createdAt?: string;
}

export default function Vote() {
  const [proposalId, setProposalId] = useState<string>("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [metadata, setMetadata] = useState<ProposalMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [votingReason, setVotingReason] = useState("");

  const fetchProposal = async () => {
    if (!proposalId || isNaN(Number(proposalId))) return;

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("organization_token");
      const res = await fetch(
        `/api/organization/policies/proposal/${proposalId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        throw new Error("Failed to fetch proposal");
      }

      const data = await res.json();
      setProposal(data.proposal);
      setTally(data.tally);

      // Try to fetch metadata from IPFS (would need real implementation)
      if (data.proposal?.ipfsCid) {
        // For demo, set mock metadata
        setMetadata({
          title: `Policy Proposal #${proposalId}`,
          rationale:
            "This proposal aims to improve organ allocation efficiency and ensure fair distribution based on medical need and compatibility.",
          parameters: {
            organ: "kidney",
            priority_factors: [
              "medical_urgency",
              "compatibility_score",
              "waiting_time",
            ],
            geographic_preference: true,
          },
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch proposal");
    } finally {
      setLoading(false);
    }
  };

  const vote = async (voteType: 1 | 2 | 3) => {
    setVoting(true);
    setError(null);
    try {
      const token = localStorage.getItem("organization_token");
      const res = await fetch("/api/organization/policies/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposal_id: Number(proposalId),
          vote: voteType,
          reason: votingReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to vote");
      }

      setTx(data.txHash);

      // Refresh proposal data after voting
      setTimeout(() => {
        fetchProposal();
      }, 2000);
    } catch (e: any) {
      setError(e.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const isVotingOpen =
    proposal &&
    proposal.status === 0 &&
    Date.now() / 1000 >= proposal.startTime &&
    Date.now() / 1000 <= proposal.endTime;

  const getStatusBadge = () => {
    if (!proposal) return null;

    if (proposal.status === 2) {
      return <Badge variant="destructive">Canceled</Badge>;
    }

    if (proposal.status === 1) {
      return (
        <Badge variant={proposal.passed ? "default" : "secondary"}>
          {proposal.passed ? "Passed" : "Failed"}
        </Badge>
      );
    }

    if (Date.now() / 1000 > proposal.endTime) {
      return <Badge variant="outline">Voting Ended</Badge>;
    }

    if (Date.now() / 1000 < proposal.startTime) {
      return <Badge variant="outline">Not Started</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getTimeRemaining = () => {
    if (!proposal) return "";

    const now = Date.now() / 1000;
    const timeLeft = proposal.endTime - now;

    if (timeLeft <= 0) return "Voting ended";

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? "s" : ""} remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  };

  const calculatePassingThreshold = () => {
    if (!tally) return 0;
    return Math.ceil(tally.eligibleCount * 0.5);
  };

  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId]);

  return (
    <OrganizationLayout
      title="Vote on Policy"
      subtitle="Review and cast your organization's vote"
    >
      <div className="max-w-4xl space-y-6">
        {/* Proposal ID Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposal Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <input
                className="flex-1 border rounded-md px-3 py-2"
                placeholder="Enter Proposal ID (e.g., 1, 2, 3...)"
                value={proposalId}
                onChange={(e) => setProposalId(e.target.value)}
              />
              <Button
                onClick={fetchProposal}
                disabled={!proposalId || loading}
                variant="outline"
              >
                {loading ? "Loading..." : "Fetch Proposal"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Proposal Details */}
        {proposal && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Proposal Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Proposal #{proposal.id}</CardTitle>
                    {getStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metadata && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {metadata.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {metadata.rationale}
                        </p>
                      </div>

                      {metadata.parameters && (
                        <div>
                          <h4 className="font-medium mb-2">
                            Policy Parameters
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-sm">
                              {JSON.stringify(metadata.parameters, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getTimeRemaining()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {tally?.eligibleCount || 0} eligible voters
                    </div>
                    {proposal.ipfsCid && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${proposal.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on IPFS
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Voting Section */}
              {isVotingOpen && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cast Your Vote</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Voting Rationale (Optional)
                      </label>
                      <Textarea
                        placeholder="Explain your organization's position on this proposal..."
                        value={votingReason}
                        onChange={(e) => setVotingReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => vote(1)}
                        disabled={voting}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vote For
                      </Button>
                      <Button
                        onClick={() => vote(2)}
                        disabled={voting}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Vote Against
                      </Button>
                      <Button
                        onClick={() => vote(3)}
                        disabled={voting}
                        variant="outline"
                        className="flex-1"
                      >
                        <MinusCircle className="h-4 w-4 mr-2" />
                        Abstain
                      </Button>
                    </div>

                    {voting && (
                      <p className="text-sm text-gray-600 text-center">
                        Submitting vote to blockchain...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {!isVotingOpen && proposal && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {proposal.status === 1
                      ? "This proposal has been finalized."
                      : proposal.status === 2
                        ? "This proposal has been canceled."
                        : Date.now() / 1000 > proposal.endTime
                          ? "Voting period has ended."
                          : "Voting has not started yet."}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Voting Stats Sidebar */}
            <div className="space-y-6">
              {tally && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Current Tally</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          For
                        </span>
                        <span className="font-semibold">{tally.forVotes}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-red-700">
                          <XCircle className="h-4 w-4" />
                          Against
                        </span>
                        <span className="font-semibold">
                          {tally.againstVotes}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-gray-600">
                          <MinusCircle className="h-4 w-4" />
                          Abstain
                        </span>
                        <span className="font-semibold">
                          {tally.abstainVotes}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Total Votes</span>
                        <span>
                          {tally.forVotes +
                            tally.againstVotes +
                            tally.abstainVotes}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Eligible Voters</span>
                        <span>{tally.eligibleCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Passing Threshold</span>
                        <span>{calculatePassingThreshold()}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${tally.eligibleCount > 0 ? (tally.forVotes / tally.eligibleCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 text-center">
                        {tally.eligibleCount > 0
                          ? `${Math.round((tally.forVotes / tally.eligibleCount) * 100)}% approval`
                          : "No eligible voters"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Hash */}
              {tx && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-green-700">
                      Vote Submitted!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Transaction Hash:</p>
                      <a
                        className="text-xs break-all text-blue-600 hover:underline block"
                        target="_blank"
                        href={`https://sepolia.etherscan.io/tx/${tx}`}
                        rel="noopener noreferrer"
                      >
                        {tx}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </OrganizationLayout>
  );
}
