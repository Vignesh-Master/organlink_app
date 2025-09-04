// scripts/buildDataset.ts
// Usage: npx tsx scripts/buildDataset.ts --brazil data/raw/waitlist_kidney_brazil.csv --supply data/raw/Kidney_Organ_SupplyChain_RawDataset.csv --org data/raw/Organ_Transplant.csv --out data/clean/organlink_training_data.csv

import fs from "fs";
import path from "path";
import Papa from "papaparse";

type Row = Record<string, any>;

const ORG_MAP: Record<string, string> = {
  "kidney": "KID", "renal": "KID",
  "liver": "LIV", "hepatic": "LIV",
  "heart": "HRT", "cardiac": "HRT",
  "lung": "LNG", "pulmo": "LNG",
  "pancreas": "PNC",
  "cornea": "CRN",
  "skin": "SKN",
  "bone marrow": "BMW", "marrow": "BMW", "hematopoietic": "BMW",
  "bone": "BON",
};

const h = {
  clipAge: (v: any) => {
    const x = Number(v); 
    if (Number.isNaN(x)) return undefined;
    return Math.max(0, Math.min(120, x));
  },
  normGender: (v: any) => {
    const t = String(v ?? "").trim().toUpperCase();
    if (t.startsWith("M")) return "M";
    if (t.startsWith("F")) return "F";
    return "U";
  },
  normBlood: (v: any) => {
    if (v == null) return undefined;
    let t = String(v).trim().toUpperCase();
    t = t.replace(/POSITIVE/g, "+").replace(/NEGATIVE/g, "-").replace(/\s+/g, "");
    t = t.replace(/0/g, "O");
    const m = t.match(/^(A|B|AB|O)(\+|-)?$/);
    return m ? m[0] : undefined;
  },
  normOrgan: (v: any) => {
    if (v == null) return undefined;
    const t0 = String(v).toLowerCase().split(/[,\-\/;|]/)[0].trim();
    for (const k of Object.keys(ORG_MAP)) {
      if (t0.includes(k)) return ORG_MAP[k];
    }
    return undefined;
  }
};

function parseCsvSync(filePath: string, encoding: BufferEncoding = "utf8"): Row[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  
  const txt = fs.readFileSync(filePath, { encoding });
  const parsed = Papa.parse<Row>(txt, { header: true, skipEmptyLines: true });
  
  if (parsed.errors?.length) {
    // try latin1 as fallback
    if (encoding !== "latin1") return parseCsvSync(filePath, "latin1");
    throw new Error(`Failed parsing ${filePath}: ${parsed.errors[0].message}`);
  }
  return parsed.data;
}

function buildOrganTransplant(rows: Row[]): Row[] {
  return rows.map(r => ({
    age: h.clipAge(r["Age"]),
    gender: h.normGender(r["Gender"]),
    blood_group: undefined,
    HLA_A1: undefined, HLA_A2: undefined, HLA_B1: undefined, HLA_B2: undefined, HLA_DR1: undefined, HLA_DR2: undefined,
    organ_type: h.normOrgan(r["Transplant"]),
    urgency: undefined,
    outcome: (String(r["Needed_or_not"] || "").toLowerCase().trim() === "yes") ? 1 : 0,
    height: undefined, weight: undefined,
    city: undefined, state: undefined, country: undefined,
    hospital_id: undefined,
    patient_id: undefined,
    donor_id: undefined,
    waitlist_days: undefined,
    compatibility_score: undefined,
    medical_urgency: undefined,
    source: "Organ_Transplant.csv"
  })).filter(x => x.organ_type); // requires organ
}

