import express from "express";
import { z } from "zod";
import { enhancedAIMatchingService, Patient, Donor } from "../services/enhancedAiMatching.js";
import { blockchainService } from "../services/blockchain.js";
import pool from "../config/database.js";

const router = express.Router();

// Validation schemas
const PatientSchema = z.object({
  id: z.string(),
  organ_type: z.string(),
  blood_group: z.string(),
  age: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  urgency: z.number().min(0).max(100).optional(),
  waitlist_days: z.number().optional(),
  medical_urgency: z.number().optional(),
  HLA: z.object({
    A1: z.string().optional(),
    A2: z.string().optional(),
    B1: z.string().optional(),
    B2: z.string().optional(),
    DR1: z.string().optional(),
    DR2: z.string().optional(),
  }).optional(),
  hospital_id: z.string().optional(),
  doc_hash: z.string().optional(),
  ipfs_cid: z.string().optional(),
  ocr_verified: z.boolean().optional(),
  ocr_score_bps: z.number().optional(),
});

const DonorSchema = z.object({
  id: z.string(),
  organ_type: z.string(),
  blood_group: z.string(),
  age: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  HLA: z.object({
    A1: z.string().optional(),
    A2: z.string().optional(),
    B1: z.string().optional(),
    B2: z.string().optional(),
    DR1: z.string().optional(),
    DR2: z.string().optional(),
  }).optional(),
  hospital_id: z.string().optional(),
  doc_hash: z.string().optional(),
  ipfs_cid: z.string().optional(),
  ocr_verified: z.boolean().optional(),
  ocr_score_bps: z.number().optional(),
});

const MatchRequestSchema = z.object({
  patient: PatientSchema,
  donors: z.array(DonorSchema).optional(),
  donor_filters: z.object({
    organ_type: z.string().optional(),
    max_age: z.number().optional(),
    min_age: z.number().optional(),
    blood_groups: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    verified_only: z.boolean().optional(),
    max_distance_km: z.number().optional(),
  }).optional(),
  options: z.object({
    max_results: z.number().default(10),
    include_low_scores: z.boolean().default(false),
    include_ml_prediction: z.boolean().default(true),
    require_blockchain_verification: z.boolean().optional(),
    min_match_score: z.number().optional(),
    min_confidence: z.number().optional(),
  }).optional(),
});

