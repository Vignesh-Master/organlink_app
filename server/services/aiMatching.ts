import { pool } from "../config/database.js";

interface MatchingCriteria {
  organ_type: string;
  blood_type: string;
  urgency_level: string;
  hospital_id: string;
  patient_id: string;
}

interface DonorMatch {
  donor_id: string;
  donor_name: string;
  blood_type: string;
  organs_available: string[];
  hospital_id: string;
  hospital_name: string;
  match_score: number;
  distance_score: number;
  compatibility_score: number;
  urgency_bonus: number;
  registration_time: string;
}

interface MatchingResult {
  patient_id: string;
  matches: DonorMatch[];
  total_matches: number;
  best_match?: DonorMatch;
}

export class AIMatchingService {
  // Blood type compatibility matrix
  private bloodCompatibility = {
    "A+": ["A+", "AB+"],
    "A-": ["A+", "A-", "AB+", "AB-"],
    "B+": ["B+", "AB+"],
    "B-": ["B+", "B-", "AB+", "AB-"],
    "AB+": ["AB+"],
    "AB-": ["AB+", "AB-"],
    "O+": ["A+", "B+", "AB+", "O+"],
    "O-": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  };

  // Urgency level scoring
  private urgencyScores = {
    Critical: 100,
    High: 75,
    Medium: 50,
    Low: 25,
  };

  // Find matches for a patient
  async findMatches(criteria: MatchingCriteria): Promise<MatchingResult> {
    try {
      // Get compatible blood types
      const compatibleBloodTypes =
        this.bloodCompatibility[
          criteria.blood_type as keyof typeof this.bloodCompatibility
        ] || [];

      if (compatibleBloodTypes.length === 0) {
        return {
          patient_id: criteria.patient_id,
          matches: [],
          total_matches: 0,
        };
      }

      // Find potential donors
      const donorsQuery = `
        SELECT 
          d.donor_id,
          d.full_name as donor_name,
          d.blood_type,
          d.organs_to_donate,
          d.hospital_id,
          h.hospital_name,
          h.city,
          h.state,
          h.country,
          d.registration_date,
          d.created_at
        FROM donors d
        JOIN hospital_credentials h ON d.hospital_id = h.hospital_id
        WHERE d.blood_type = ANY($1)
          AND d.is_active = true
          AND d.signature_verified = true
          AND $2 = ANY(d.organs_to_donate)
          AND d.hospital_id != $3
        ORDER BY d.created_at DESC
      `;

      const donorsResult = await pool.query(donorsQuery, [
        compatibleBloodTypes,
        criteria.organ_type,
        criteria.hospital_id,
      ]);

      // Calculate match scores for each donor
      const matches: DonorMatch[] = donorsResult.rows.map((donor) => {
        const compatibilityScore = this.calculateCompatibilityScore(
          criteria.blood_type,
          donor.blood_type,
        );

        const urgencyBonus =
          this.urgencyScores[
            criteria.urgency_level as keyof typeof this.urgencyScores
          ] || 0;

        const distanceScore = this.calculateDistanceScore(
          criteria.hospital_id,
          donor.hospital_id,
        );

        const timeScore = this.calculateTimeScore(donor.registration_date);

        const matchScore =
          compatibilityScore * 0.4 +
          urgencyBonus * 0.3 +
          distanceScore * 0.2 +
          timeScore * 0.1;

        return {
          donor_id: donor.donor_id,
          donor_name: donor.donor_name,
          blood_type: donor.blood_type,
          organs_available: donor.organs_to_donate,
          hospital_id: donor.hospital_id,
          hospital_name: donor.hospital_name,
          match_score: Math.round(matchScore * 100) / 100,
          distance_score: distanceScore,
          compatibility_score: compatibilityScore,
          urgency_bonus: urgencyBonus,
          registration_time: donor.registration_date,
        };
      });

      // Sort by match score (highest first)
      matches.sort((a, b) => b.match_score - a.match_score);

      return {
        patient_id: criteria.patient_id,
        matches: matches,
        total_matches: matches.length,
        best_match: matches.length > 0 ? matches[0] : undefined,
      };
    } catch (error) {
      console.error("AI Matching error:", error);
      throw new Error("Failed to find matches");
    }
  }

