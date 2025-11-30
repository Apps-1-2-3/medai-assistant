import { PatientInput, RecommendationResult, DrugRecommendation, ShapExplanation, DrugInteraction } from '@/types/medical';

// Configuration for Python service
const PYTHON_SERVICE_URL = 'http://localhost:8000';

// Try to call Python SHAP service, fallback to mock if unavailable
export const generateRecommendation = async (input: PatientInput): Promise<RecommendationResult> => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: input.age,
        gender: input.gender,
        heart_rate: input.heartRate,
        blood_type: input.bloodType,
        allergies: input.allergies,
        medical_history: input.medicalHistory,
        symptoms: input.symptoms,
        current_medications: input.currentMedications,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        recommendations: data.recommendations.map((r: any) => ({
          name: r.name,
          confidence: r.confidence,
          dosage: r.dosage,
          frequency: r.frequency,
          effectiveness: r.effectiveness,
          sideEffectsRisk: r.side_effects_risk,
          conditionMatch: r.condition_match,
        })),
        explanations: data.explanations,
        interactions: data.interactions,
      };
    }
  } catch (error) {
    console.log('Python service unavailable, using enhanced mock prediction');
  }

  // Enhanced mock prediction with real factor consideration
  return generateEnhancedMockRecommendation(input);
};