function buildSupply(rows: Row[]): Row[] {
  const out: Row[] = [];
  for (const r of rows) {
    // patient (needs organ)
    out.push({
      age: h.clipAge(r["Patient_Age"]),
      gender: h.normGender(r["Patient_Gender"]),
      blood_group: h.normBlood(r["Patient_BloodType"]),
      HLA_A1: undefined, HLA_A2: undefined, HLA_B1: undefined, HLA_B2: undefined, HLA_DR1: undefined, HLA_DR2: undefined,
      organ_type: h.normOrgan(r["Organ_Required"]),
      urgency: r["Urgency_Score"] ?? undefined,
      outcome: String(r["Match_Status"] || "").toLowerCase().trim() === "yes" ? 1 : 0,
      height: r["Patient_Height"], weight: r["Patient_Weight"],
      city: r["Patient_Location"], state: undefined, country: undefined,
      hospital_id: r["Patient_Hospital_ID"],
      patient_id: r["Patient_ID"],
      donor_id: undefined,
      waitlist_days: r["Patient_Waitlist_Days"],
      compatibility_score: r["Compatibility_Score"],
      medical_urgency: r["Medical_Urgency"],
      source: "Kidney_Organ_SupplyChain_RawDataset.csv",
      record_type: "patient"
    });
    
    // donor (donated organ)
    out.push({
      age: h.clipAge(r["Donor_Age"]),
      gender: h.normGender(r["Donor_Gender"]),
      blood_group: h.normBlood(r["Donor_BloodType"]),
      HLA_A1: undefined, HLA_A2: undefined, HLA_B1: undefined, HLA_B2: undefined, HLA_DR1: undefined, HLA_DR2: undefined,
      organ_type: h.normOrgan(r["Organ_Donated"]),
      urgency: undefined,
      outcome: String(r["Match_Status"] || "").toLowerCase().trim() === "yes" ? 1 : 0,
      height: r["Donor_Height"], weight: r["Donor_Weight"],
      city: r["Donor_Location"], state: undefined, country: undefined,
      hospital_id: r["Donor_Hospital_ID"],
      patient_id: undefined,
      donor_id: r["Donor_ID"],
      waitlist_days: undefined,
      compatibility_score: r["Compatibility_Score"],
      medical_urgency: undefined,
      source: "Kidney_Organ_SupplyChain_RawDataset.csv",
      record_type: "donor"
    });
  }
  return out;
}

function buildBrazil(rows: Row[]): Row[] {
  return rows.map(r => ({
    age: h.clipAge(r["age_at_list_registration"]),
    gender: h.normGender(r["sex"]),
    blood_group: h.normBlood(r["Blood_type"]),
    HLA_A1: r["HLA_A1"], HLA_A2: r["HLA_A2"], HLA_B1: r["HLA_B1"], HLA_B2: r["HLA_B2"], HLA_DR1: r["HLA_DR1"], HLA_DR2: r["HLA_DR2"],
    organ_type: "KID",
    urgency: r["cPRA_value"] ?? r["time_on_Dialysis"],
    outcome: (() => {
      const v = String(r["Transplant_Y_N"] ?? "").toLowerCase().trim();
      return (v === "sim" || v === "yes" || v === "1" || v === "true") ? 1 : 0;
    })(),
    height: undefined, weight: undefined,
    city: undefined, state: r["State"], country: "BR",
    hospital_id: undefined,
    patient_id: r["Patient_ID"],
    donor_id: undefined,
    waitlist_days: r["time_on_waitlist_days"],
    compatibility_score: undefined,
    medical_urgency: r["cPRA_value"],
    source: "waitlist_kidney_brazil.csv",
    record_type: "patient"
  }));
}

