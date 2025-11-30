-- =====================================================
-- AI Drug Recommendation System - MySQL Database Schema
-- =====================================================
-- Run these commands in MySQL CLI to set up the database
-- mysql -u root -p < schema.sql
-- =====================================================

-- Create the database
CREATE DATABASE IF NOT EXISTS drug_recommendation_db;
USE drug_recommendation_db;

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (last_name, first_name),
    INDEX idx_dob (date_of_birth)
);

-- =====================================================
-- EHR RECORDS TABLE (Main table for storing consultations)
-- =====================================================
CREATE TABLE IF NOT EXISTS ehr_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    
    -- Patient vitals at time of consultation
    age INT NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    heart_rate INT,
    blood_type VARCHAR(5),
    
    -- Clinical data (stored as JSON for flexibility)
    allergies JSON,
    medical_history JSON,
    symptoms JSON,
    current_medications TEXT,
    
    -- AI Recommendation results
    recommended_drugs JSON,
    shap_explanations JSON,
    drug_interactions JSON,
    
    -- Metadata
    consultation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    physician_notes TEXT,
    status ENUM('pending', 'reviewed', 'approved', 'rejected') DEFAULT 'pending',
    
    -- Foreign key
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_date (consultation_date),
    INDEX idx_status (status)
);

-- =====================================================
-- DRUGS TABLE (Reference table for drugs in the system)
-- =====================================================
CREATE TABLE IF NOT EXISTS drugs (
    drug_id INT AUTO_INCREMENT PRIMARY KEY,
    drug_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    drug_class VARCHAR(100),
    
    -- From drugLib dataset
    avg_rating DECIMAL(3,2),
    effectiveness_score DECIMAL(3,2),
    side_effect_score DECIMAL(3,2),
    review_count INT DEFAULT 0,
    
    -- Dosage info
    standard_dosage VARCHAR(100),
    max_daily_dose VARCHAR(100),
    
    -- Contraindications
    contraindications TEXT,
    pregnancy_category CHAR(1),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_drug_name (drug_name),
    INDEX idx_drug_class (drug_class)
);

-- =====================================================
-- DRUG INTERACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS drug_interactions (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,
    drug1_id INT NOT NULL,
    drug2_id INT NOT NULL,
    severity ENUM('low', 'moderate', 'high', 'contraindicated') NOT NULL,
    description TEXT,
    clinical_significance TEXT,
    management_recommendation TEXT,
    
    FOREIGN KEY (drug1_id) REFERENCES drugs(drug_id) ON DELETE CASCADE,
    FOREIGN KEY (drug2_id) REFERENCES drugs(drug_id) ON DELETE CASCADE,
    INDEX idx_drugs (drug1_id, drug2_id)
);

-- =====================================================
-- CONDITIONS TABLE (Medical conditions from drugLib)
-- =====================================================
CREATE TABLE IF NOT EXISTS conditions (
    condition_id INT AUTO_INCREMENT PRIMARY KEY,
    condition_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    icd10_code VARCHAR(20),
    
    UNIQUE INDEX idx_condition_name (condition_name)
);

