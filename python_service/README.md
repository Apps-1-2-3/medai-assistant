# Python SHAP Drug Recommendation Service

A lightweight FastAPI microservice for drug recommendations with real SHAP explainability.

## Requirements
- Python 3.9+
- 8GB RAM minimum

## Setup

```bash
cd python_service

# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Run the Service

```bash
python main.py
```

The service will start at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```

### Get Drug Recommendation
```
POST /predict
Content-Type: application/json

{
  "age": 45,
  "gender": "male",
  "heart_rate": 75,
  "blood_type": "A+",
  "allergies": ["Penicillin"],
  "medical_history": ["Hypertension"],
  "symptoms": ["Headache", "Fatigue"],
  "current_medications": "lisinopril"
}
```

### Response
```json
{
  "recommendations": [
    {
      "name": "Acetaminophen",
      "confidence": 0.87,
      "dosage": "500mg",
      "frequency": "Every 6 hours as needed",
      "effectiveness": "Highly Effective",
      "side_effects_risk": "Low Risk",
      "condition_match": "headache"
    }
  ],
  "explanations": [
    {
      "feature": "Drug Effectiveness",
      "influence": 35.2,
      "direction": "positive"
    }
  ],
  "interactions": []
}
```

## Integration with Node Backend

The Node/Express backend should call this service at `http://localhost:8000/predict`.

Example Node.js call:
```javascript
const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patientData)
});
const result = await response.json();
```
