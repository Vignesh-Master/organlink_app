// client/lib/blockchain.ts
// Utility functions for blockchain interactions

import { keccak256 } from "ethers";

// Compute docHash from file bytes
export async function computeDocHashFromFile(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  return keccak256(buf); // "0x" + 64 hex chars
}

// Send attestation to Netlify function
export async function sendAttestation({
  docHash,
  cid,
  ocrScoreBps,
  verified
}: {
  docHash: string;
  cid: string;
  ocrScoreBps: number;
  verified: boolean;
}): Promise<{ ok: boolean; txHash: string; blockNumber: number }> {
  const res = await fetch("/.netlify/functions/recordOcrAttestation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docHash, cid, ocrScoreBps, verified })
  });

  if (!res.ok) {
    throw new Error("On-chain attestation failed");
  }

  return res.json();
}

// Get latest attestation record
export async function getLatestAttestation(docHash: string): Promise<any> {
  const res = await fetch(`/.netlify/functions/getLatest?docHash=${docHash}`);
  if (!res.ok) {
    throw new Error("Failed to get attestation record");
  }
  return res.json();
}

// Create policy proposal
export async function createProposal({
  proposerOrgId,
  ipfsCid,
  startTime,
  endTime
}: {
  proposerOrgId: number;
  ipfsCid: string;
  startTime: number;
  endTime: number;
}): Promise<{ ok: boolean; txHash: string; blockNumber: number }> {
  const res = await fetch("/.netlify/functions/createProposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposerOrgId, ipfsCid, startTime, endTime })
  });

  if (!res.ok) {
    throw new Error("Proposal creation failed");
  }

  return res.json();
}

// Cast vote on proposal
export async function castVote({
  proposalId,
  voterOrgId,
  vote
}: {
  proposalId: number;
  voterOrgId: number;
  vote: 1 | 2 | 3; // 1=For, 2=Against, 3=Abstain
}): Promise<{ ok: boolean; txHash: string; blockNumber: number }> {
  const res = await fetch("/.netlify/functions/castVote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId, voterOrgId, vote })
  });

  if (!res.ok) {
    throw new Error("Vote casting failed");
  }

  return res.json();
}

// Finalize proposal
export async function finalizeProposal(proposalId: number): Promise<{ ok: boolean; txHash: string; blockNumber: number }> {
  const res = await fetch("/.netlify/functions/finalizeProposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId })
  });

  if (!res.ok) {
    throw new Error("Proposal finalization failed");
  }

  return res.json();
}

// Etherscan links
export function getEtherscanTxLink(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function getEtherscanAddressLink(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}
