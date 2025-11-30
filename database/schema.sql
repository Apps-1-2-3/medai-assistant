-- ===========================================
-- AI Drug Recommendation System - MySQL Schema
-- ===========================================
-- Run this file in MySQL CLI:
-- mysql -u your_username -p < database/schema.sql
-- ===========================================

-- Create database
CREATE DATABASE IF NOT EXISTS drug_recommendation_db;
USE drug_recommendation_db;

-- ===========================================
-- EHR Records Table
-- Stores all patient data and recommendations
-- ===========================================
CREATE TABLE IF NOT EXISTS ehr_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    
    -- Patient Demographics
    age INT NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    
    -- Medical Information (stored as JSON for flexibility)
    allergies JSON,
    medical_history JSON,
    symptoms JSON,
    current_medications TEXT,
    
    -- ML Recommendation Results
    recommended_drugs JSON,
    confidence_scores JSON,
    shap_explanation JSON,
    drug_interactions JSON,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for common queries
    INDEX idx_patient_id (patient_id),
    INDEX idx_created_at (created_at)
);

-- ===========================================
-- Patients Table (Optional - for patient management)
-- ===========================================
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_patient_lookup (patient_id)
);

-- ===========================================
-- Drug Database Table (Reference data)
-- ===========================================
CREATE TABLE IF NOT EXISTS drugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    drug_class VARCHAR(100),
    common_dosage VARCHAR(100),
    frequency VARCHAR(100),
    contraindications JSON,
    side_effects JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Drug Interactions Table (Reference data)
-- ===========================================
CREATE TABLE IF NOT EXISTS drug_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    drug1_name VARCHAR(255) NOT NULL,
    drug2_name VARCHAR(255) NOT NULL,
    severity ENUM('low', 'moderate', 'high') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_drug1 (drug1_name),
    INDEX idx_drug2 (drug2_name)
);

-- ===========================================
-- Sample Data Inserts
-- ===========================================

-- Insert sample drugs
INSERT INTO drugs (name, generic_name, drug_class, common_dosage, frequency) VALUES
('Acetaminophen (Paracetamol)', 'Acetaminophen', 'Analgesic/Antipyretic', '500-1000mg', 'Every 4-6 hours'),
('Ibuprofen', 'Ibuprofen', 'NSAID', '200-400mg', 'Every 4-6 hours'),
('Dextromethorphan', 'Dextromethorphan', 'Antitussive', '10-20mg', 'Every 4 hours'),
('Ondansetron', 'Ondansetron', 'Antiemetic', '4-8mg', 'Every 8 hours'),
('Diphenhydramine', 'Diphenhydramine', 'Antihistamine', '25-50mg', 'Every 6 hours');

-- Insert sample drug interactions
INSERT INTO drug_interactions (drug1_name, drug2_name, severity, description) VALUES
('Warfarin', 'Acetaminophen', 'moderate', 'High doses of acetaminophen may increase the anticoagulant effect of warfarin. Monitor INR closely.'),
('Warfarin', 'Ibuprofen', 'high', 'NSAIDs increase bleeding risk when combined with warfarin. Avoid combination if possible.'),
('Metformin', 'Contrast Dye', 'high', 'Hold metformin before and after contrast procedures to prevent lactic acidosis.');

-- ===========================================
-- Example Queries for Backend API
-- ===========================================

-- Insert a new EHR record (POST /api/predict)
-- INSERT INTO ehr_records (patient_id, age, gender, allergies, medical_history, symptoms, current_medications, recommended_drugs, confidence_scores, shap_explanation, drug_interactions)
-- VALUES (
--     'P12345',
--     45,
--     'male',
--     '["Penicillin", "Sulfa Drugs"]',
--     '["Diabetes", "Hypertension"]',
--     '["Fever", "Headache"]',
--     'Metformin 500mg',
--     '[{"name": "Acetaminophen", "dosage": "500mg", "frequency": "Every 4-6 hours"}]',
--     '[0.92, 0.85]',
--     '[{"feature": "Fever symptom", "influence": 40, "direction": "positive"}]',
--     '[]'
-- );

-- Get patient history (GET /api/history/:patient_id)
-- SELECT * FROM ehr_records WHERE patient_id = 'P12345' ORDER BY created_at DESC;

-- Get all records (GET /api/history)
-- SELECT * FROM ehr_records ORDER BY created_at DESC LIMIT 100;
