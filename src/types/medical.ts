export interface PatientInput {
  age: number;
  gender: 'male' | 'female' | 'other';
  heartRate: number;
  bloodType: string;
  allergies: string[];
  medicalHistory: string[];
  symptoms: string[];
  currentMedications: string;
}

export interface DrugRecommendation {
  name: string;
  confidence: number;
  dosage: string;
  frequency: string;
  effectiveness?: string;
  sideEffectsRisk?: string;
  conditionMatch?: string;
}

export interface ShapExplanation {
  feature: string;
  influence: number;
  direction: 'positive' | 'negative';
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
}

export interface RecommendationResult {
  recommendations: DrugRecommendation[];
  explanations: ShapExplanation[];
  interactions: DrugInteraction[];
}

export const MEDICAL_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorder',
  'Arthritis',
  'Depression',
  'Anxiety',
] as const;

export const SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Fatigue',
  'Nausea',
  'Dizziness',
  'Chest Pain',
  'Shortness of Breath',
  'Joint Pain',
  'Muscle Aches',
  'Sore Throat',
  'Runny Nose',
] as const;

export const COMMON_ALLERGIES = [
  'Penicillin',
  'Sulfa Drugs',
  'Aspirin',
  'NSAIDs',
  'Codeine',
  'Morphine',
  'Latex',
  'Contrast Dye',
] as const;

export const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;