// Get eligible donors from database
async function getEligibleDonors(organType: string, filters: any = {}): Promise<Donor[]> {
  try {
    let query = `
      SELECT 
        d.*,
        h.name as hospital_name,
        h.city as hospital_city
      FROM donors d
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.organ_type = $1 AND d.status = 'available'
    `;
    
    const params: any[] = [organType];
    let paramIndex = 2;

    // Apply filters
    if (filters.max_age) {
      query += ` AND d.age <= $${paramIndex++}`;
      params.push(filters.max_age);
    }
    
    if (filters.min_age) {
      query += ` AND d.age >= $${paramIndex++}`;
      params.push(filters.min_age);
    }
    
    if (filters.blood_groups && filters.blood_groups.length > 0) {
      query += ` AND d.blood_group = ANY($${paramIndex++})`;
      params.push(filters.blood_groups);
    }
    
    if (filters.cities && filters.cities.length > 0) {
      query += ` AND (d.city = ANY($${paramIndex++}) OR h.city = ANY($${paramIndex++}))`;
      params.push(filters.cities);
      params.push(filters.cities);
    }
    
    if (filters.verified_only) {
      query += ` AND d.ocr_verified = true AND d.ocr_score_bps >= 8000`;
    }
    
    query += ` ORDER BY d.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      organ_type: row.organ_type,
      blood_group: row.blood_group,
      age: row.age,
      weight: row.weight,
      height: row.height,
      city: row.city || row.hospital_city,
      state: row.state,
      country: row.country || 'IN',
      HLA: {
        A1: row.hla_a1,
        A2: row.hla_a2,
        B1: row.hla_b1,
        B2: row.hla_b2,
        DR1: row.hla_dr1,
        DR2: row.hla_dr2,
      },
      hospital_id: row.hospital_id,
      doc_hash: row.doc_hash,
      ipfs_cid: row.ipfs_cid,
      ocr_verified: row.ocr_verified,
      ocr_score_bps: row.ocr_score_bps,
      blockchain_verified: row.blockchain_verified,
    }));
  } catch (error) {
    console.error("Error fetching eligible donors:", error);
    return [];
  }
}

// Enhance patient/donor data with blockchain verification
async function enhanceWithBlockchainData(data: Patient | Donor): Promise<Patient | Donor> {
  if (data.doc_hash) {
    try {
      const blockchainRecord = await blockchainService.getLatest(data.doc_hash);
      
      if (blockchainRecord && blockchainRecord.docHash !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        return {
          ...data,
          ocr_verified: blockchainRecord.ocrVerified,
          ocr_score_bps: Number(blockchainRecord.ocrScoreBps),
          blockchain_verified: true,
          ipfs_cid: blockchainRecord.ipfsCid,
        };
      }
    } catch (error) {
      console.warn("Could not verify blockchain data:", error);
    }
  }
  
  return data;
}

// Main matching endpoint
router.post("/find-matches", async (req, res) => {
  try {
    const validatedData = MatchRequestSchema.parse(req.body);
    const { patient, donors: providedDonors, donor_filters, options } = validatedData;

    // Enhance patient data with blockchain verification
    const enhancedPatient = await enhanceWithBlockchainData(patient) as Patient;

    // Get donors (either provided or from database)
    let donorCandidates: Donor[];
    
    if (providedDonors && providedDonors.length > 0) {
      // Use provided donors
      donorCandidates = await Promise.all(
        providedDonors.map(donor => enhanceWithBlockchainData(donor) as Promise<Donor>)
      );
    } else {
      // Fetch from database
      donorCandidates = await getEligibleDonors(patient.organ_type, donor_filters);
      
      // Enhance with blockchain data
      donorCandidates = await Promise.all(
        donorCandidates.map(donor => enhanceWithBlockchainData(donor) as Promise<Donor>)
      );
    }

    // Apply additional distance filter if specified
    if (donor_filters?.max_distance_km && patient.city) {
      // This would be implemented with proper distance calculation
      // For now, we'll filter by city presence
      donorCandidates = donorCandidates.filter(donor => donor.city);
    }

    // Perform AI matching
    const matchResult = await enhancedAIMatchingService.matchPatientToDonors(
      enhancedPatient,
      donorCandidates,
      {
        maxResults: options?.max_results || 10,
        includeLowScores: options?.include_low_scores || false,
        includeMLPrediction: options?.include_ml_prediction !== false,
        policyOverrides: {
          ...(options?.require_blockchain_verification !== undefined && {
            constraints: {
              ...enhancedAIMatchingService.getPolicy(patient.organ_type)?.constraints,
              require_blockchain_verification: options.require_blockchain_verification,
            }
          }),
          ...(options?.min_match_score !== undefined && {
            thresholds: {
              ...enhancedAIMatchingService.getPolicy(patient.organ_type)?.thresholds,
              min_match_score: options.min_match_score,
            }
          }),
          ...(options?.min_confidence !== undefined && {
            thresholds: {
              ...enhancedAIMatchingService.getPolicy(patient.organ_type)?.thresholds,
              min_confidence: options.min_confidence,
            }
          }),
        },
      }
    );

    // Log the matching request for audit purposes
    try {
      await pool.query(
        `INSERT INTO match_logs (patient_id, organ_type, total_candidates, matches_found, best_score, policy_version, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          patient.id,
          patient.organ_type,
          matchResult.summary.totalCandidates,
          matchResult.matches.length,
          matchResult.summary.bestScore,
          matchResult.policy.organ_type + "_v1.0",
        ]
      );
    } catch (logError) {
      console.warn("Could not log match request:", logError);
    }

    res.json({
      success: true,
      data: {
        patient: enhancedPatient,
        matches: matchResult.matches,
        summary: matchResult.summary,
        policy: {
          organ_type: matchResult.policy.organ_type,
          weights: matchResult.policy.weights,
          constraints: matchResult.policy.constraints,
          thresholds: matchResult.policy.thresholds,
        },
        metadata: {
          request_id: `match_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          processing_time_ms: Date.now() - Date.now(), // This would be calculated properly
          api_version: "1.0.0",
        },
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

    console.error("AI matching error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to perform AI matching",
    });
  }
});

// Get matching policy for organ type
router.get("/policy/:organType", async (req, res) => {
  try {
    const { organType } = req.params;
    const policy = enhancedAIMatchingService.getPolicy(organType.toUpperCase());

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: `No policy found for organ type: ${organType}`,
      });
    }

    res.json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error("Get policy error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve policy",
    });
  }
});

// Update matching policy (admin only)
router.put("/policy/:organType", async (req, res) => {
  try {
    const { organType } = req.params;
    const policyUpdates = req.body;

    // In a real implementation, you'd check admin permissions here
    // const isAdmin = await checkAdminPermissions(req);
    // if (!isAdmin) return res.status(403).json({ success: false, error: "Admin access required" });

    enhancedAIMatchingService.updatePolicy(organType.toUpperCase(), policyUpdates);

    const updatedPolicy = enhancedAIMatchingService.getPolicy(organType.toUpperCase());

    res.json({
      success: true,
      data: updatedPolicy,
    });
  } catch (error: any) {
    console.error("Update policy error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update policy",
    });
  }
});

// Get available donors for an organ type
router.get("/donors/:organType", async (req, res) => {
  try {
    const { organType } = req.params;
    const {
      max_age,
      min_age,
      blood_groups,
      cities,
      verified_only,
      limit = 50,
    } = req.query;

    const filters = {
      max_age: max_age ? Number(max_age) : undefined,
      min_age: min_age ? Number(min_age) : undefined,
      blood_groups: blood_groups ? String(blood_groups).split(',') : undefined,
      cities: cities ? String(cities).split(',') : undefined,
      verified_only: verified_only === 'true',
    };

    const donors = await getEligibleDonors(organType.toUpperCase(), filters);

    // Limit results
    const limitedDonors = donors.slice(0, Number(limit));

    res.json({
      success: true,
      data: {
        donors: limitedDonors,
        total: donors.length,
        filters: filters,
      },
    });
  } catch (error: any) {
    console.error("Get donors error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve donors",
    });
  }
});

// Compatibility check between patient and donor
router.post("/check-compatibility", async (req, res) => {
  try {
    const { patient, donor } = req.body;

    const validatedPatient = PatientSchema.parse(patient);
    const validatedDonor = DonorSchema.parse(donor);

    // Enhance with blockchain data
    const enhancedPatient = await enhanceWithBlockchainData(validatedPatient) as Patient;
    const enhancedDonor = await enhanceWithBlockchainData(validatedDonor) as Donor;

    // Single donor matching
    const matchResult = await enhancedAIMatchingService.matchPatientToDonors(
      enhancedPatient,
      [enhancedDonor],
      { maxResults: 1, includeLowScores: true }
    );

    const compatibility = matchResult.matches[0] || null;

    res.json({
      success: true,
      data: {
        compatible: compatibility !== null,
        compatibility_details: compatibility,
        recommendations: compatibility ? 
          compatibility.warnings.length === 0 ? 
            ["Excellent match - proceed with allocation"] :
            compatibility.warnings.map(w => `Consider: ${w}`) :
          ["Not compatible for transplantation"],
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

    console.error("Compatibility check error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check compatibility",
    });
  }
});

// Export match results for audit
router.post("/export-matches", async (req, res) => {
  try {
    const { matches, format = "json" } = req.body;

    if (!matches || !Array.isArray(matches)) {
      return res.status(400).json({
        success: false,
        error: "Matches array is required",
      });
    }

    const exportData = enhancedAIMatchingService.exportMatchResults(matches, format);
    
    const contentType = format === "csv" ? "text/csv" : "application/json";
    const filename = `match_results_${Date.now()}.${format}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error: any) {
    console.error("Export matches error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to export match results",
    });
  }
});

// Get matching statistics
router.get("/statistics", async (req, res) => {
  try {
    const { timeframe = "30" } = req.query; // days

    const stats = await pool.query(
      `SELECT 
        organ_type,
        COUNT(*) as total_matches,
        AVG(best_score) as avg_best_score,
        AVG(matches_found) as avg_matches_found,
        COUNT(DISTINCT patient_id) as unique_patients
       FROM match_logs 
       WHERE created_at >= NOW() - INTERVAL '${Number(timeframe)} days'
       GROUP BY organ_type
       ORDER BY total_matches DESC`
    );

    const overallStats = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        AVG(best_score) as overall_avg_score,
        COUNT(CASE WHEN matches_found > 0 THEN 1 END) as successful_matches
       FROM match_logs 
       WHERE created_at >= NOW() - INTERVAL '${Number(timeframe)} days'`
    );

    res.json({
      success: true,
      data: {
        timeframe_days: Number(timeframe),
        by_organ_type: stats.rows,
        overall: overallStats.rows[0],
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve statistics",
    });
  }
});

export default router;
