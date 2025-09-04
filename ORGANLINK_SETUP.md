# OrganLink - Blockchain + AI Setup Guide

## 🚀 Quick Start

OrganLink is a comprehensive organ donation platform that combines blockchain transparency with AI-powered matching. This guide will help you set up and use both the blockchain attestation system and AI matching features.

## 📋 Prerequisites

1. **Node.js** (v18+) and **pnpm**
2. **PostgreSQL** database (Neon recommended)
3. **Ethereum Sepolia** testnet access (Infura/Alchemy)
4. **Pinata** account for IPFS storage
5. **Smart contracts** deployed on Sepolia

## 🔧 Environment Setup

The environment variables are already configured. For production, update these values:

```bash
# Blockchain Configuration
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
ADMIN_PRIVATE_KEY="0xYOUR_ADMIN_WALLET_PRIVATE_KEY"
DOC_REGISTRY_ADDRESS="0xYOUR_SIGNATURE_VERIFIER_CONTRACT_ADDRESS"
POLICY_CONTRACT_ADDRESS="0xYOUR_POLICY_ORGANIZATION_CONTRACT_ADDRESS"

# IPFS Configuration
PINATA_JWT="YOUR_PINATA_JWT_TOKEN"

# Database
DATABASE_URL="postgresql://username:password@hostname:5432/organlink_db"
```

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## 🔗 Blockchain Features

### 1. Document Attestation (OrganLinkSignatureVerifier)

**Purpose**: Immutable verification of donor/patient documents with OCR signatures.

**API Endpoints**:
- `POST /api/blockchain/attestation/upload-and-attest` - Upload file and attest OCR
- `POST /api/blockchain/attestation/attest-ocr` - Attest existing IPFS document
- `GET /api/blockchain/attestation/get-latest` - Get latest attestation record
- `POST /api/blockchain/attestation/verify-document` - Verify document integrity

**Example Usage**:
```javascript
// Upload and attest a donor signature
const formData = new FormData();
formData.append('file', signatureFile);
formData.append('ocrScore', '92.5');
formData.append('verified', 'true');
formData.append('patientId', 'P001');
formData.append('hospitalId', 'H001');

const response = await fetch('/api/blockchain/attestation/upload-and-attest', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Result includes: docHash, ipfsCid, txHash, etherscanUrl
```

### 2. Policy Governance (OrganLinkPolicyByOrganization)

**Purpose**: Democratic policy creation and voting by healthcare organizations.

**API Endpoints**:
- `POST /api/blockchain/governance/create-organization` - Create new organization
- `POST /api/blockchain/governance/create-proposal` - Create policy proposal
- `POST /api/blockchain/governance/cast-vote` - Vote on proposal
- `POST /api/blockchain/governance/finalize-proposal` - Finalize voting
- `GET /api/blockchain/governance/get-proposal` - Get proposal details
- `GET /api/blockchain/governance/get-tally` - Get vote tally

**Example Usage**:
```javascript
// Create a new policy proposal
const proposal = {
  proposerOrgId: 1, // WHO
  title: "Pediatric Kidney Priority Policy",
  rationale: "Prioritize kidney allocation for patients under 18",
  parameters: {
    organ: "kidney",
    age_priority: true,
    priority_age_threshold: 18,
    effective_date: "2025-09-15"
  },
  endTime: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const response = await fetch('/api/blockchain/governance/create-proposal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(proposal)
});
```

## 🤖 AI Matching Features

### 1. Dataset Processing

**Prepare Training Data**:
```bash
# Process Kaggle datasets
npx tsx scripts/buildDataset.ts \
  --brazil data/raw/waitlist_kidney_brazil.csv \
  --supply data/raw/Kidney_Organ_SupplyChain_RawDataset.csv \
  --org data/raw/Organ_Transplant.csv \
  --out data/clean/organlink_training_data.csv \
  --enhance
```

### 2. AI Matching API

**Main Endpoint**: `POST /api/ai/matching/find-matches`

**Example Usage**:
```javascript
// Find matches for a kidney patient
const matchRequest = {
  patient: {
    id: "P001",
    organ_type: "KID",
    blood_group: "A+",
    age: 45,
    urgency: 85,
    city: "Mumbai",
    HLA: {
      A1: "A*01:01", A2: "A*02:01",
      B1: "B*07:02", B2: "B*08:01",
      DR1: "DRB1*03:01", DR2: "DRB1*15:01"
    },
    ocr_verified: true,
    ocr_score_bps: 9200
  },
  options: {
    max_results: 10,
    include_ml_prediction: true,
    require_blockchain_verification: true,
    min_match_score: 0.65
  }
};

const response = await fetch('/api/ai/matching/find-matches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(matchRequest)
});

const matches = await response.json();
// Returns ranked donor matches with scores and explanations
```

### 3. Policy Management

