import express from "express";
import { z } from "zod";
import { blockchainService } from "../services/blockchain.js";
import { ipfsService } from "../services/ipfs.js";

const router = express.Router();

// Schema validation
const CreateOrgSchema = z.object({
  name: z.string().min(1).max(100),
  manager: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
});

const SetOrgActiveSchema = z.object({
  orgId: z.number().int().positive(),
  active: z.boolean(),
});

const CreateProposalSchema = z.object({
  proposerOrgId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  rationale: z.string().min(1),
  parameters: z.record(z.any()),
  startTime: z.number().int().optional(),
  endTime: z.number().int().positive(),
});

const CastVoteSchema = z.object({
  proposalId: z.number().int().positive(),
  voterOrgId: z.number().int().positive(),
  vote: z.enum(["1", "2", "3"]).or(z.number().min(1).max(3)),
});

const FinalizeSchema = z.object({
  proposalId: z.number().int().positive(),
});

// Create organization
router.post("/create-organization", async (req, res) => {
  try {
    const validatedData = CreateOrgSchema.parse(req.body);
    const { name, manager } = validatedData;

    // Use zero address as default manager if not provided
    const managerAddress =
      manager || "0x0000000000000000000000000000000000000000";

    const result = await blockchainService.createOrganization(
      name,
      managerAddress,
    );

    res.json({
      success: true,
      data: {
        orgName: name,
        manager: managerAddress,
        orgId: result.orgId,
        txHash: result.txHash,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${result.txHash}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.errors,
      });
    }

    console.error("Create organization error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create organization",
    });
  }
});

// Set organization active status
router.post("/set-organization-active", async (req, res) => {
  try {
    const validatedData = SetOrgActiveSchema.parse(req.body);
    const { orgId, active } = validatedData;

    const txHash = await blockchainService.setOrganizationActive(orgId, active);

    res.json({
      success: true,
      data: {
        orgId,
        active,
        txHash,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.errors,
      });
    }

    console.error("Set organization active error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to set organization status",
    });
  }
});