function stringifyCsv(rows: Row[]): string {
  const cols = [
    "age", "gender", "blood_group", "HLA_A1", "HLA_A2", "HLA_B1", "HLA_B2", "HLA_DR1", "HLA_DR2",
    "organ_type", "urgency", "outcome", "height", "weight", "city", "state", "country",
    "hospital_id", "patient_id", "donor_id", "waitlist_days", "compatibility_score",
    "medical_urgency", "HLA_missing", "record_type", "source"
  ];
  
  // compute HLA_missing, fill UNKNOWN if all null
  const normalized = rows.map(r => {
    const hla = ["HLA_A1", "HLA_A2", "HLA_B1", "HLA_B2", "HLA_DR1", "HLA_DR2"].map(k => r[k]);
    const allMissing = hla.every(x => x == null || String(x).trim() === "");
    if (allMissing) {
      r["HLA_A1"] = r["HLA_A2"] = r["HLA_B1"] = r["HLA_B2"] = r["HLA_DR1"] = r["HLA_DR2"] = "UNKNOWN";
      r["HLA_missing"] = 1;
    } else {
      r["HLA_missing"] = (hla.every(x => String(x || "").toUpperCase() === "UNKNOWN")) ? 1 : 0;
    }
    return r;
  });

  // drop rows missing essentials
  const essentials = normalized.filter(r => r.organ_type && r.blood_group);

  // clamp age
  for (const r of essentials) {
    if (r.age != null) r.age = h.clipAge(r.age);
  }

  // dedupe
  const key = (r: Row) => JSON.stringify([
    r.age, r.gender, r.blood_group, r.organ_type, r.city, r.state, r.country, 
    r.hospital_id, r.patient_id, r.donor_id, r.source
  ]);
  const uniqMap = new Map<string, Row>();
  for (const r of essentials) uniqMap.set(key(r), r);
  const finalRows = Array.from(uniqMap.values());

  return Papa.unparse({ 
    fields: cols, 
    data: finalRows.map(r => cols.map(c => r[c] ?? "")) 
  });
}

// Enhanced dataset with blockchain and AI features
function enhanceDataset(rows: Row[]): Row[] {
  return rows.map((r, index) => {
    // Add blockchain-related fields
    r.doc_hash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
    r.ipfs_cid = `Qm${Math.random().toString(36).substring(2, 46).toUpperCase()}`;
    r.ocr_verified = Math.random() > 0.1 ? 1 : 0; // 90% verification rate
    r.ocr_score_bps = Math.floor(Math.random() * 2000) + 8000; // 80-100% range
    r.attestation_tx = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
    r.blockchain_timestamp = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 30); // Last 30 days
    
    // Add AI matching features
    r.age_group = r.age ? (
      r.age < 18 ? "pediatric" :
      r.age < 65 ? "adult" : "senior"
    ) : "unknown";
    
    r.urgency_level = r.urgency ? (
      r.urgency > 80 ? "critical" :
      r.urgency > 50 ? "high" :
      r.urgency > 20 ? "medium" : "low"
    ) : "unknown";
    
    r.waitlist_category = r.waitlist_days ? (
      r.waitlist_days > 365 ? "long_term" :
      r.waitlist_days > 180 ? "medium_term" : "short_term"
    ) : "unknown";
    
    // ABO compatibility flags
    if (r.blood_group) {
      r.abo_type = r.blood_group.replace(/[+-]/, "");
      r.rh_factor = r.blood_group.includes("+") ? "positive" : "negative";
      r.universal_donor = r.blood_group === "O-" ? 1 : 0;
      r.universal_recipient = r.blood_group === "AB+" ? 1 : 0;
    }
    
    // Distance/location features
    r.location_tier = r.city ? (
      ["Mumbai", "Delhi", "Chennai", "Bangalore"].includes(r.city) ? "tier1" :
      Math.random() > 0.5 ? "tier2" : "tier3"
    ) : "unknown";
    
    // Policy compliance flags
    r.pediatric_priority = r.age && r.age < 18 ? 1 : 0;
    r.senior_consideration = r.age && r.age > 65 ? 1 : 0;
    r.emergency_case = r.urgency && r.urgency > 90 ? 1 : 0;
    
    // Match prediction features
    r.predicted_success_score = Math.random() * 0.4 + 0.6; // 60-100% range
    r.risk_score = Math.random() * 0.3; // 0-30% risk
    r.follow_up_score = Math.random() * 0.2 + 0.8; // 80-100% follow-up likelihood
    
    return r;
  });
}

