// netlify/functions/createProposal.js
// Create a policy proposal on behalf of an organization

import { JsonRpcProvider, Wallet, Contract } from "ethers";

const ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "proposerOrgId", type: "uint256" },
      { internalType: "string",  name: "ipfsCid",       type: "string"  },
      { internalType: "uint48",  name: "startTime",     type: "uint48"  },
      { internalType: "uint48",  name: "endTime",       type: "uint48"  }
    ],
    name: "createProposalOnBehalf",
    outputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
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

    const { proposerOrgId, ipfsCid, startTime, endTime } = JSON.parse(event.body || "{}");

    // Basic validation
    const orgId = Number(proposerOrgId);
    if (!Number.isInteger(orgId) || orgId <= 0) return { statusCode: 400, body: "Invalid proposerOrgId" };
    if (!ipfsCid || typeof ipfsCid !== "string") return { statusCode: 400, body: "Missing/invalid ipfsCid" };

    const start = Number(startTime);
    const end = Number(endTime);
    if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) {
      return { statusCode: 400, body: "Invalid startTime/endTime" };
    }

    // Send tx
    const tx = await contract.createProposalOnBehalf(orgId, ipfsCid, start, end);
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
    console.error("createProposal error:", err);
    return { statusCode: 500, body: "Proposal creation failed" };
  }
};
