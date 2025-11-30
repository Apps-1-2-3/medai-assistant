"""
Drug Recommendation Model with SHAP Explainability.
Uses drugLib dataset for training a lightweight Random Forest model.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
import shap
import os
from typing import List, Dict, Any

class DrugRecommender:
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.tfidf = TfidfVectorizer(max_features=100, stop_words='english')
        self.drug_data = None
        self.condition_drug_map = {}
        self.drug_info = {}
        self.explainer = None
        
    def load_and_train(self):
        """Load drugLib data and train the recommendation model."""
        data_dir = os.path.dirname(os.path.abspath(__file__))
        train_path = os.path.join(data_dir, 'data', 'drugLibTrain_raw.tsv')
        test_path = os.path.join(data_dir, 'data', 'drugLibTest_raw.tsv')
        
        # Load datasets
        train_df = pd.read_csv(train_path, sep='\t')
        test_df = pd.read_csv(test_path, sep='\t')
        
        # Combine for full dataset
        self.drug_data = pd.concat([train_df, test_df], ignore_index=True)
        
        # Clean data
        self.drug_data = self.drug_data.dropna(subset=['urlDrugName', 'condition', 'effectiveness'])
        self.drug_data['condition'] = self.drug_data['condition'].str.lower().str.strip()
        self.drug_data['urlDrugName'] = self.drug_data['urlDrugName'].str.lower().str.strip()
        
        # Build condition -> drug mapping with effectiveness scores
        self._build_drug_mappings()
        
        # Prepare features for ML model
        self._prepare_model()
        
    def _build_drug_mappings(self):
        """Build mappings of conditions to drugs with their stats."""
        effectiveness_map = {
            'Highly Effective': 5,
            'Considerably Effective': 4,
            'Moderately Effective': 3,
            'Marginally Effective': 2,
            'Ineffective': 1
        }
        
        side_effects_map = {
            'No Side Effects': 1,
            'Mild Side Effects': 2,
            'Moderate Side Effects': 3,
            'Severe Side Effects': 4,
            'Extremely Severe Side Effects': 5
        }
        
        for _, row in self.drug_data.iterrows():
            condition = row['condition']
            drug = row['urlDrugName']
            
            if condition not in self.condition_drug_map:
                self.condition_drug_map[condition] = {}
            
            if drug not in self.condition_drug_map[condition]:
                self.condition_drug_map[condition][drug] = {
                    'ratings': [],
                    'effectiveness_scores': [],
                    'side_effect_scores': [],
                    'reviews': []
                }
            
            self.condition_drug_map[condition][drug]['ratings'].append(
                row.get('rating', 5)
            )
            self.condition_drug_map[condition][drug]['effectiveness_scores'].append(
                effectiveness_map.get(row.get('effectiveness', 'Moderately Effective'), 3)
            )
            self.condition_drug_map[condition][drug]['side_effect_scores'].append(
                side_effects_map.get(row.get('sideEffects', 'Mild Side Effects'), 2)
            )
            
            # Store drug info
            if drug not in self.drug_info:
                self.drug_info[drug] = {
                    'effectiveness': row.get('effectiveness', 'Unknown'),
                    'sideEffects': row.get('sideEffects', 'Unknown'),
                    'benefitsReview': row.get('benefitsReview', ''),
                    'sideEffectsReview': row.get('sideEffectsReview', '')
                }
    
    def _prepare_model(self):
        """Prepare and train the ML model for drug scoring."""
        # Create feature matrix from drug data
        features = []
        labels = []
        
        for condition, drugs in self.condition_drug_map.items():
            for drug, stats in drugs.items():
                avg_rating = np.mean(stats['ratings'])
                avg_effectiveness = np.mean(stats['effectiveness_scores'])
                avg_side_effects = np.mean(stats['side_effect_scores'])
                review_count = len(stats['ratings'])
                
                # Feature vector: [avg_rating, avg_effectiveness, avg_side_effects, review_count]
                features.append([
                    avg_rating,
                    avg_effectiveness,
                    avg_side_effects,
                    min(review_count, 100)  # Cap review count
                ])
                
                # Label: good drug (1) if rating >= 7 and effectiveness >= 4
                labels.append(1 if avg_rating >= 7 and avg_effectiveness >= 4 else 0)
        
        if len(features) > 10:
            X = np.array(features)
            y = np.array(labels)
            
            # Train Random Forest (lightweight)
            self.model = RandomForestClassifier(
                n_estimators=50,  # Lightweight for 8GB RAM
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X, y)
            
            # Initialize SHAP explainer
            self.explainer = shap.TreeExplainer(self.model)
            
    def _match_condition(self, symptoms: List[str], medical_history: List[str]) -> List[str]:
        """Match patient symptoms/history to conditions in dataset."""
        symptom_condition_map = {
            'fever': ['infection', 'flu', 'cold', 'virus'],
            'cough': ['cold', 'flu', 'bronchitis', 'asthma', 'infection'],
            'headache': ['migraine', 'tension headache', 'pain', 'headache'],
            'fatigue': ['depression', 'chronic fatigue', 'anemia'],
            'nausea': ['nausea', 'vomiting', 'morning sickness', 'motion sickness'],
            'dizziness': ['vertigo', 'dizziness', 'hypertension'],
            'chest pain': ['angina', 'heart', 'cardiac'],
            'shortness of breath': ['asthma', 'copd', 'bronchitis', 'heart failure'],
            'joint pain': ['arthritis', 'pain', 'inflammation'],
            'muscle aches': ['pain', 'fibromyalgia', 'muscle'],
            'sore throat': ['infection', 'strep', 'pharyngitis', 'throat'],
            'runny nose': ['cold', 'allergy', 'rhinitis', 'sinusitis'],
            'diabetes': ['diabetes', 'blood sugar'],
            'hypertension': ['hypertension', 'high blood pressure', 'blood pressure'],
            'asthma': ['asthma', 'breathing', 'bronchial'],
            'heart disease': ['heart', 'cardiac', 'cardiovascular'],
            'depression': ['depression', 'mood', 'mental'],
            'anxiety': ['anxiety', 'panic', 'stress']
        }
        
        matched_conditions = set()
        
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            if symptom_lower in symptom_condition_map:
                matched_conditions.update(symptom_condition_map[symptom_lower])
        
        for condition in medical_history:
            condition_lower = condition.lower()
            if condition_lower in symptom_condition_map:
                matched_conditions.update(symptom_condition_map[condition_lower])
        
        return list(matched_conditions)
    
    def _find_drugs_for_conditions(self, conditions: List[str]) -> List[Dict]:
        """Find best drugs for matched conditions."""
        drug_scores = {}
        
        for condition in conditions:
            for db_condition, drugs in self.condition_drug_map.items():
                # Fuzzy match conditions
                if any(c in db_condition for c in conditions) or condition in db_condition:
                    for drug, stats in drugs.items():
                        avg_rating = np.mean(stats['ratings'])
                        avg_effectiveness = np.mean(stats['effectiveness_scores'])
                        avg_side_effects = np.mean(stats['side_effect_scores'])
                        review_count = len(stats['ratings'])
                        
                        # Composite score: high rating + high effectiveness - side effects
                        score = (avg_rating * 0.3 + 
                                avg_effectiveness * 2.0 - 
                                avg_side_effects * 0.5 +
                                min(review_count, 20) * 0.1)
                        
                        if drug not in drug_scores or score > drug_scores[drug]['score']:
                            drug_scores[drug] = {
                                'score': score,
                                'avg_rating': avg_rating,
                                'avg_effectiveness': avg_effectiveness,
                                'avg_side_effects': avg_side_effects,
                                'review_count': review_count,
                                'condition': db_condition
                            }
        
        # Sort by score and return top drugs
        sorted_drugs = sorted(drug_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        return sorted_drugs[:5]
    
    def _compute_shap_values(self, drug_stats: Dict) -> List[Dict]:
        """Compute SHAP values for the recommendation."""
        if self.model is None or self.explainer is None:
            return self._fallback_explanations(drug_stats)
        
        # Create feature vector for this drug
        features = np.array([[
            drug_stats['avg_rating'],
            drug_stats['avg_effectiveness'],
            drug_stats['avg_side_effects'],
            min(drug_stats['review_count'], 100)
        ]])
        
        # Get SHAP values
        shap_values = self.explainer.shap_values(features)
        
        # Handle binary classification output
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Use positive class
        
        feature_names = ['Patient Rating', 'Drug Effectiveness', 'Side Effect Risk', 'Clinical Evidence']
        
        explanations = []
        for i, (name, value) in enumerate(zip(feature_names, shap_values[0])):
            # Convert to percentage influence
            influence = abs(value) * 100 / (sum(abs(v) for v in shap_values[0]) + 0.001)
            explanations.append({
                'feature': name,
                'influence': round(influence, 1),
                'direction': 'positive' if value > 0 else 'negative'
            })
        
        return sorted(explanations, key=lambda x: x['influence'], reverse=True)
    
    def _fallback_explanations(self, drug_stats: Dict) -> List[Dict]:
        """Fallback explanations when SHAP not available."""
        explanations = []
        
        # Rating influence
        rating_influence = min(drug_stats['avg_rating'] * 5, 40)
        explanations.append({
            'feature': f"Average patient rating ({drug_stats['avg_rating']:.1f}/10)",
            'influence': round(rating_influence, 1),
            'direction': 'positive' if drug_stats['avg_rating'] >= 7 else 'negative'
        })
        
        # Effectiveness influence
        eff_influence = drug_stats['avg_effectiveness'] * 8
        explanations.append({
            'feature': 'Drug effectiveness score',
            'influence': round(eff_influence, 1),
            'direction': 'positive'
        })
        
        # Side effects influence
        se_influence = (5 - drug_stats['avg_side_effects']) * 6
        explanations.append({
            'feature': 'Low side effect profile',
            'influence': round(max(se_influence, 5), 1),
            'direction': 'positive' if drug_stats['avg_side_effects'] <= 2 else 'negative'
        })
        
        # Evidence influence
        evidence_influence = min(drug_stats['review_count'] * 0.5, 15)
        explanations.append({
            'feature': f"Clinical evidence ({drug_stats['review_count']} reviews)",
            'influence': round(evidence_influence, 1),
            'direction': 'positive'
        })
        
        return sorted(explanations, key=lambda x: x['influence'], reverse=True)
    
    def _check_interactions(self, drug: str, current_meds: str, allergies: List[str]) -> List[Dict]:
        """Check for drug interactions and allergy conflicts."""
        interactions = []
        current_meds_lower = current_meds.lower()
        
        # Known interaction pairs
        interaction_pairs = {
            'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
            'metformin': ['contrast dye'],
            'lisinopril': ['potassium', 'nsaids'],
            'simvastatin': ['grapefruit', 'erythromycin'],
            'sertraline': ['tramadol', 'triptans'],
            'omeprazole': ['clopidogrel']
        }
        
        for med, conflicts in interaction_pairs.items():
            if med in current_meds_lower and drug in conflicts:
                interactions.append({
                    'drug1': med,
                    'drug2': drug,
                    'severity': 'moderate',
                    'description': f'{drug.title()} may interact with {med}. Consult physician.'
                })
            if drug == med:
                for conflict in conflicts:
                    if conflict in current_meds_lower:
                        interactions.append({
                            'drug1': drug,
                            'drug2': conflict,
                            'severity': 'high',
                            'description': f'{drug.title()} has known interaction with {conflict}. Use caution.'
                        })
        
        # Check allergies
        for allergy in allergies:
            allergy_lower = allergy.lower()
            if allergy_lower in drug or drug in allergy_lower:
                interactions.append({
                    'drug1': drug,
                    'drug2': allergy,
                    'severity': 'high',
                    'description': f'Patient has documented allergy to {allergy}. AVOID {drug.title()}.'
                })
        
        return interactions
    
    def _get_dosage_recommendation(self, drug: str, age: int, heart_rate: int) -> tuple:
        """Get dosage based on patient factors."""
        # Age-based adjustments
        if age < 18:
            dose_modifier = 0.5
            frequency = 'Every 6-8 hours'
        elif age > 65:
            dose_modifier = 0.75
            frequency = 'Every 8-12 hours'
        else:
            dose_modifier = 1.0
            frequency = 'Every 6 hours as needed'
        
        # Heart rate considerations
        if heart_rate > 100:
            frequency += ' (monitor heart rate)'
        elif heart_rate < 60:
            frequency += ' (bradycardia noted)'
        
        # Standard dosages (simplified)
        base_dosages = {
            'default': '500mg',
            'antibiotic': '250-500mg',
            'pain': '400-600mg',
            'antidepressant': '50-100mg'
        }
        
        dosage = base_dosages.get('default', '500mg')
        
        return dosage, frequency
    
    def predict(self, age: int, gender: str, heart_rate: int, blood_type: str,
                allergies: List[str], medical_history: List[str], 
                symptoms: List[str], current_medications: str) -> Dict:
        """Generate drug recommendations with SHAP explanations."""
        
        # Match conditions based on symptoms and history
        matched_conditions = self._match_condition(symptoms, medical_history)
        
        if not matched_conditions:
            matched_conditions = ['general', 'pain', 'infection']
        
        # Find best drugs for conditions
        top_drugs = self._find_drugs_for_conditions(matched_conditions)
        
        recommendations = []
        all_explanations = []
        all_interactions = []
        
        for drug_name, stats in top_drugs[:3]:
            # Skip drugs patient is allergic to
            if any(a.lower() in drug_name.lower() for a in allergies):
                continue
            
            # Get dosage
            dosage, frequency = self._get_dosage_recommendation(drug_name, age, heart_rate)
            
            # Determine effectiveness label
            eff_score = stats['avg_effectiveness']
            if eff_score >= 4.5:
                eff_label = 'Highly Effective'
            elif eff_score >= 3.5:
                eff_label = 'Considerably Effective'
            elif eff_score >= 2.5:
                eff_label = 'Moderately Effective'
            else:
                eff_label = 'Marginally Effective'
            
            # Determine side effect risk
            se_score = stats['avg_side_effects']
            if se_score <= 1.5:
                se_label = 'Low Risk'
            elif se_score <= 2.5:
                se_label = 'Mild Risk'
            elif se_score <= 3.5:
                se_label = 'Moderate Risk'
            else:
                se_label = 'High Risk'
            
            # Calculate confidence
            confidence = min(0.95, stats['score'] / 15)
            
            recommendations.append({
                'name': drug_name.title(),
                'confidence': round(confidence, 2),
                'dosage': dosage,
                'frequency': frequency,
                'effectiveness': eff_label,
                'side_effects_risk': se_label,
                'condition_match': stats['condition']
            })
            
            # Get SHAP explanations
            explanations = self._compute_shap_values(stats)
            
            # Add patient-specific factors to explanations
            explanations.append({
                'feature': f'Age factor ({age} years)',
                'influence': 10.0 if 18 <= age <= 65 else 5.0,
                'direction': 'positive' if 18 <= age <= 65 else 'negative'
            })
            
            if heart_rate > 60 and heart_rate < 100:
                explanations.append({
                    'feature': f'Normal heart rate ({heart_rate} bpm)',
                    'influence': 8.0,
                    'direction': 'positive'
                })
            
            all_explanations.extend(explanations)
            
            # Check interactions
            interactions = self._check_interactions(drug_name, current_medications, allergies)
            all_interactions.extend(interactions)
        
        # Ensure we have at least one recommendation
        if not recommendations:
            recommendations.append({
                'name': 'General Supportive Care',
                'confidence': 0.65,
                'dosage': 'As directed',
                'frequency': 'Per physician instructions',
                'effectiveness': 'Varies',
                'side_effects_risk': 'Low Risk',
                'condition_match': 'general'
            })
            all_explanations = [{
                'feature': 'No specific drug indication from symptoms',
                'influence': 50.0,
                'direction': 'negative'
            }, {
                'feature': 'Physician consultation recommended',
                'influence': 50.0,
                'direction': 'positive'
            }]
        
        # Normalize explanation influences
        total_influence = sum(e['influence'] for e in all_explanations)
        if total_influence > 0:
            for e in all_explanations:
                e['influence'] = round(e['influence'] / total_influence * 100, 1)
        
        # Keep top explanations
        all_explanations = sorted(all_explanations, key=lambda x: x['influence'], reverse=True)[:6]
        
        return {
            'recommendations': recommendations,
            'explanations': all_explanations,
            'interactions': all_interactions
        }