  // Calculate blood type compatibility score
  private calculateCompatibilityScore(
    patientBloodType: string,
    donorBloodType: string,
  ): number {
    // Perfect match (same blood type)
    if (patientBloodType === donorBloodType) {
      return 100;
    }

    // Compatible but not perfect match
    const compatible =
      this.bloodCompatibility[
        donorBloodType as keyof typeof this.bloodCompatibility
      ] || [];
    if (compatible.includes(patientBloodType)) {
      return 80;
    }

    // Not compatible
    return 0;
  }

  // Calculate distance score (simplified - could be enhanced with actual geolocation)
  private calculateDistanceScore(
    patientHospitalId: string,
    donorHospitalId: string,
  ): number {
    // For now, we'll use a simple state/city based scoring
    // In a real implementation, you'd use actual geographical distance

    // Same hospital (shouldn't happen but just in case)
    if (patientHospitalId === donorHospitalId) {
      return 100;
    }

    // For this demo, we'll assign random but consistent scores
    // In production, implement actual distance calculation
    const hash = (patientHospitalId + donorHospitalId)
      .split("")
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

    return Math.abs(hash % 40) + 60; // Score between 60-100
  }

  // Calculate time score (how long the donor has been registered)
  private calculateTimeScore(registrationDate: string): number {
    const now = new Date();
    const regDate = new Date(registrationDate);
    const daysDiff = Math.floor(
      (now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Newer registrations get higher scores (more likely to be available)
    if (daysDiff <= 7) return 100;
    if (daysDiff <= 30) return 80;
    if (daysDiff <= 90) return 60;
    if (daysDiff <= 180) return 40;
    return 20;
  }

  // Create a matching request
  async createMatchingRequest(criteria: MatchingCriteria): Promise<string> {
    try {
      const requestId = `MATCH_REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Find matches first
      const matchingResult = await this.findMatches(criteria);

      // Store the matching request
      await pool.query(
        `INSERT INTO matching_requests (
          request_id, patient_id, requesting_hospital_id, organ_type, 
          blood_type, urgency_level, ai_score, status, match_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          requestId,
          criteria.patient_id,
          criteria.hospital_id,
          criteria.organ_type,
          criteria.blood_type,
          criteria.urgency_level,
          matchingResult.best_match?.match_score || 0,
          matchingResult.total_matches > 0 ? "matched" : "no_matches",
          JSON.stringify(matchingResult),
        ],
      );

      // If matches found, create notifications for donor hospitals
      if (matchingResult.total_matches > 0) {
        await this.createMatchNotifications(requestId, matchingResult);
      }

      return requestId;
    } catch (error) {
      console.error("Create matching request error:", error);
      throw new Error("Failed to create matching request");
    }
  }

  // Create notifications for hospitals with matching donors
  private async createMatchNotifications(
    requestId: string,
    matchingResult: MatchingResult,
  ) {
    try {
      // Group matches by hospital
      const hospitalMatches = new Map<string, DonorMatch[]>();
      matchingResult.matches.forEach((match) => {
        if (!hospitalMatches.has(match.hospital_id)) {
          hospitalMatches.set(match.hospital_id, []);
        }
        hospitalMatches.get(match.hospital_id)!.push(match);
      });

      // Create notification for each hospital
      for (const [hospitalId, matches] of hospitalMatches) {
        const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await pool.query(
          `INSERT INTO notifications (
            notification_id, hospital_id, type, title, message, 
            related_id, metadata, is_read
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            notificationId,
            hospitalId,
            "organ_match",
            "Organ Match Found",
            `Your hospital has ${matches.length} potential donor(s) for a patient in need. Please review the matching request.`,
            requestId,
            JSON.stringify({
              matches: matches,
              patient_id: matchingResult.patient_id,
              request_id: requestId,
            }),
            false,
          ],
        );
      }
    } catch (error) {
      console.error("Create match notifications error:", error);
    }
  }

  // Get matching requests for a hospital
  async getMatchingRequests(hospitalId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT mr.*, p.full_name as patient_name, h.hospital_name as requesting_hospital_name
         FROM matching_requests mr
         LEFT JOIN patients p ON mr.patient_id = p.patient_id
         LEFT JOIN hospital_credentials h ON mr.requesting_hospital_id = h.hospital_id
         WHERE mr.requesting_hospital_id = $1
         ORDER BY mr.created_at DESC`,
        [hospitalId],
      );

      return result.rows;
    } catch (error) {
      console.error("Get matching requests error:", error);
      throw new Error("Failed to get matching requests");
    }
  }
}

export const aiMatchingService = new AIMatchingService();
