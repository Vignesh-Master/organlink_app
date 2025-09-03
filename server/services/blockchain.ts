import { ethers } from "ethers";

// ABIs for deployed contracts
const SIGNATURE_VERIFIER_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "docHash", type: "bytes32" },
      { internalType: "string", name: "ipfsCid", type: "string" },
      { internalType: "uint16", name: "ocrScoreBps", type: "uint16" },
      { internalType: "bool", name: "verified", type: "bool" },
    ],
    name: "attestOcr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "docHash", type: "bytes32" }],
    name: "getLatest",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "docHash", type: "bytes32" },
          { internalType: "string", name: "ipfsCid", type: "string" },
          { internalType: "bool", name: "ocrVerified", type: "bool" },
          { internalType: "uint16", name: "ocrScoreBps", type: "uint16" },
          { internalType: "bool", name: "sigVerified", type: "bool" },
          { internalType: "address", name: "claimedSigner", type: "address" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint48", name: "attestedAt", type: "uint48" },
          { internalType: "address", name: "attestedBy", type: "address" },
          { internalType: "uint32", name: "version", type: "uint32" },
        ],
        internalType: "struct OrganLinkSignatureVerifier.Record",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const POLICY_ABI = [
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "address", name: "manager", type: "address" },
    ],
    name: "createOrganization",
    outputs: [{ internalType: "uint256", name: "orgId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "orgId", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    name: "setOrganizationActive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposerOrgId", type: "uint256" },
      { internalType: "string", name: "ipfsCid", type: "string" },
      { internalType: "uint48", name: "startTime", type: "uint48" },
      { internalType: "uint48", name: "endTime", type: "uint48" },
    ],
    name: "createProposalOnBehalf",
    outputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint256", name: "voterOrgId", type: "uint256" },
      { internalType: "uint8", name: "vote", type: "uint8" },
    ],
    name: "castVoteOnBehalf",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "finalize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposal",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "uint256", name: "proposerOrgId", type: "uint256" },
          { internalType: "string", name: "ipfsCid", type: "string" },
          { internalType: "uint48", name: "startTime", type: "uint48" },
          { internalType: "uint48", name: "endTime", type: "uint48" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint32", name: "eligibleCount", type: "uint32" },
          { internalType: "uint32", name: "forVotes", type: "uint32" },
          { internalType: "uint32", name: "againstVotes", type: "uint32" },
          { internalType: "uint32", name: "abstainVotes", type: "uint32" },
          { internalType: "bool", name: "passed", type: "bool" },
        ],
        internalType: "struct OrganLinkPolicyByOrganization.Proposal",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getTally",
    outputs: [
      { internalType: "uint32", name: "forVotes", type: "uint32" },
      { internalType: "uint32", name: "againstVotes", type: "uint32" },
      { internalType: "uint32", name: "abstainVotes", type: "uint32" },
      { internalType: "uint32", name: "eligibleCount", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private signatureVerifier: ethers.Contract;
  private policyContract: ethers.Contract;

  constructor() {
    // Provider & wallet
    const rpcUrl =
      process.env.INFURA_API_URL ||
      "https://sepolia.infura.io/v3/6587311a93fe4c34adcef72bd583ea46";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.METAMASK_PRIVATE_KEY || "";
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Contracts
    const signatureAddress =
      process.env.SIGNATURE_VERIFIER_ADDRESS ||
      "0xac793b5fadbb6c5284e9fcc0bd25d770fb33439f";
    const policyAddress =
      process.env.POLICY_CONTRACT_ADDRESS ||
      "0xe84ef74ae1ec05e8650c2cd2b5e9579fec5c6c92";

    this.signatureVerifier = new ethers.Contract(
      signatureAddress,
      SIGNATURE_VERIFIER_ABI,
      this.wallet,
    );

    this.policyContract = new ethers.Contract(
      policyAddress,
      POLICY_ABI,
      this.wallet,
    );
  }

  // ========== Signature Verifier ==========
  async attestOcr(
    docHash: string,
    ipfsCid: string,
    ocrScoreBps: number,
    verified: boolean,
  ): Promise<string> {
    const tx = await this.signatureVerifier.attestOcr(
      docHash,
      ipfsCid,
      ocrScoreBps,
      verified,
    );
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  async getLatest(docHash: string): Promise<any> {
    return await this.signatureVerifier.getLatest(docHash);
  }

  // ========== Policy Governance ==========
  async createOrganization(
    name: string,
    manager: string,
  ): Promise<{ txHash: string; orgId: string }> {
    const tx = await this.policyContract.createOrganization(name, manager);
    const receipt = await tx.wait();
    const orgId = await this.extractReturnValueFromReceipt(receipt);
    return { txHash: receipt.hash as string, orgId: String(orgId ?? "") };
  }

  async setOrganizationActive(orgId: number, active: boolean): Promise<string> {
    const tx = await this.policyContract.setOrganizationActive(orgId, active);
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  async createProposalOnBehalf(
    proposerOrgId: number,
    ipfsCid: string,
    startTime: number,
    endTime: number,
  ): Promise<{ txHash: string; proposalId: string }> {
    const tx = await this.policyContract.createProposalOnBehalf(
      proposerOrgId,
      ipfsCid,
      startTime,
      endTime,
    );
    const receipt = await tx.wait();
    const proposalId = await this.extractReturnValueFromReceipt(receipt);
    return {
      txHash: receipt.hash as string,
      proposalId: String(proposalId ?? ""),
    };
  }

  async castVoteOnBehalf(
    proposalId: number,
    voterOrgId: number,
    vote: 1 | 2 | 3,
  ): Promise<string> {
    const tx = await this.policyContract.castVoteOnBehalf(
      proposalId,
      voterOrgId,
      vote,
    );
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  async finalize(proposalId: number): Promise<string> {
    const tx = await this.policyContract.finalize(proposalId);
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  async getProposal(proposalId: number): Promise<any> {
    return await this.policyContract.getProposal(proposalId);
  }

  async getTally(proposalId: number): Promise<{
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    eligibleCount: number;
  }> {
    const [forVotes, againstVotes, abstainVotes, eligibleCount] =
      await this.policyContract.getTally(proposalId);
    return {
      forVotes: Number(forVotes),
      againstVotes: Number(againstVotes),
      abstainVotes: Number(abstainVotes),
      eligibleCount: Number(eligibleCount),
    };
  }

  // ========== Utility & Status ==========
  getWalletAddress(): string {
    return this.wallet.address;
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.provider.getNetwork();
      return true;
    } catch (e) {
      return false;
    }
  }

  private async extractReturnValueFromReceipt(
    receipt: ethers.TransactionReceipt,
  ) {
    try {
      // Ethers v6 does not decode return values from events automatically here;
      // many OpenZeppelin functions emit events with the created id. Consumers
      // should read events or re-query chain. We'll just return undefined here.
      return undefined;
    } catch {
      return undefined;
    }
  }
}

export const blockchainService = new BlockchainService();
