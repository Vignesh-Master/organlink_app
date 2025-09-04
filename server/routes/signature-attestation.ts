import express from "express";
import { z } from "zod";
import { blockchainService } from "../services/blockchain.js";
import { ipfsService } from "../services/ipfs.js";
import { hashBuffer } from "../utils/crypto.js";

const router = express.Router();

// Schema validation
const AttestOcrSchema = z.object({
  docHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  ipfsCid: z.string().min(1),
  ocrScoreBps: z.number().min(0).max(10000),
  verified: z.boolean(),
});

const GetLatestSchema = z.object({
  docHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

// Upload file and attest OCR verification
router.post("/upload-and-attest", async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const { ocrScore, verified, patientId, hospitalId, metadata } = req.body;

    // Validate OCR data
    if (ocrScore === undefined || verified === undefined) {
      return res.status(400).json({
        success: false,
        error: "OCR score and verification status are required",
      });
    }

    // Generate document hash from file buffer
    const docHash = hashBuffer(req.file.buffer);

    // Prepare IPFS metadata
    const ipfsMetadata = {
      docHash,
      patientId,
      hospitalId,
      ocrScore: Number(ocrScore),
      verified: verified === "true",
      uploadedAt: new Date().toISOString(),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      ...(metadata ? JSON.parse(metadata) : {}),
    };

    // Upload to IPFS
    const ipfsCid = await ipfsService.pinFile(
      req.file.buffer,
      req.file.originalname,
      ipfsMetadata,
    );

    // Attest on blockchain
    const ocrScoreBps = Math.round(Number(ocrScore) * 100); // Convert to basis points
    const isVerified = verified === "true";

    const txHash = await blockchainService.attestOcr(
      docHash,
      ipfsCid,
      ocrScoreBps,
      isVerified,
    );

    res.json({
      success: true,
      data: {
        docHash,
        ipfsCid,
        ocrScore: Number(ocrScore),
        verified: isVerified,
        txHash,
        ipfsUrl: ipfsService.getFileUrl(ipfsCid),
        etherscanUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
      },
    });
  } catch (error: any) {
    console.error("Upload and attest error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload and attest document",
    });
  }
});

// Attest OCR verification for existing IPFS document
router.post("/attest-ocr", async (req, res) => {
  try {
    const validatedData = AttestOcrSchema.parse(req.body);
    const { docHash, ipfsCid, ocrScoreBps, verified } = validatedData;

    const txHash = await blockchainService.attestOcr(
      docHash,
      ipfsCid,
      ocrScoreBps,
      verified,
    );

    res.json({
      success: true,
      data: {
        docHash,
        ipfsCid,
        ocrScoreBps,
        verified,
        txHash,
        ipfsUrl: ipfsService.getFileUrl(ipfsCid),
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

    console.error("Attest OCR error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to attest OCR verification",
    });
  }
});

// Get latest attestation record
router.get("/get-latest", async (req, res) => {
  try {
    const { docHash } = req.query;

    if (!docHash || typeof docHash !== "string") {
      return res.status(400).json({
        success: false,
        error: "Document hash is required",
      });
    }

    const validatedData = GetLatestSchema.parse({ docHash });

    const record = await blockchainService.getLatest(validatedData.docHash);

    // Check if record exists (docHash is not zero)
    if (
      record.docHash ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return res.status(404).json({
        success: false,
        error: "No attestation record found for this document hash",
      });
    }

    res.json({
      success: true,
      data: {
        docHash: record.docHash,
        ipfsCid: record.ipfsCid,
        ocrVerified: record.ocrVerified,
        ocrScoreBps: Number(record.ocrScoreBps),
        ocrScorePercent: Number(record.ocrScoreBps) / 100,
        sigVerified: record.sigVerified,
        claimedSigner: record.claimedSigner,
        status: Number(record.status),
        attestedAt: Number(record.attestedAt),
        attestedBy: record.attestedBy,
        version: Number(record.version),
        ipfsUrl: ipfsService.getFileUrl(record.ipfsCid),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid document hash format",
        details: error.errors,
      });
    }

    console.error("Get latest error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve attestation record",
    });
  }
});

// Get attestation history for a document
router.get("/get-history", async (req, res) => {
  try {
    const { docHash } = req.query;

    if (!docHash || typeof docHash !== "string") {
      return res.status(400).json({
        success: false,
        error: "Document hash is required",
      });
    }

    const validatedData = GetLatestSchema.parse({ docHash });

    // For now, just return the latest record
    // In a full implementation, you'd query blockchain events for history
    const record = await blockchainService.getLatest(validatedData.docHash);

    if (
      record.docHash ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return res.json({
        success: true,
        data: {
          docHash: validatedData.docHash,
          history: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        docHash: validatedData.docHash,
        history: [
          {
            docHash: record.docHash,
            ipfsCid: record.ipfsCid,
            ocrVerified: record.ocrVerified,
            ocrScoreBps: Number(record.ocrScoreBps),
            ocrScorePercent: Number(record.ocrScoreBps) / 100,
            status: Number(record.status),
            attestedAt: Number(record.attestedAt),
            attestedBy: record.attestedBy,
            version: Number(record.version),
            ipfsUrl: ipfsService.getFileUrl(record.ipfsCid),
          },
        ],
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid document hash format",
        details: error.errors,
      });
    }

    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve attestation history",
    });
  }
});

// Verify document integrity
router.post("/verify-document", async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded for verification",
      });
    }

    // Generate hash of uploaded file
    const docHash = hashBuffer(req.file.buffer);

    // Get blockchain record
    const record = await blockchainService.getLatest(docHash);

    if (
      record.docHash ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return res.json({
        success: true,
        data: {
          docHash,
          isVerified: false,
          message: "Document not found on blockchain",
        },
      });
    }

    // Optionally verify IPFS content matches
    let ipfsMatches = false;
    try {
      const ipfsBuffer = await ipfsService.getFile(record.ipfsCid);
      ipfsMatches = Buffer.compare(req.file.buffer, ipfsBuffer) === 0;
    } catch (error) {
      console.warn("Could not verify IPFS content:", error);
    }

    res.json({
      success: true,
      data: {
        docHash,
        isVerified: true,
        ocrVerified: record.ocrVerified,
        ocrScorePercent: Number(record.ocrScoreBps) / 100,
        attestedAt: Number(record.attestedAt),
        attestedBy: record.attestedBy,
        ipfsMatches,
        ipfsUrl: ipfsService.getFileUrl(record.ipfsCid),
        record,
      },
    });
  } catch (error: any) {
    console.error("Verify document error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify document",
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
          attestation: blockchainConnected && ipfsConnected,
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

export default router;
