import { PatientInput, RecommendationResult, DrugRecommendation, ShapExplanation, DrugInteraction } from '@/types/medical';

// Mock ML prediction - in production this would call your backend API
export const generateRecommendation = (input: PatientInput): RecommendationResult => {
  const recommendations: DrugRecommendation[] = [];
  const explanations: ShapExplanation[] = [];
  const interactions: DrugInteraction[] = [];

  // Symptom-based recommendations (simplified mock logic)
  if (input.symptoms.includes('Fever') || input.symptoms.includes('Headache')) {
    if (!input.allergies.includes('Aspirin') && !input.allergies.includes('NSAIDs')) {
      recommendations.push({
        name: 'Acetaminophen (Paracetamol)',
        confidence: 0.92,
        dosage: '500-1000mg',
        frequency: 'Every 4-6 hours as needed',
      });
      explanations.push(
        { feature: 'Fever symptom present', influence: 40, direction: 'positive' },
        { feature: 'No liver disease history', influence: 25, direction: 'positive' },
        { feature: `Age appropriate (${input.age})`, influence: 20, direction: 'positive' },
        { feature: 'No contraindicated allergies', influence: 15, direction: 'positive' }
      );
    }
  }

  if (input.symptoms.includes('Cough') || input.symptoms.includes('Sore Throat')) {
    recommendations.push({
      name: 'Dextromethorphan',
      confidence: 0.85,
      dosage: '10-20mg',
      frequency: 'Every 4 hours as needed',
    });
    if (recommendations.length === 1) {
      explanations.push(
        { feature: 'Cough/throat symptoms', influence: 45, direction: 'positive' },
        { feature: 'Non-sedating option preferred', influence: 30, direction: 'positive' },
        { feature: 'Safe drug profile', influence: 25, direction: 'positive' }
      );
    }
  }

  if (input.symptoms.includes('Nausea')) {
    recommendations.push({
      name: 'Ondansetron',
      confidence: 0.78,
      dosage: '4-8mg',
      frequency: 'Every 8 hours as needed',
    });
  }

  // Default recommendation if no specific symptoms match
  if (recommendations.length === 0) {
    recommendations.push({
      name: 'General Supportive Care',
      confidence: 0.65,
      dosage: 'N/A',
      frequency: 'As directed by physician',
    });
    explanations.push(
      { feature: 'No specific drug indication', influence: 50, direction: 'negative' },
      { feature: 'Recommend physician consultation', influence: 50, direction: 'positive' }
    );
  }

  // Check for potential interactions
  if (input.currentMedications.toLowerCase().includes('warfarin') && 
      recommendations.some(r => r.name.includes('Acetaminophen'))) {
    interactions.push({
      drug1: 'Warfarin',
      drug2: 'Acetaminophen',
      severity: 'moderate',
      description: 'High doses of acetaminophen may increase the anticoagulant effect of warfarin. Monitor INR closely.',
    });
  }

  if (input.medicalHistory.includes('Liver Disease') && 
      recommendations.some(r => r.name.includes('Acetaminophen'))) {
    interactions.push({
      drug1: 'Liver Disease',
      drug2: 'Acetaminophen',
      severity: 'high',
      description: 'Acetaminophen should be used with caution in patients with liver disease. Maximum daily dose should not exceed 2g.',
    });
  }

  return { recommendations, explanations, interactions };
};
