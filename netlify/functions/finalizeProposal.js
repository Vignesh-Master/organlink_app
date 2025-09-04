// netlify/functions/finalizeProposal.js
// Finalize a policy proposal after voting period ends

import { JsonRpcProvider, Wallet, Contract } from "ethers";

const ABI = [
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "finalize",
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

    const { proposalId } = JSON.parse(event.body || "{}");

    // Basic validation
    const propId = Number(proposalId);
    if (!Number.isInteger(propId) || propId <= 0) return { statusCode: 400, body: "Invalid proposalId" };

    // Send tx
    const tx = await contract.finalize(propId);
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
    console.error("finalizeProposal error:", err);
    return { statusCode: 500, body: "Proposal finalization failed" };
  }
};