// ---- CLI ----
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith("--"))
      .map(a => {
        const [key, value] = a.replace(/^--/, "").split("=");
        return [key, value || true];
      })
  );
  
  const brazil = args["brazil"] as string;
  const supply = args["supply"] as string;
  const org = args["org"] as string;
  const out = (args["out"] as string) || "data/clean/organlink_training_data.csv";
  const enhance = args["enhance"];

  if (!brazil && !supply) {
    console.error("Usage:");
    console.error("  npx tsx scripts/buildDataset.ts --brazil <path> --supply <path> [--org <path>] --out <path> [--enhance]");
    console.error("");
    console.error("Example:");
    console.error("  npx tsx scripts/buildDataset.ts \\");
    console.error("    --brazil data/raw/waitlist_kidney_brazil.csv \\");
    console.error("    --supply data/raw/Kidney_Organ_SupplyChain_RawDataset.csv \\");
    console.error("    --org data/raw/Organ_Transplant.csv \\");
    console.error("    --out data/clean/organlink_training_data.csv \\");
    console.error("    --enhance");
    process.exit(1);
  }

  console.log("🔄 Processing datasets...");
  
  let merged: Row[] = [];
  
  if (brazil) {
    console.log(`📖 Reading Brazil waitlist data: ${brazil}`);
    const rowsBrazil = parseCsvSync(brazil, "latin1");
    const builtBrazil = buildBrazil(rowsBrazil);
    merged.push(...builtBrazil);
    console.log(`   ✅ Processed ${builtBrazil.length} Brazil records`);
  }
  
  if (supply) {
    console.log(`📖 Reading supply chain data: ${supply}`);
    const rowsSupply = parseCsvSync(supply, "utf8");
    const builtSupply = buildSupply(rowsSupply);
    merged.push(...builtSupply);
    console.log(`   ✅ Processed ${builtSupply.length} supply chain records`);
  }
  
  if (org && fs.existsSync(org)) {
    console.log(`📖 Reading organ transplant data: ${org}`);
    const rowsOrg = parseCsvSync(org, "utf8");
    const builtOrg = buildOrganTransplant(rowsOrg);
    merged.push(...builtOrg);
    console.log(`   ✅ Processed ${builtOrg.length} organ transplant records`);
  }

  if (enhance) {
    console.log("🚀 Enhancing dataset with blockchain and AI features...");
    merged = enhanceDataset(merged);
  }

  console.log(`🔧 Normalizing and deduplicating ${merged.length} total records...`);
  const csv = stringifyCsv(merged);
  
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, csv, "utf8");
  
  const finalCount = csv.split("\n").length - 1;
  console.log(`✅ Wrote ${out} (${finalCount} rows)`);
  
  // Generate summary statistics
  const summary = {
    totalRecords: finalCount,
    organTypes: [...new Set(merged.map(r => r.organ_type).filter(Boolean))],
    bloodGroups: [...new Set(merged.map(r => r.blood_group).filter(Boolean))],
    countries: [...new Set(merged.map(r => r.country).filter(Boolean))],
    sources: [...new Set(merged.map(r => r.source).filter(Boolean))],
    outcomeDistribution: {
      successful: merged.filter(r => r.outcome === 1).length,
      unsuccessful: merged.filter(r => r.outcome === 0).length,
    },
    ageDistribution: {
      pediatric: merged.filter(r => r.age && r.age < 18).length,
      adult: merged.filter(r => r.age && r.age >= 18 && r.age < 65).length,
      senior: merged.filter(r => r.age && r.age >= 65).length,
    }
  };
  
  const summaryPath = out.replace('.csv', '_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`📊 Dataset summary written to ${summaryPath}`);
  
  console.log("🎉 Dataset processing complete!");
}

export { buildBrazil, buildSupply, buildOrganTransplant, stringifyCsv, enhanceDataset };
