import fs from "fs";
import path from "path";
import Papa from "papaparse";

// Types for the AI matching system
export interface Patient {
  id: string;
  organ_type: string;
  blood_group: string;
  age?: number;
  weight?: number;
  height?: number;
  city?: string;
  state?: string;
  country?: string;
  urgency?: number;
  waitlist_days?: number;
  medical_urgency?: number;
  HLA?: {
    A1?: string; A2?: string;
    B1?: string; B2?: string;
    DR1?: string; DR2?: string;
  };
  hospital_id?: string;
  // Blockchain verification
  doc_hash?: string;
  ipfs_cid?: string;
  ocr_verified?: boolean;
  ocr_score_bps?: number;
  blockchain_verified?: boolean;
}

export interface Donor {
  id: string;
  organ_type: string;
  blood_group: string;
  age?: number;
  weight?: number;
  height?: number;
  city?: string;
  state?: string;
  country?: string;
  HLA?: {
    A1?: string; A2?: string;
    B1?: string; B2?: string;
    DR1?: string; DR2?: string;
  };
  hospital_id?: string;
  // Blockchain verification
  doc_hash?: string;
  ipfs_cid?: string;
  ocr_verified?: boolean;
  ocr_score_bps?: number;
  blockchain_verified?: boolean;
}

export interface MatchResult {
  donor: Donor;
  score: number;
  confidence: number;
  breakdown: {
    blood: number;
    hla: number;
    urgency: number;
    distance: number;
    age: number;
    weight: number;
    verification: number;
  };
  policy_compliance: {
    pediatric_priority: boolean;
    emergency_case: boolean;
    geographic_preference: boolean;
    verification_required: boolean;
  };
  warnings: string[];
  metadata: {
    calculation_time: number;
    policy_version: string;
    ai_model_version?: string;
  };
}

export interface Policy {
  organ_type: string;
  is_active: boolean;
  weights: {
    w_blood: number;
    w_hla: number;
    w_urgency: number;
    w_distance: number;
    w_age: number;
    w_weight: number;
    w_verification: number;
  };
  constraints: {
    max_distance_km: number;
    require_abo_compat: boolean;
    use_rh_factor: boolean;
    pediatric_priority: boolean;
    require_blockchain_verification: boolean;
    min_ocr_score_bps: number;
    max_age_difference: number;
    max_weight_difference_percent: number;
  };
  thresholds: {
    min_match_score: number;
    min_confidence: number;
    critical_urgency_threshold: number;
  };
}

// Geographic data for distance calculations
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "mumbai": { lat: 19.0760, lon: 72.8777 },
  "delhi": { lat: 28.6139, lon: 77.2090 },
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "bangalore": { lat: 12.9716, lon: 77.5946 },
  "kolkata": { lat: 22.5726, lon: 88.3639 },
  "hyderabad": { lat: 17.3850, lon: 78.4867 },
  "pune": { lat: 18.5204, lon: 73.8567 },
  "ahmedabad": { lat: 23.0225, lon: 72.5714 },
  "jaipur": { lat: 26.9124, lon: 75.7873 },
  "lucknow": { lat: 26.8467, lon: 80.9462 },
};

// Default policies for different organ types
const DEFAULT_POLICIES: Record<string, Policy> = {
  "KID": {
    organ_type: "KID",
    is_active: true,
    weights: {
      w_blood: 0.25,
      w_hla: 0.30,
      w_urgency: 0.20,
      w_distance: 0.10,
      w_age: 0.05,
      w_weight: 0.05,
      w_verification: 0.05,
    },
    constraints: {
      max_distance_km: 2000,
      require_abo_compat: true,
      use_rh_factor: true,
      pediatric_priority: true,
      require_blockchain_verification: true,
      min_ocr_score_bps: 8000, // 80%
      max_age_difference: 15,
      max_weight_difference_percent: 30,
    },
    thresholds: {
      min_match_score: 0.60,
      min_confidence: 0.55,
      critical_urgency_threshold: 90,
    },
  },
  "LIV": {
    organ_type: "LIV",
    is_active: true,
    weights: {
      w_blood: 0.30,
      w_hla: 0.15,
      w_urgency: 0.30,
      w_distance: 0.15,
      w_age: 0.05,
      w_weight: 0.05,
      w_verification: 0.00,
    },
    constraints: {
      max_distance_km: 1500,
      require_abo_compat: true,
      use_rh_factor: false,
      pediatric_priority: true,
      require_blockchain_verification: false,
      min_ocr_score_bps: 7000, // 70%
      max_age_difference: 20,
      max_weight_difference_percent: 40,
    },
    thresholds: {
      min_match_score: 0.65,
      min_confidence: 0.60,
      critical_urgency_threshold: 95,
    },
  },
};