-- =====================================================
-- DRUG_CONDITIONS TABLE (Links drugs to conditions they treat)
-- =====================================================
CREATE TABLE IF NOT EXISTS drug_conditions (
    drug_id INT NOT NULL,
    condition_id INT NOT NULL,
    effectiveness ENUM('Highly Effective', 'Considerably Effective', 'Moderately Effective', 'Marginally Effective', 'Ineffective'),
    evidence_level VARCHAR(50),
    
    PRIMARY KEY (drug_id, condition_id),
    FOREIGN KEY (drug_id) REFERENCES drugs(drug_id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(condition_id) ON DELETE CASCADE
);

-- =====================================================
-- SAMPLE DATA - Common Drugs
-- =====================================================
INSERT INTO drugs (drug_name, generic_name, drug_class, avg_rating, effectiveness_score, standard_dosage, max_daily_dose) VALUES
('Acetaminophen', 'Paracetamol', 'Analgesic/Antipyretic', 8.5, 4.5, '500-1000mg', '4000mg'),
('Ibuprofen', 'Ibuprofen', 'NSAID', 8.0, 4.3, '200-400mg', '3200mg'),
('Dextromethorphan', 'Dextromethorphan', 'Antitussive', 7.5, 4.0, '10-20mg', '120mg'),
('Ondansetron', 'Ondansetron', 'Antiemetic', 8.8, 4.7, '4-8mg', '24mg'),
('Guaifenesin', 'Guaifenesin', 'Expectorant', 7.0, 3.8, '200-400mg', '2400mg'),
('Diphenhydramine', 'Diphenhydramine', 'Antihistamine', 7.2, 4.0, '25-50mg', '300mg'),
('Omeprazole', 'Omeprazole', 'Proton Pump Inhibitor', 8.3, 4.5, '20-40mg', '40mg'),
('Loratadine', 'Loratadine', 'Antihistamine', 7.8, 4.2, '10mg', '10mg'),
('Naproxen', 'Naproxen', 'NSAID', 8.0, 4.3, '250-500mg', '1500mg'),
('Amoxicillin', 'Amoxicillin', 'Antibiotic', 8.5, 4.6, '500mg', '3000mg');

-- =====================================================
-- SAMPLE DATA - Common Conditions
-- =====================================================
INSERT INTO conditions (condition_name, category) VALUES
('Headache', 'Neurological'),
('Fever', 'Systemic'),
('Cough', 'Respiratory'),
('Nausea', 'Gastrointestinal'),
('Cold/Flu', 'Respiratory'),
('Pain', 'General'),
('Allergies', 'Immunological'),
('Heartburn', 'Gastrointestinal'),
('Sore Throat', 'Respiratory'),
('Sinus Infection', 'Respiratory');

-- =====================================================
-- SAMPLE DATA - Drug Interactions
-- =====================================================
INSERT INTO drug_interactions (drug1_id, drug2_id, severity, description, management_recommendation) VALUES
(1, 2, 'low', 'Both affect prostaglandin synthesis but through different mechanisms', 'Generally safe when used as directed'),
(2, 9, 'moderate', 'Combined NSAID use increases GI bleeding risk', 'Avoid concurrent use; use one NSAID at a time'),
(3, 6, 'moderate', 'Both have CNS depressant effects', 'Use caution; may increase sedation');

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all EHR records for a patient
-- SELECT * FROM ehr_records WHERE patient_id = ? ORDER BY consultation_date DESC;

-- Get drug recommendations by condition
-- SELECT d.drug_name, d.avg_rating, dc.effectiveness 
-- FROM drugs d 
-- JOIN drug_conditions dc ON d.drug_id = dc.drug_id 
-- JOIN conditions c ON dc.condition_id = c.condition_id 
-- WHERE c.condition_name = 'Headache';

-- Insert new EHR record (example)
-- INSERT INTO ehr_records (patient_id, age, gender, heart_rate, blood_type, allergies, medical_history, symptoms, current_medications, recommended_drugs, shap_explanations, drug_interactions)
-- VALUES (
--     1, 
--     45, 
--     'male', 
--     75,
--     'A+',
--     '["Penicillin"]', 
--     '["Hypertension"]', 
--     '["Headache", "Fever"]', 
--     'Lisinopril 10mg',
--     '[{"name": "Acetaminophen", "confidence": 0.92, "dosage": "500mg"}]',
--     '[{"feature": "Fever symptom", "influence": 40, "direction": "positive"}]',
--     '[]'
-- );

-- Search records by symptoms
-- SELECT * FROM ehr_records WHERE JSON_CONTAINS(symptoms, '"Fever"');

-- Get interaction warnings for a drug
-- SELECT d1.drug_name as drug1, d2.drug_name as drug2, di.severity, di.description
-- FROM drug_interactions di
-- JOIN drugs d1 ON di.drug1_id = d1.drug_id
-- JOIN drugs d2 ON di.drug2_id = d2.drug_id
-- WHERE d1.drug_name = 'Ibuprofen' OR d2.drug_name = 'Ibuprofen';
