// netlify/functions/castVote.js
// Cast a vote on a policy proposal

import { JsonRpcProvider, Wallet, Contract } from "ethers";

const ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint256", name: "voterOrgId", type: "uint256" },
      { internalType: "uint8",   name: "vote",       type: "uint8"   }
    ],
    name: "castVoteOnBehalf",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

let contract;

function init() {
  if (!contract) {
    const rpc = process.env.INFURA_API_URL;
    const pk = process.env.METAMASK_PRIVATE_KEY;
    const addr = process.env.POLICY_CONTRACT_ADDRESS;
    if (!rpc || !pk || !addr) throw new Error("Missing env: INFURA_API_URL/METAMASK_PRIVATE_KEY/POLICY_CONTRACT_ADDRESS");
    const provider = new JsonRpcProvider(rpc);
    const wallet = new Wallet(pk, provider);
    contract = new Contract(addr, ABI, wallet);
  }
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    init();

    const { proposalId, voterOrgId, vote } = JSON.parse(event.body || "{}");

    // Basic validation
    const propId = Number(proposalId);
    const orgId = Number(voterOrgId);
    const voteType = Number(vote);

    if (!Number.isInteger(propId) || propId <= 0) return { statusCode: 400, body: "Invalid proposalId" };
    if (!Number.isInteger(orgId) || orgId <= 0) return { statusCode: 400, body: "Invalid voterOrgId" };
    if (![1, 2, 3].includes(voteType)) return { statusCode: 400, body: "Invalid vote (must be 1=For, 2=Against, 3=Abstain)" };

    // Send tx
    const tx = await contract.castVoteOnBehalf(propId, orgId, voteType);
    const receipt = await tx.wait();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      })
    };
  } catch (err) {
    console.error("castVote error:", err);
    return { statusCode: 500, body: "Vote casting failed" };
  }
};