// Create proposal
router.post("/create-proposal", async (req, res) => {
  try {
    const validatedData = CreateProposalSchema.parse(req.body);
    const { proposerOrgId, title, rationale, parameters, startTime, endTime } =
      validatedData;

    // Prepare proposal data for IPFS
    const proposalData = {
      title,
      rationale,
      parameters,
      proposerOrgId,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    // Upload proposal to IPFS
    const ipfsCid = await ipfsService.pinJSON(
      proposalData,
      `proposal-${title}`,
    );

    // Use current time as start time if not provided
    const actualStartTime = startTime || Math.floor(Date.now() / 1000);

    // Create proposal on blockchain
    const result = await blockchainService.createProposalOnBehalf(
      proposerOrgId,
      ipfsCid,
      actualStartTime,
      endTime,
    );

    res.json({
      success: true,
      data: {
        proposalId: result.proposalId,
        proposerOrgId,
        title,
        ipfsCid,
        startTime: actualStartTime,
        endTime,
        txHash: result.txHash,
        ipfsUrl: ipfsService.getFileUrl(ipfsCid),
        etherscanUrl: `https://sepolia.etherscan.io/tx/${result.txHash}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.errors,
      });
    }

    console.error("Create proposal error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create proposal",
    });
  }
});

// Cast vote
router.post("/cast-vote", async (req, res) => {
  try {
    const validatedData = CastVoteSchema.parse(req.body);
    let { proposalId, voterOrgId, vote } = validatedData;

    // Convert vote to number if it's a string
    if (typeof vote === "string") {
      vote = parseInt(vote);
    }

    // Validate vote value (1=For, 2=Against, 3=Abstain)
    if (![1, 2, 3].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: "Vote must be 1 (For), 2 (Against), or 3 (Abstain)",
      });
    }

    const txHash = await blockchainService.castVoteOnBehalf(
      proposalId,
      voterOrgId,
      vote as 1 | 2 | 3,
    );

    const voteLabels = { 1: "For", 2: "Against", 3: "Abstain" };

    res.json({
      success: true,
      data: {
        proposalId,
        voterOrgId,
        vote: vote,
        voteLabel: voteLabels[vote as keyof typeof voteLabels],
        txHash,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.errors,
      });
    }

    console.error("Cast vote error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to cast vote",
    });
  }
});

// Finalize proposal
router.post("/finalize-proposal", async (req, res) => {
  try {
    const validatedData = FinalizeSchema.parse(req.body);
    const { proposalId } = validatedData;

    // Get proposal details before finalizing
    const proposalBefore = await blockchainService.getProposal(proposalId);

    // Finalize the proposal
    const txHash = await blockchainService.finalize(proposalId);

    // Get updated proposal details
    const proposalAfter = await blockchainService.getProposal(proposalId);

    res.json({
      success: true,
      data: {
        proposalId,
        status: Number(proposalAfter.status),
        passed: proposalAfter.passed,
        forVotes: Number(proposalAfter.forVotes),
        againstVotes: Number(proposalAfter.againstVotes),
        abstainVotes: Number(proposalAfter.abstainVotes),
        eligibleCount: Number(proposalAfter.eligibleCount),
        txHash,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid input data",
        details: error.errors,
      });
    }

    console.error("Finalize proposal error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to finalize proposal",
    });
  }
});

// Get proposal details
router.get("/get-proposal", async (req, res) => {
  try {
    const { proposalId } = req.query;

    if (!proposalId || isNaN(Number(proposalId))) {
      return res.status(400).json({
        success: false,
        error: "Valid proposal ID is required",
      });
    }

    const proposal = await blockchainService.getProposal(Number(proposalId));

    // Check if proposal exists
    if (Number(proposal.id) === 0) {
      return res.status(404).json({
        success: false,
        error: "Proposal not found",
      });
    }

    // Get proposal content from IPFS if available
    let proposalContent = null;
    if (proposal.ipfsCid) {
      try {
        const ipfsData = await ipfsService.getFile(proposal.ipfsCid);
        proposalContent = JSON.parse(ipfsData.toString());
      } catch (error) {
        console.warn("Could not retrieve proposal content from IPFS:", error);
      }
    }

    const statusLabels = {
      0: "Active",
      1: "Finalized",
      2: "Cancelled",
    };

    res.json({
      success: true,
      data: {
        id: Number(proposal.id),
        proposerOrgId: Number(proposal.proposerOrgId),
        ipfsCid: proposal.ipfsCid,
        startTime: Number(proposal.startTime),
        endTime: Number(proposal.endTime),
        status: Number(proposal.status),
        statusLabel:
          statusLabels[Number(proposal.status) as keyof typeof statusLabels] ||
          "Unknown",
        eligibleCount: Number(proposal.eligibleCount),
        forVotes: Number(proposal.forVotes),
        againstVotes: Number(proposal.againstVotes),
        abstainVotes: Number(proposal.abstainVotes),
        passed: proposal.passed,
        proposalContent,
        ipfsUrl: proposal.ipfsCid
          ? ipfsService.getFileUrl(proposal.ipfsCid)
          : null,
      },
    });
  } catch (error: any) {
    console.error("Get proposal error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve proposal",
    });
  }
});

// Get proposal vote tally
router.get("/get-tally", async (req, res) => {
  try {
    const { proposalId } = req.query;

    if (!proposalId || isNaN(Number(proposalId))) {
      return res.status(400).json({
        success: false,
        error: "Valid proposal ID is required",
      });
    }

    const tally = await blockchainService.getTally(Number(proposalId));

    // Calculate percentages
    const totalVotes = tally.forVotes + tally.againstVotes + tally.abstainVotes;
    const participation =
      tally.eligibleCount > 0 ? (totalVotes / tally.eligibleCount) * 100 : 0;

    // Determine if proposal would pass (For votes >= 50% of eligible)
    const requiredVotes = Math.ceil(tally.eligibleCount * 0.5);
    const wouldPass = tally.forVotes >= requiredVotes;

    res.json({
      success: true,
      data: {
        proposalId: Number(proposalId),
        forVotes: tally.forVotes,
        againstVotes: tally.againstVotes,
        abstainVotes: tally.abstainVotes,
        eligibleCount: tally.eligibleCount,
        totalVotes,
        participation: Math.round(participation * 100) / 100,
        requiredVotes,
        wouldPass,
        breakdown: {
          forPercentage:
            totalVotes > 0
              ? Math.round((tally.forVotes / totalVotes) * 10000) / 100
              : 0,
          againstPercentage:
            totalVotes > 0
              ? Math.round((tally.againstVotes / totalVotes) * 10000) / 100
              : 0,
          abstainPercentage:
            totalVotes > 0
              ? Math.round((tally.abstainVotes / totalVotes) * 10000) / 100
              : 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Get tally error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve vote tally",
    });
  }
});

// Get service status
router.get("/status", async (req, res) => {
  try {
    const blockchainConnected = await blockchainService.testConnection();
    const ipfsConnected = await ipfsService.testConnection();
    const walletAddress = blockchainService.getWalletAddress();
    const balance = await blockchainService.getBalance();

    res.json({
      success: true,
      status: {
        blockchain: {
          connected: blockchainConnected,
          walletAddress,
          balance: `${balance} ETH`,
        },
        ipfs: {
          connected: ipfsConnected,
        },
        services: {
          policyGovernance: blockchainConnected && ipfsConnected,
        },
      },
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check service status",
    });
  }
});

// Batch operations for testing
router.post("/setup-demo-organizations", async (req, res) => {
  try {
    const organizations = [
      {
        name: "World Health Organization",
        manager: "0x0000000000000000000000000000000000000001",
      },
      {
        name: "Pan American Health Organization",
        manager: "0x0000000000000000000000000000000000000002",
      },
      {
        name: "Health Services Research Administration",
        manager: "0x0000000000000000000000000000000000000003",
      },
    ];

    const results = [];

    for (const org of organizations) {
      try {
        const result = await blockchainService.createOrganization(
          org.name,
          org.manager,
        );
        results.push({
          name: org.name,
          orgId: result.orgId,
          txHash: result.txHash,
          success: true,
        });

        // Wait a bit between transactions
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        results.push({
          name: org.name,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        organizationsCreated: results.filter((r) => r.success).length,
        results,
      },
    });
  } catch (error: any) {
    console.error("Setup demo organizations error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to setup demo organizations",
    });
  }
});

// Demo proposal for testing
router.post("/create-demo-proposal", async (req, res) => {
  try {
    const demoProposal = {
      proposerOrgId: 1, // WHO
      title: "Pediatric Kidney Transplant Priority Policy",
      rationale:
        "Improve outcomes for patients under 18 by prioritizing kidney allocation based on age and medical urgency.",
      parameters: {
        organ: "kidney",
        age_priority: true,
        priority_age_threshold: 18,
        effective_date: "2025-09-15",
        review_period_months: 12,
      },
      endTime: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    };

    // Upload proposal to IPFS
    const ipfsCid = await ipfsService.pinJSON(
      demoProposal,
      `demo-proposal-${Date.now()}`,
    );

    // Create proposal on blockchain
    const result = await blockchainService.createProposalOnBehalf(
      demoProposal.proposerOrgId,
      ipfsCid,
      Math.floor(Date.now() / 1000),
      demoProposal.endTime,
    );

    res.json({
      success: true,
      data: {
        proposalId: result.proposalId,
        title: demoProposal.title,
        ipfsCid,
        txHash: result.txHash,
        ipfsUrl: ipfsService.getFileUrl(ipfsCid),
        etherscanUrl: `https://sepolia.etherscan.io/tx/${result.txHash}`,
        votingDeadline: new Date(demoProposal.endTime * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Create demo proposal error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create demo proposal",
    });
  }
});

export default router;
