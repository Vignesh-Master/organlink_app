// netlify/functions/recordOcrAttestation.js
// Sends an admin-only tx to OrganLinkSignatureVerifier.attestOcr
// Body: { docHash: "0x...", cid: "bafy...", ocrScoreBps: 0..10000, verified: true/false }

import { JsonRpcProvider, Wallet, Contract } from "ethers";

// Minimal ABI (only what we need)
const ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "docHash", type: "bytes32" },
      { internalType: "string",  name: "ipfsCid", type: "string"  },
      { internalType: "uint16",  name: "ocrScoreBps", type: "uint16" },
      { internalType: "bool",    name: "verified", type: "bool" }
    ],
    name: "attestOcr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// Reuse provider/contract across invocations (Netlify keeps function warm)
let contract;

function init() {
  if (!contract) {
    const rpc = process.env.INFURA_API_URL;
    const pk = process.env.METAMASK_PRIVATE_KEY;
    const addr = process.env.SIGNATURE_VERIFIER_ADDRESS;
    if (!rpc || !pk || !addr) throw new Error("Missing env: INFURA_API_URL/METAMASK_PRIVATE_KEY/SIGNATURE_VERIFIER_ADDRESS");
    const provider = new JsonRpcProvider(rpc);
    const wallet = new Wallet(pk, provider);
    contract = new Contract(addr, ABI, wallet);
  }
}

function isValidBytes32(hex) {
  return /^0x[0-9a-fA-F]{64}$/.test(hex || "");
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    init();

    const { docHash, cid, ocrScoreBps, verified } = JSON.parse(event.body || "{}");

    // Basic validation
    if (!isValidBytes32(docHash)) return { statusCode: 400, body: "Invalid docHash (must be 0x + 64 hex)" };
    if (!cid || typeof cid !== "string") return { statusCode: 400, body: "Missing/invalid cid" };
    const score = Number(ocrScoreBps);
    if (!Number.isInteger(score) || score < 0 || score > 10000) {
      return { statusCode: 400, body: "ocrScoreBps must be integer 0..10000" };
    }
    if (typeof verified !== "boolean") return { statusCode: 400, body: "verified must be boolean" };

    // Send tx
    const tx = await contract.attestOcr(docHash, cid, score, verified);
    const receipt = await tx.wait(); // waits for 1 block

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      })
    };
  } catch (err) {
    console.error("recordOcrAttestation error:", err);
    return { statusCode: 500, body: "On-chain attestation failed" };
  }
};
