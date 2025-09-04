// netlify/functions/getLatest.js
// Query latest record for a docHash. Body OR querystring: { docHash: "0x..." }

import { JsonRpcProvider, Contract } from "ethers";

const ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "docHash", type: "bytes32" }],
    name: "getLatest",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "docHash",       type: "bytes32" },
          { internalType: "string",  name: "ipfsCid",       type: "string"  },
          { internalType: "bool",    name: "ocrVerified",   type: "bool"    },
          { internalType: "uint16",  name: "ocrScoreBps",   type: "uint16"  },
          { internalType: "bool",    name: "sigVerified",   type: "bool"    },
          { internalType: "address", name: "claimedSigner", type: "address" },
          { internalType: "uint8",   name: "status",        type: "uint8"   },
          { internalType: "uint48",  name: "attestedAt",    type: "uint48"  },
          { internalType: "address", name: "attestedBy",    type: "address" },
          { internalType: "uint32",  name: "version",       type: "uint32"  }
        ],
        internalType: "struct OrganLinkSignatureVerifier.Record",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

function isValidBytes32(hex) {
  return /^0x[0-9a-fA-F]{64}$/.test(hex || "");
}

export const handler = async (event) => {
  try {
    const rpc = process.env.INFURA_API_URL;
    const addr = process.env.SIGNATURE_VERIFIER_ADDRESS;
    if (!rpc || !addr) return { statusCode: 500, body: "Missing env" };

    const provider = new JsonRpcProvider(rpc);
    const contract = new Contract(addr, ABI, provider);

    const payload = event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : {};
    const docHash = payload.docHash || (event.queryStringParameters || {}).docHash;

    if (!isValidBytes32(docHash)) return { statusCode: 400, body: "Invalid docHash" };

    const rec = await contract.getLatest(docHash);
    return { statusCode: 200, body: JSON.stringify(rec) };
  } catch (err) {
    console.error("getLatest error:", err);
    return { statusCode: 500, body: "Read failed" };
  }
};
