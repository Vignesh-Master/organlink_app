-- OrganLink Database Schema
-- Comprehensive schema for the organ donation platform

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================== USERS & AUTHENTICATION ==================

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table (WHO, PAHO, HSRA, etc.)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    manager VARCHAR(255),
    wallet_address VARCHAR(42),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    org_id_on_chain INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    hospital_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    license_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================== MEDICAL RECORDS ==================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    
    -- Medical information
    organ_needed VARCHAR(50) NOT NULL,
    medical_condition TEXT,
    urgency_level VARCHAR(20) DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    compatible_blood_types TEXT[], -- Array of compatible blood types
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    
    -- Document verification
    signature_file_url TEXT,
    signature_ipfs_hash VARCHAR(100),
    document_hash VARCHAR(66), -- For blockchain verification
    ocr_verified BOOLEAN DEFAULT FALSE,
    ocr_confidence_score INTEGER DEFAULT 0,
    blockchain_verified BOOLEAN DEFAULT FALSE,
    verification_tx_hash VARCHAR(66),
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'completed', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donors table
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id VARCHAR(50) UNIQUE NOT NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    
    -- Medical information
    organs_to_donate TEXT[] NOT NULL, -- Array of organs
    medical_history TEXT,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    donor_type VARCHAR(20) DEFAULT 'deceased' CHECK (donor_type IN ('living', 'deceased')),
    
    -- Document verification
    signature_file_url TEXT,
    signature_ipfs_hash VARCHAR(100),
    document_hash VARCHAR(66), -- For blockchain verification
    ocr_verified BOOLEAN DEFAULT FALSE,
    ocr_confidence_score INTEGER DEFAULT 0,
    blockchain_verified BOOLEAN DEFAULT FALSE,
    verification_tx_hash VARCHAR(66),
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'completed', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================== POLICY GOVERNANCE ==================

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'governance',
    proposer_org_id INTEGER REFERENCES organizations(id),
    ipfs_cid VARCHAR(100),
    parameters JSONB,
    
    -- Voting information
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'voting', 'approved', 'rejected', 'cancelled')),
    
    -- Vote counts (mirrored from blockchain)
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    eligible_count INTEGER DEFAULT 0,
    
    -- Blockchain information
    creation_tx_hash VARCHAR(66),
    finalization_tx_hash VARCHAR(66),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policy votes tracking
CREATE TABLE IF NOT EXISTS policy_votes (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER NOT NULL,
    voter_org_id INTEGER REFERENCES organizations(id),
    vote INTEGER CHECK (vote IN (1, 2, 3)), -- 1=For, 2=Against, 3=Abstain
    tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================== MATCHING & NOTIFICATIONS ==================

-- Organ matches table
CREATE TABLE IF NOT EXISTS organ_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    donor_id UUID REFERENCES donors(id),
    organ VARCHAR(50) NOT NULL,
    compatibility_score DECIMAL(5,2),
    ai_analysis JSONB,
    applicable_policies TEXT[], -- Policy IDs that affected this match
    
    match_status VARCHAR(20) DEFAULT 'pending' CHECK (match_status IN ('pending', 'approved', 'rejected', 'completed')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id VARCHAR(100) UNIQUE,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('admin', 'hospital', 'organization')),
    recipient_id VARCHAR(50), -- hospital_id, organization.id, or 'ADMIN'
    hospital_id VARCHAR(50), -- For hospital notifications
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id VARCHAR(100), -- ID of related entity (match, policy, etc.)
    
    read BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================== AUDIT & LOGGING ==================

-- Audit logs for all major actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'patient', 'donor', 'policy', etc.
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'verify', etc.
    performed_by_type VARCHAR(20) NOT NULL, -- 'admin', 'hospital', 'organization'
    performed_by_id VARCHAR(50) NOT NULL,
    
    old_values JSONB,
    new_values JSONB,
    metadata JSONB, -- Additional context
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset requests
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(100) UNIQUE NOT NULL,
    hospital_id VARCHAR(50) REFERENCES hospitals(hospital_id),
    requested_by_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by UUID REFERENCES admins(id),
    processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================== INDEXES ==================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_organ_needed ON patients(organ_needed);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_blood_type ON patients(blood_type);

CREATE INDEX IF NOT EXISTS idx_donors_hospital_id ON donors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_donors_organs ON donors USING GIN(organs_to_donate);
CREATE INDEX IF NOT EXISTS idx_donors_status ON donors(status);
CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);

CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_proposer ON policies(proposer_org_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by_type, performed_by_id);

-- ================== DEFAULT DATA ==================

-- Insert default admin if not exists
INSERT INTO admins (email, password, full_name) 
VALUES ('admin@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator')
ON CONFLICT (email) DO NOTHING;

-- Insert some default organizations for testing
INSERT INTO organizations (name, email, password, manager, status) VALUES 
('World Health Organization', 'who@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'WHO Manager', 'active'),
('Pan American Health Organization', 'paho@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PAHO Manager', 'active'),
('Health Services Research Association', 'hsra@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HSRA Manager', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample hospitals
INSERT INTO hospitals (hospital_id, name, email, password, phone, address, city, state, country, license_number, status) VALUES 
('MUM001', 'Mumbai General Hospital', 'mumbai@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-22-1234567', '123 Medical District', 'Mumbai', 'Maharashtra', 'India', 'MH-MUM-001', 'active'),
('DEL001', 'Delhi Medical Center', 'delhi@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-11-1234567', '456 Healthcare Avenue', 'Delhi', 'Delhi', 'India', 'DL-DEL-001', 'active'),
('BLR001', 'Bangalore Health Institute', 'bangalore@organlink.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91-80-1234567', '789 Tech Park Road', 'Bangalore', 'Karnataka', 'India', 'KA-BLR-001', 'active')
ON CONFLICT (hospital_id) DO NOTHING;
