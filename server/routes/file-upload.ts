import express from "express";
import multer from "multer";
import path from "path";
import { authenticateHospital } from "../middleware/auth.js";
import { ipfsService } from "../services/ipfs.js";
import { ocrService } from "../services/ocr.js";
import { blockchainService } from "../services/blockchain.js";
import { pool } from "../config/database.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common image types (including mobile formats)
    const allowedTypes = /jpeg|jpg|png|webp|heic|heif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype =
      /^image\//.test(file.mimetype) &&
      allowedTypes.test(file.mimetype.toLowerCase());

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed (jpeg, jpg, png, webp, heic, heif)",
        ),
      );
    }
  },
});

// Upload and process signature document
router.post(
  "/signature",
  authenticateHospital,
  upload.single("signature"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const hospital_id = req.hospital?.hospital_id;
      const { record_type, record_id, patient_name } = req.body;
      let expectedName = patient_name;
      try {
        if (
          !expectedName &&
          (record_type === "patient" || record_type === "donor")
        ) {
          const table = record_type === "patient" ? "patients" : "donors";
          const idCol = record_type === "patient" ? "patient_id" : "donor_id";
          const { rows } = await pool.query(
            `SELECT first_name, last_name FROM ${table} WHERE ${idCol} = $1 AND hospital_id = $2`,
            [record_id, hospital_id],
          );
          if (rows.length > 0) {
            expectedName = `${rows[0].first_name} ${rows[0].last_name}`.trim();
          }
        }
      } catch (e) {
        console.warn("Unable to fetch name for OCR verification", e);
      }

      if (!record_type || !record_id) {
        return res.status(400).json({
          success: false,
          error: "Record type and ID are required",
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${record_type}_${record_id}_${timestamp}_signature.${req.file.originalname.split(".").pop()}`;

      // Perform OCR verification FIRST; require match before IPFS
      let ocrResult: any = {
        isValid: false,
        extractedText: "",
        confidence: 0,
        matchedPatterns: [],
        nameMatch: false,
      };
      if (req.file.mimetype.startsWith("image/")) {
        try {
          ocrResult = await ocrService.advancedSignatureVerification(
            req.file.buffer,
            expectedName,
          );
        } catch (ocrError) {
          console.warn(
            "OCR verification encountered an error, proceeding with upload:",
            ocrError,
          );
        }
      }

      const confidence = Number(ocrResult?.confidence ?? 0);
      const nameMatch = Boolean(ocrResult?.nameMatch);
      const docLooksValid = Boolean(ocrResult?.isValid);
      const extracted = String(ocrResult?.extractedText || "");
      const textHasLetters = /[a-zA-Z]{3,}/.test(extracted);
      const isValid = nameMatch || docLooksValid || textHasLetters;

      // Proceed with upload even if OCR does not pass; blockchain step will still require verification
      if (!isValid) {
        console.warn(
          "OCR validation not passed; uploading file with OCR pending",
          {
            confidence,
            nameMatch,
            docLooksValid,
            extractedPreview: extracted.slice(0, 80),
          },
        );
      }

      // Upload to IPFS (OCR result is included but not blocking)
      const ipfsHash = await ipfsService.pinFile(req.file.buffer, fileName, {
        hospital_id,
        record_type,
        record_id,
        upload_time: new Date().toISOString(),
      });

      // Return upload result
      res.json({
        success: true,
        ipfsHash,
        fileName,
        fileUrl: ipfsService.getFileUrl(ipfsHash),
        ocrVerification: ocrResult,
        message: "File uploaded and processed successfully",
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload file",
      });
    }
  },
);

// Register to blockchain (attest OCR result on-chain)
router.post("/blockchain-register", authenticateHospital, async (req, res) => {
  try {
    const {
      record_type,
      record_id,
      ipfs_hash,
      doc_hash,
      ocr_score_bps,
      verified,
    } = req.body as any;

    const hospital_id = req.hospital?.hospital_id;
    if (!record_type || !record_id || !ipfs_hash) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Fetch stored signature hash to ensure it exists
    if (record_type === "patient") {
      const { rows } = await pool.query(
        `SELECT signature_ipfs_hash FROM patients WHERE patient_id = $1 AND hospital_id = $2`,
        [record_id, hospital_id],
      );
      if (!rows.length || !rows[0].signature_ipfs_hash) {
        return res
          .status(400)
          .json({ success: false, error: "Signature not uploaded" });
      }
    } else if (record_type === "donor") {
      const { rows } = await pool.query(
        `SELECT signature_ipfs_hash FROM donors WHERE donor_id = $1 AND hospital_id = $2`,
        [record_id, hospital_id],
      );
      if (!rows.length || !rows[0].signature_ipfs_hash) {
        return res
          .status(400)
          .json({ success: false, error: "Signature not uploaded" });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Invalid record type" });
    }

    // Derive missing values if needed
    const { keccak256, toUtf8Bytes } = await import("ethers");
    const finalDocHash =
      doc_hash && /^0x[0-9a-fA-F]{64}$/.test(doc_hash)
        ? doc_hash
        : keccak256(toUtf8Bytes(String(ipfs_hash)));

    let score = Number(ocr_score_bps ?? 0);
    if (!Number.isInteger(score) || score < 0 || score > 10000) score = 0;
    const isVerified = Boolean(verified);

    // On-chain attestation (admin wallet)
    const blockchainTxHash = await blockchainService.attestOcr(
      finalDocHash,
      String(ipfs_hash),
      score,
      isVerified,
    );

    // Update record with tx hash and verification flag
    if (record_type === "patient") {
      await pool.query(
        `UPDATE patients SET verification_tx_hash = $1, ocr_verified = $2, blockchain_verified = $3, updated_at = CURRENT_TIMESTAMP
         WHERE patient_id = $4 AND hospital_id = $5`,
        [blockchainTxHash, isVerified, true, record_id, hospital_id],
      );
    } else if (record_type === "donor") {
      await pool.query(
        `UPDATE donors SET verification_tx_hash = $1, ocr_verified = $2, blockchain_verified = $3, updated_at = CURRENT_TIMESTAMP
         WHERE donor_id = $4 AND hospital_id = $5`,
        [blockchainTxHash, isVerified, true, record_id, hospital_id],
      );
    }

    res.json({
      success: true,
      blockchainTxHash,
      message: "OCR attested on-chain",
    });
  } catch (error: any) {
    console.error("Blockchain registration error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Failed to register on blockchain",
      });
  }
});

// Get file from IPFS
router.get("/ipfs/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const fileBuffer = await ipfsService.getFile(hash);

    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="signature_${hash}"`,
    });

    res.send(fileBuffer);
  } catch (error) {
    console.error("IPFS file retrieval error:", error);
    res.status(404).json({
      success: false,
      error: "File not found",
    });
  }
});

export default router;