**Get/Update Matching Policies**:
```javascript
// Get current kidney matching policy
const policy = await fetch('/api/ai/matching/policy/KID');

// Update policy weights (admin only)
const updatedWeights = {
  weights: {
    w_blood: 0.30,
    w_hla: 0.35,
    w_urgency: 0.25,
    w_distance: 0.10
  }
};

await fetch('/api/ai/matching/policy/KID', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updatedWeights)
});
```

## 🔄 End-to-End Workflow

### Complete Organ Matching Process:

1. **Hospital Registration**:
   ```javascript
   // Register donor with signature upload
   const donorData = {
     name: "John Doe",
     organ: "kidney",
     bloodType: "O+",
     signatureFile: file
   };
   // → OCR verification → IPFS upload → Blockchain attestation
   ```

2. **Patient Matching**:
   ```javascript
   // Find compatible donors using AI
   const matches = await aiMatching.findMatches(patient);
   // → Policy compliance → ML scoring → Ranked results
   ```

3. **Policy Governance**:
   ```javascript
   // Organizations vote on new policies
   await policySystem.createProposal(policyData);
   await policySystem.vote(proposalId, "For");
   // → Blockchain voting → Democratic consensus
   ```

4. **Audit Trail**:
   ```javascript
   // Verify document integrity
   const verification = await blockchain.verifyDocument(docHash);
   // → Immutable verification history
   ```

## 📊 Monitoring & Analytics

### Available Endpoints:
- `GET /api/ai/matching/statistics` - Matching performance metrics
- `GET /api/blockchain/attestation/status` - Blockchain service status
- `POST /api/ai/matching/export-matches` - Export results for audit

### Organization Portal Features:
- **Analytics Dashboard**: Performance metrics and trends
- **Settings**: Notification preferences and security
- **Profile Management**: Organization information and representatives
- **Help System**: Comprehensive documentation and FAQ

## 🧪 Testing

### Demo Organizations Setup:
```bash
# Create demo organizations (WHO, PAHO, HSRA)
curl -X POST http://localhost:8080/api/blockchain/governance/setup-demo-organizations

# Create demo proposal
curl -X POST http://localhost:8080/api/blockchain/governance/create-demo-proposal
```

### Test Blockchain Features:
```bash
# Test document attestation
curl -X POST http://localhost:8080/api/test/blockchain/test-attest

# Test organization creation
curl -X POST http://localhost:8080/api/test/blockchain/test-create-org
```

## 🚨 Security Features

1. **Admin-Only Blockchain Writes**: Only the admin wallet can write to blockchain
2. **OCR Verification**: Signature verification with confidence scoring
3. **Policy Compliance**: Automated policy enforcement in matching
4. **Audit Trails**: Immutable record of all transactions
5. **Access Control**: Role-based permissions for different user types

## 📈 Performance Optimization

1. **Caching**: Redis caching for frequently accessed data
2. **Database Indexing**: Optimized queries for donor/patient lookups
3. **Async Processing**: Background processing for ML computations
4. **Rate Limiting**: API rate limiting for security

## 🤝 Integration Examples

### Hospital System Integration:
```javascript
// Integrate with existing hospital management system
const organlink = new OrganLinkAPI({
  baseUrl: 'https://api.organlink.org',
  apiKey: 'your-api-key'
});

// Register patient and find matches
await organlink.patients.register(patientData);
const matches = await organlink.matching.findDonors(patientId);
```

### Organization Workflow:
```javascript
// Automate policy proposals and voting
const proposal = await organlink.governance.createProposal({
  title: "Emergency Protocol Update",
  rationale: "Streamline emergency organ allocation",
  deadline: "24h"
});

await organlink.governance.notifyMembers(proposal.id);
```

## 🆘 Troubleshooting

### Common Issues:

1. **Blockchain Connection**: Check RPC URL and network status
2. **IPFS Upload Fails**: Verify Pinata JWT token
3. **OCR Low Scores**: Ensure high-quality signature images
4. **No Matches Found**: Check policy constraints and thresholds
5. **Vote Rejected**: Verify organization eligibility and proposal status

### Debug Endpoints:
- `GET /api/blockchain/attestation/status` - Service health check
- `GET /api/blockchain/governance/status` - Governance system status
- `GET /api/ai/matching/policy/:organ` - Current matching policies

## 📚 Additional Resources

- **Smart Contract ABIs**: Available in `server/services/blockchain.ts`
- **Policy Configuration**: Editable in `server/policies.json`
- **Sample Data**: Training datasets in `data/clean/`
- **API Documentation**: OpenAPI specs available via `/api/docs`

## 🎯 Next Steps

1. **Deploy Smart Contracts**: Deploy to Sepolia testnet
2. **Connect Database**: Set up Neon PostgreSQL
3. **Configure IPFS**: Set up Pinata account
4. **Train ML Models**: Process datasets and train matching models
5. **Test Integration**: Run end-to-end tests with real data

For production deployment, consider using the Netlify or Vercel integrations available through the MCP connections.
