import { Router, Request, Response } from "express";
import { ipfsService } from "../services/ipfs.js";

const router = Router();

// Test IPFS connection
router.get("/status", async (req: Request, res: Response) => {
  try {
    // Test connection (will fail with demo credentials but service structure is correct)
    const isConnected = await ipfsService.testConnection();
    
    res.json({
      success: true,
      ipfs: {
        connected: isConnected,
        gatewayUrl: "https://gateway.pinata.cloud/ipfs",
        hasCredentials: {
          apiKey: !!process.env.PINATA_API_KEY && process.env.PINATA_API_KEY !== 'demo_key',
          jwtToken: !!process.env.PINATA_JWT_TOKEN && process.env.PINATA_JWT_TOKEN !== 'demo_jwt_token'
        },
        message: isConnected ? "IPFS service ready" : "Demo credentials - set real Pinata keys for full functionality"
      }
    });
  } catch (error: any) {
    res.json({
      success: true,
      ipfs: {
        connected: false,
        error: error.message,
        message: "IPFS service configured but needs real Pinata credentials"
      }
    });
  }
});

// Test JSON pinning (will fail with demo credentials but shows API structure)
router.post("/test-pin-json", async (req: Request, res: Response) => {
  try {
    const testData = {
      title: "Test Policy",
      description: "This is a test policy document",
      timestamp: new Date().toISOString(),
      ...req.body
    };
    
    // This will fail with demo credentials but service structure is correct
    const ipfsHash = await ipfsService.pinJSON(testData, "test_document");
    
    res.json({
      success: true,
      ipfsHash,
      url: ipfsService.getFileUrl(ipfsHash),
      message: "JSON pinned to IPFS successfully!"
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      message: "IPFS pinning failed - please set valid Pinata credentials"
    });
  }
});

export default router;