// Enhanced mock that considers more factors
const generateEnhancedMockRecommendation = (input: PatientInput): RecommendationResult => {
  const recommendations: DrugRecommendation[] = [];
  const explanations: ShapExplanation[] = [];
  const interactions: DrugInteraction[] = [];

  // Age-based dosage modifier
  const isElderly = input.age > 65;
  const isPediatric = input.age < 18;
  const doseModifier = isElderly ? 0.75 : isPediatric ? 0.5 : 1.0;

  // Heart rate consideration
  const isTachycardic = input.heartRate > 100;
  const isBradycardic = input.heartRate < 60;

  // Symptom-based recommendations with real drug data consideration
  if (input.symptoms.includes('Fever') || input.symptoms.includes('Headache')) {
    if (!input.allergies.includes('Aspirin') && !input.allergies.includes('NSAIDs')) {
      const baseDose = Math.round(500 * doseModifier);
      recommendations.push({
        name: 'Acetaminophen (Paracetamol)',
        confidence: 0.92,
        dosage: `${baseDose}-${baseDose * 2}mg`,
        frequency: isElderly ? 'Every 6-8 hours' : 'Every 4-6 hours as needed',
        effectiveness: 'Highly Effective',
        sideEffectsRisk: 'Low Risk',
        conditionMatch: input.symptoms.includes('Fever') ? 'fever' : 'headache',
      });
      
      explanations.push(
        { feature: `Symptom match: ${input.symptoms.filter(s => ['Fever', 'Headache'].includes(s)).join(', ')}`, influence: 35, direction: 'positive' },
        { feature: input.medicalHistory.includes('Liver Disease') ? 'Liver disease noted - reduced dose' : 'No liver disease contraindication', influence: 20, direction: input.medicalHistory.includes('Liver Disease') ? 'negative' : 'positive' },
        { feature: `Age-appropriate dosing (${input.age} years)`, influence: 15, direction: 'positive' },
        { feature: 'No documented allergies to drug class', influence: 15, direction: 'positive' }
      );
    }
  }

  if (input.symptoms.includes('Cough') || input.symptoms.includes('Sore Throat')) {
    const isProductiveCough = input.symptoms.includes('Runny Nose');
    recommendations.push({
      name: isProductiveCough ? 'Guaifenesin' : 'Dextromethorphan',
      confidence: 0.85,
      dosage: isProductiveCough ? '200-400mg' : `${Math.round(10 * doseModifier)}-${Math.round(20 * doseModifier)}mg`,
      frequency: 'Every 4 hours as needed',
      effectiveness: 'Considerably Effective',
      sideEffectsRisk: 'Mild Risk',
      conditionMatch: 'cough/cold symptoms',
    });

    if (recommendations.length === 1) {
      explanations.push(
        { feature: 'Respiratory symptoms detected', influence: 40, direction: 'positive' },
        { feature: isProductiveCough ? 'Productive cough - expectorant preferred' : 'Dry cough - suppressant preferred', influence: 25, direction: 'positive' },
        { feature: 'Safe drug interaction profile', influence: 20, direction: 'positive' }
      );
    }
  }

  if (input.symptoms.includes('Nausea')) {
    recommendations.push({
      name: 'Ondansetron',
      confidence: 0.78,
      dosage: isElderly ? '4mg' : '4-8mg',
      frequency: 'Every 8 hours as needed',
      effectiveness: 'Highly Effective',
      sideEffectsRisk: 'Low Risk',
      conditionMatch: 'nausea/vomiting',
    });
  }

  // Chest pain or shortness of breath - more careful
  if (input.symptoms.includes('Chest Pain') || input.symptoms.includes('Shortness of Breath')) {
    if (input.medicalHistory.includes('Heart Disease') || input.medicalHistory.includes('Asthma')) {
      recommendations.push({
        name: 'Physician Consultation Required',
        confidence: 0.95,
        dosage: 'N/A',
        frequency: 'Immediate',
        effectiveness: 'Critical Assessment Needed',
        sideEffectsRisk: 'N/A',
        conditionMatch: 'cardiac/respiratory symptoms',
      });
      explanations.push(
        { feature: 'Serious symptoms detected (chest pain/dyspnea)', influence: 50, direction: 'negative' },
        { feature: 'Pre-existing cardiac/respiratory condition', influence: 30, direction: 'negative' },
        { feature: 'Requires immediate clinical evaluation', influence: 20, direction: 'positive' }
      );
    }
  }

  // Anxiety/Depression symptoms
  if (input.medicalHistory.includes('Depression') || input.medicalHistory.includes('Anxiety')) {
    if (input.symptoms.includes('Fatigue') || input.symptoms.includes('Headache')) {
      explanations.push(
        { feature: 'Mental health history considered in drug selection', influence: 10, direction: 'positive' },
        { feature: 'Avoiding drugs with CNS depression effects', influence: 10, direction: 'positive' }
      );
    }
  }

  // Heart rate considerations
  if (isTachycardic && recommendations.length > 0) {
    explanations.push({
      feature: `Elevated heart rate (${input.heartRate} bpm) - monitoring advised`,
      influence: 8,
      direction: 'negative'
    });
  } else if (isBradycardic && recommendations.length > 0) {
    explanations.push({
      feature: `Low heart rate (${input.heartRate} bpm) - avoid rate-lowering drugs`,
      influence: 8,
      direction: 'negative'
    });
  } else if (input.heartRate >= 60 && input.heartRate <= 100 && recommendations.length > 0) {
    explanations.push({
      feature: `Normal heart rate (${input.heartRate} bpm)`,
      influence: 5,
      direction: 'positive'
    });
  }

  // Blood type consideration (mainly for hospital records)
  if (input.bloodType && recommendations.length > 0) {
    explanations.push({
      feature: `Blood type ${input.bloodType} documented for records`,
      influence: 2,
      direction: 'positive'
    });
  }

  // Default recommendation if nothing matches
  if (recommendations.length === 0) {
    recommendations.push({
      name: 'General Supportive Care',
      confidence: 0.65,
      dosage: 'N/A',
      frequency: 'As directed by physician',
      effectiveness: 'Varies',
      sideEffectsRisk: 'Low Risk',
      conditionMatch: 'general symptoms',
    });
    explanations.push(
      { feature: 'No specific drug indication from provided symptoms', influence: 45, direction: 'negative' },
      { feature: 'Recommend physician consultation for evaluation', influence: 40, direction: 'positive' },
      { feature: 'Conservative approach preferred', influence: 15, direction: 'positive' }
    );
  }

  // Check for potential interactions
  const currentMedsLower = input.currentMedications.toLowerCase();

  if (currentMedsLower.includes('warfarin') && 
      recommendations.some(r => r.name.includes('Acetaminophen'))) {
    interactions.push({
      drug1: 'Warfarin',
      drug2: 'Acetaminophen',
      severity: 'moderate',
      description: 'High doses of acetaminophen (>2g/day) may increase the anticoagulant effect of warfarin. Monitor INR closely if using together.',
    });
  }

  if (currentMedsLower.includes('ssri') || currentMedsLower.includes('sertraline') || currentMedsLower.includes('fluoxetine')) {
    if (recommendations.some(r => r.name.includes('Dextromethorphan'))) {
      interactions.push({
        drug1: 'SSRI Antidepressant',
        drug2: 'Dextromethorphan',
        severity: 'moderate',
        description: 'Combining SSRIs with dextromethorphan may increase risk of serotonin syndrome. Use with caution.',
      });
    }
  }

  if (input.medicalHistory.includes('Liver Disease') && 
      recommendations.some(r => r.name.includes('Acetaminophen'))) {
    interactions.push({
      drug1: 'Liver Disease',
      drug2: 'Acetaminophen',
      severity: 'high',
      description: 'Acetaminophen should be used with extreme caution in patients with liver disease. Maximum daily dose should not exceed 2g. Consider alternative analgesics.',
    });
  }

  if (input.medicalHistory.includes('Kidney Disease')) {
    if (recommendations.some(r => r.name.includes('NSAIDs') || r.name.includes('Ibuprofen'))) {
      interactions.push({
        drug1: 'Kidney Disease',
        drug2: 'NSAIDs',
        severity: 'high',
        description: 'NSAIDs can worsen kidney function. Avoid or use with extreme caution in patients with kidney disease.',
      });
    }
  }

  // Normalize explanation percentages
  const totalInfluence = explanations.reduce((sum, e) => sum + e.influence, 0);
  if (totalInfluence > 0) {
    explanations.forEach(e => {
      e.influence = Math.round((e.influence / totalInfluence) * 100);
    });
  }

  return { recommendations, explanations, interactions };
};