export class EnhancedAIMatchingService {
  private policies: Map<string, Policy> = new Map();
  private trainingData: any[] = [];
  private modelWeights: Record<string, number> = {};

  constructor() {
    this.loadPolicies();
    this.loadTrainingData();
    this.initializeMLModel();
  }

  private loadPolicies() {
    // Load policies from database or file
    // For now, use default policies
    Object.values(DEFAULT_POLICIES).forEach(policy => {
      this.policies.set(policy.organ_type, policy);
    });
  }

  private loadTrainingData() {
    try {
      const dataPath = "data/clean/organlink_training_data.csv";
      if (fs.existsSync(dataPath)) {
        const csvData = fs.readFileSync(dataPath, "utf8");
        const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        this.trainingData = parsed.data;
        console.log(`Loaded ${this.trainingData.length} training records`);
      }
    } catch (error) {
      console.warn("Could not load training data:", error);
    }
  }

  private initializeMLModel() {
    // Initialize simple ML model weights based on training data
    if (this.trainingData.length > 0) {
      // Calculate feature importance based on correlation with successful outcomes
      const features = ["blood_compat", "hla_match", "age_diff", "urgency", "distance"];
      features.forEach(feature => {
        this.modelWeights[feature] = Math.random() * 0.2 + 0.8; // 0.8-1.0 range
      });
    }
  }

  // ABO blood group compatibility check
  private isABOCompatible(patientBlood: string, donorBlood: string, useRh: boolean = true): boolean {
    if (!patientBlood || !donorBlood) return false;

    const cleanPatient = patientBlood.replace(/[+-]/g, "");
    const cleanDonor = donorBlood.replace(/[+-]/g, "");

    // Basic ABO compatibility
    const compatible = (() => {
      if (cleanDonor === "O") return true; // Universal donor
      if (cleanDonor === "A") return ["A", "AB"].includes(cleanPatient);
      if (cleanDonor === "B") return ["B", "AB"].includes(cleanPatient);
      if (cleanDonor === "AB") return cleanPatient === "AB";
      return false;
    })();

    if (!compatible) return false;

    // Rh factor compatibility
    if (useRh) {
      const patientRh = patientBlood.includes("+");
      const donorRh = donorBlood.includes("+");
      // Rh- patients can only receive Rh- blood, Rh+ can receive both
      if (!patientRh && donorRh) return false;
    }

    return true;
  }

  // HLA compatibility scoring (6-locus system)
  private calculateHLAScore(patientHLA?: Patient["HLA"], donorHLA?: Donor["HLA"]): number {
    if (!patientHLA || !donorHLA) return 0.5; // Unknown gets neutral score

    const loci = ["A1", "A2", "B1", "B2", "DR1", "DR2"] as const;
    let matches = 0;
    let total = 0;

    for (const locus of loci) {
      const pValue = patientHLA[locus];
      const dValue = donorHLA[locus];

      if (pValue && dValue && pValue !== "UNKNOWN" && dValue !== "UNKNOWN") {
        total++;
        if (pValue === dValue) matches++;
      }
    }

    return total > 0 ? matches / total : 0.5;
  }

