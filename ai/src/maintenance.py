from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class EquipmentData(BaseModel):
    id: str
    type: str
    age_days: int
    recent_alarms: int
    temperature_c: float
    power_events: int
    throughput_drop_pct: float

class MaintenancePrediction(BaseModel):
    failure_prob: float
    degradation_prob: float
    risk_level: str
    risk_window: str
    model: str
    model_version: str
    features: Dict[str, Any]
    confidence: float
    evidence: List[str]
    recommendations: List[str]

class PredictiveMaintenanceEngine:
    def __init__(self):
        self.model_name = "XGBoost-Failure-Predictor"
        self.model_version = "v2.1"
        
    def predict(self, eq: EquipmentData) -> MaintenancePrediction:
        fail_prob = 0.05
        deg_prob = 0.10
        evidence = []
        recommendations = []
        
        # Simple heuristic mapping simulating an ML tree
        if eq.age_days > 1500:
            fail_prob += 0.20
            deg_prob += 0.40
            evidence.append(f"Equipment age ({eq.age_days} days) exceeds 4-year optimal lifespan.")
            recommendations.append("Schedule hardware lifecycle replacement.")
            
        if eq.temperature_c > 75.0:
            fail_prob += 0.35
            deg_prob += 0.25
            evidence.append(f"Operating temperature ({eq.temperature_c}°C) is critically high.")
            recommendations.append("Inspect HVAC and site cooling immediately.")
            
        if eq.recent_alarms > 5:
            fail_prob += 0.15
            evidence.append(f"High frequency of recent alarms ({eq.recent_alarms} in 7 days).")
            
        if eq.power_events > 0:
            deg_prob += 0.30
            evidence.append(f"Experienced {eq.power_events} power fluctuation events.")
            recommendations.append("Verify UPS battery health.")
            
        if eq.throughput_drop_pct > 15.0:
            deg_prob += 0.20
            evidence.append(f"Sustained throughput degradation of {eq.throughput_drop_pct}%.")
            
        fail_prob = min(fail_prob, 0.98)
        deg_prob = min(deg_prob, 0.99)
        
        if fail_prob > 0.6:
            risk = "CRITICAL"
            window = "7_DAYS"
        elif fail_prob > 0.3 or deg_prob > 0.7:
            risk = "HIGH"
            window = "14_DAYS"
        elif deg_prob > 0.4:
            risk = "MEDIUM"
            window = "30_DAYS"
        else:
            risk = "LOW"
            window = "90_DAYS"
            evidence.append("Operating nominally within thresholds.")
            
        if not recommendations:
            recommendations.append("Continue standard monitoring.")

        return MaintenancePrediction(
            failure_prob=round(fail_prob, 2),
            degradation_prob=round(deg_prob, 2),
            risk_level=risk,
            risk_window=window,
            model=self.model_name,
            model_version=self.model_version,
            features=eq.model_dump(),
            confidence=0.88,
            evidence=evidence,
            recommendations=recommendations
        )
