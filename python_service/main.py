"""
FastAPI microservice for SHAP-based drug recommendation.
Lightweight enough to run on 8GB RAM laptops.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from model import DrugRecommender

app = FastAPI(title="Drug Recommendation SHAP Service")

# CORS for Node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model (loads on startup)
recommender = None

class PatientInput(BaseModel):
    age: int
    gender: str
    heart_rate: int
    blood_type: str
    allergies: List[str]
    medical_history: List[str]
    symptoms: List[str]
    current_medications: str

class DrugRecommendation(BaseModel):
    name: str
    confidence: float
    dosage: str
    frequency: str
    effectiveness: str
    side_effects_risk: str
    condition_match: str

class ShapExplanation(BaseModel):
    feature: str
    influence: float
    direction: str

class DrugInteraction(BaseModel):
    drug1: str
    drug2: str
    severity: str
    description: str

class PredictionResponse(BaseModel):
    recommendations: List[DrugRecommendation]
    explanations: List[ShapExplanation]
    interactions: List[DrugInteraction]

@app.on_event("startup")
async def load_model():
    global recommender
    print("Loading drug recommendation model...")
    recommender = DrugRecommender()
    recommender.load_and_train()
    print("Model loaded successfully!")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": recommender is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict(patient: PatientInput):
    if recommender is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        result = recommender.predict(
            age=patient.age,
            gender=patient.gender,
            heart_rate=patient.heart_rate,
            blood_type=patient.blood_type,
            allergies=patient.allergies,
            medical_history=patient.medical_history,
            symptoms=patient.symptoms,
            current_medications=patient.current_medications
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