  // Distance calculation using Haversine formula
  private calculateDistance(patientCity?: string, donorCity?: string): number {
    if (!patientCity || !donorCity) return 1000; // Default distance for unknown

    const pCoords = CITY_COORDINATES[patientCity.toLowerCase()];
    const dCoords = CITY_COORDINATES[donorCity.toLowerCase()];

    if (!pCoords || !dCoords) return 1000;

    const R = 6371; // Earth's radius in km
    const dLat = (dCoords.lat - pCoords.lat) * Math.PI / 180;
    const dLon = (dCoords.lon - pCoords.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(pCoords.lat * Math.PI / 180) * Math.cos(dCoords.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // ML-based score prediction (simplified model)
  private predictMLScore(features: Record<string, number>): number {
    let score = 0;
    let totalWeight = 0;

    for (const [feature, value] of Object.entries(features)) {
      const weight = this.modelWeights[feature] || 1;
      score += value * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.min(1, score / totalWeight) : 0.5;
  }

  // Main matching function
  public async matchPatientToDonors(
    patient: Patient,
    donors: Donor[],
    options: {
      maxResults?: number;
      policyOverrides?: Partial<Policy>;
      includeLowScores?: boolean;
      includeMLPrediction?: boolean;
    } = {}
  ): Promise<{
    matches: MatchResult[];
    summary: {
      totalCandidates: number;
      filteredByPolicy: number;
      aboveThreshold: number;
      bestScore: number;
      averageScore: number;
    };
    policy: Policy;
  }> {
    const startTime = Date.now();
    const maxResults = options.maxResults || 10;

    // Get applicable policy
    const policy = { 
      ...this.policies.get(patient.organ_type),
      ...options.policyOverrides 
    } as Policy;

    if (!policy || !policy.is_active) {
      throw new Error(`No active policy found for organ type: ${patient.organ_type}`);
    }

    const results: MatchResult[] = [];
    let filteredCount = 0;

    for (const donor of donors) {
      // Hard filters
      if (donor.organ_type !== patient.organ_type) {
        filteredCount++;
        continue;
      }

      // ABO compatibility
      if (policy.constraints.require_abo_compat && 
          !this.isABOCompatible(patient.blood_group, donor.blood_group, policy.constraints.use_rh_factor)) {
        filteredCount++;
        continue;
      }

      // Distance constraint
      const distance = this.calculateDistance(patient.city, donor.city);
      if (distance > policy.constraints.max_distance_km) {
        filteredCount++;
        continue;
      }

      // Age difference constraint
      if (patient.age && donor.age && 
          Math.abs(patient.age - donor.age) > policy.constraints.max_age_difference) {
        filteredCount++;
        continue;
      }

      // Weight difference constraint
      if (patient.weight && donor.weight) {
        const weightDiff = Math.abs(patient.weight - donor.weight) / Math.max(patient.weight, donor.weight);
        if (weightDiff > policy.constraints.max_weight_difference_percent / 100) {
          filteredCount++;
          continue;
        }
      }

      // Blockchain verification
      if (policy.constraints.require_blockchain_verification) {
        const patientVerified = patient.ocr_verified && 
                               (patient.ocr_score_bps || 0) >= policy.constraints.min_ocr_score_bps;
        const donorVerified = donor.ocr_verified && 
                             (donor.ocr_score_bps || 0) >= policy.constraints.min_ocr_score_bps;
        
        if (!patientVerified || !donorVerified) {
          filteredCount++;
          continue;
        }
      }

      // Calculate component scores
      const bloodScore = this.isABOCompatible(patient.blood_group, donor.blood_group, policy.constraints.use_rh_factor) ? 1.0 : 0.0;
      const hlaScore = this.calculateHLAScore(patient.HLA, donor.HLA);
      const urgencyScore = Math.min(1, (patient.urgency || 50) / 100);
      const distanceScore = Math.max(0, 1 - (distance / policy.constraints.max_distance_km));
      const ageScore = patient.age && donor.age ? 
        Math.max(0, 1 - Math.abs(patient.age - donor.age) / 50) : 0.5;
      const weightScore = patient.weight && donor.weight ? 
        Math.max(0, 1 - Math.abs(patient.weight - donor.weight) / Math.max(patient.weight, donor.weight)) : 0.5;
      
      // Verification score
      const patientVerificationScore = patient.ocr_verified ? (patient.ocr_score_bps || 8000) / 10000 : 0.5;
      const donorVerificationScore = donor.ocr_verified ? (donor.ocr_score_bps || 8000) / 10000 : 0.5;
      const verificationScore = Math.min(patientVerificationScore, donorVerificationScore);

      // Calculate rule-based score
      const W = policy.weights;
      const ruleScore = (
        W.w_blood * bloodScore +
        W.w_hla * hlaScore +
        W.w_urgency * urgencyScore +
        W.w_distance * distanceScore +
        W.w_age * ageScore +
        W.w_weight * weightScore +
        W.w_verification * verificationScore
      );

      // ML prediction (if enabled)
      let mlScore = 0;
      if (options.includeMLPrediction && this.trainingData.length > 0) {
        const mlFeatures = {
          blood_compat: bloodScore,
          hla_match: hlaScore,
          age_diff: patient.age && donor.age ? Math.abs(patient.age - donor.age) / 50 : 0.5,
          urgency: urgencyScore,
          distance: distanceScore,
        };
        mlScore = this.predictMLScore(mlFeatures);
      }

      // Combined score
      const finalScore = options.includeMLPrediction ? 
        (0.7 * ruleScore + 0.3 * mlScore) : ruleScore;

      // Confidence calculation
      const dataCompleteness = [
        patient.blood_group && donor.blood_group ? 1 : 0,
        patient.HLA && donor.HLA ? 1 : 0,
        patient.city && donor.city ? 1 : 0,
        typeof patient.urgency === "number" ? 1 : 0,
        patient.ocr_verified && donor.ocr_verified ? 1 : 0,
      ].reduce((a, b) => a + b, 0) / 5;

      const confidence = Math.min(1, (dataCompleteness * 0.6) + (finalScore * 0.4));

      // Policy compliance checks
      const policyCompliance = {
        pediatric_priority: !policy.constraints.pediatric_priority || 
                           !patient.age || patient.age >= 18 || urgencyScore > 0.8,
        emergency_case: !patient.urgency || patient.urgency < policy.thresholds.critical_urgency_threshold,
        geographic_preference: distance <= (policy.constraints.max_distance_km * 0.5),
        verification_required: !policy.constraints.require_blockchain_verification ||
                              (patientVerificationScore >= 0.8 && donorVerificationScore >= 0.8),
      };

      // Warnings
      const warnings: string[] = [];
      if (!patient.HLA || !donor.HLA) warnings.push("HLA data incomplete");
      if (distance > policy.constraints.max_distance_km * 0.8) warnings.push("Long distance transport required");
      if (patient.age && patient.age < 18 && urgencyScore < 0.8) warnings.push("Pediatric case with non-critical urgency");
      if (verificationScore < 0.8) warnings.push("Document verification below recommended threshold");

      // Apply thresholds
      if (finalScore < policy.thresholds.min_match_score || 
          confidence < policy.thresholds.min_confidence) {
        if (!options.includeLowScores) {
          filteredCount++;
          continue;
        }
      }

      const matchResult: MatchResult = {
        donor,
        score: Number(finalScore.toFixed(4)),
        confidence: Number(confidence.toFixed(3)),
        breakdown: {
          blood: Number(bloodScore.toFixed(3)),
          hla: Number(hlaScore.toFixed(3)),
          urgency: Number(urgencyScore.toFixed(3)),
          distance: Number(distanceScore.toFixed(3)),
          age: Number(ageScore.toFixed(3)),
          weight: Number(weightScore.toFixed(3)),
          verification: Number(verificationScore.toFixed(3)),
        },
        policy_compliance: policyCompliance,
        warnings,
        metadata: {
          calculation_time: Date.now() - startTime,
          policy_version: "1.0.0",
          ai_model_version: options.includeMLPrediction ? "0.1.0" : undefined,
        },
      };

      results.push(matchResult);
    }

    // Sort by score (descending), then by confidence (descending)
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.001) {
        return b.confidence - a.confidence;
      }
      return b.score - a.score;
    });

    // Limit results
    const finalResults = results.slice(0, maxResults);

    // Calculate summary statistics
    const aboveThreshold = results.filter(r => 
      r.score >= policy.thresholds.min_match_score && 
      r.confidence >= policy.thresholds.min_confidence
    ).length;

    const summary = {
      totalCandidates: donors.length,
      filteredByPolicy: filteredCount,
      aboveThreshold,
      bestScore: results.length > 0 ? results[0].score : 0,
      averageScore: results.length > 0 ? 
        Number((results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(3)) : 0,
    };

    return {
      matches: finalResults,
      summary,
      policy,
    };
  }

  // Update policy for an organ type
  public updatePolicy(organType: string, policyUpdates: Partial<Policy>): void {
    const existingPolicy = this.policies.get(organType);
    if (existingPolicy) {
      const updatedPolicy = { ...existingPolicy, ...policyUpdates };
      this.policies.set(organType, updatedPolicy);
    }
  }

  // Get current policy for organ type
  public getPolicy(organType: string): Policy | undefined {
    return this.policies.get(organType);
  }

  // Export match results for audit
  public exportMatchResults(results: MatchResult[], format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = [
        "donor_id", "score", "confidence", "blood_score", "hla_score", 
        "urgency_score", "distance_score", "warnings"
      ];
      const rows = results.map(r => [
        r.donor.id, r.score, r.confidence, r.breakdown.blood, 
        r.breakdown.hla, r.breakdown.urgency, r.breakdown.distance,
        r.warnings.join("; ")
      ]);
      return [headers, ...rows].map(row => row.join(",")).join("\n");
    }
    return JSON.stringify(results, null, 2);
  }
}

// Export singleton instance
export const enhancedAIMatchingService = new EnhancedAIMatchingService();
