import { Router, Request, Response } from "express";
import { blockchainService } from "../services/blockchain.js";

const router = Router();

// Test blockchain connection and basic functionality
router.get("/status", async (req: Request, res: Response) => {
  try {
    const isConnected = await blockchainService.testConnection();
    const walletAddress = blockchainService.getWalletAddress();
    const balance = await blockchainService.getBalance();

    res.json({
      success: true,
      blockchain: {
        connected: isConnected,
        walletAddress,
        balance: `${balance} ETH`,
        network: "Sepolia Testnet",
      },
    });
  } catch (error: any) {
    console.error("Blockchain status error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get blockchain status",
    });
  }
});

// Test attestOcr function (without real IPFS)
router.post("/test-attest", async (req: Request, res: Response) => {
  try {
    const { docHash, ipfsCid, ocrScoreBps, verified } = req.body;

    // Default test values if not provided
    const testDocHash =
      docHash ||
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    const testIpfsCid = ipfsCid || "QmTest123";
    const testScore = ocrScoreBps || 8500; // 85%
    const testVerified = verified !== undefined ? verified : true;

    const txHash = await blockchainService.attestOcr(
      testDocHash,
      testIpfsCid,
      testScore,
      testVerified,
    );

    res.json({
      success: true,
      txHash,
      etherscanUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      message: "OCR attestation successful!",
    });
  } catch (error: any) {
    console.error("Test attest error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to attest OCR",
    });
  }
});

// Test organization creation
router.post("/test-create-org", async (req: Request, res: Response) => {
  try {
    const { name, manager } = req.body;

    const testName = name || "Test Organization";
    const testManager = manager || "0x0000000000000000000000000000000000000000";

    const result = await blockchainService.createOrganization(
      testName,
      testManager,
    );

    res.json({
      success: true,
      txHash: result.txHash,
      orgId: result.orgId,
      etherscanUrl: `https://sepolia.etherscan.io/tx/${result.txHash}`,
      message: "Organization created successfully!",
    });
  } catch (error: any) {
    console.error("Test create org error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create organization",
    });
  }
});

export default router;
