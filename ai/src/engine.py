from typing import Dict, List, Any, Optional
import numpy as np
from pydantic import BaseModel
from datetime import datetime

class AnomalyResult(BaseModel):
    id: Optional[str] = None
    tenant: str
    network: str
    region: str
    site: str
    cell: str
    metric: str
    observed_value: float
    expected_value: float
    anomaly_score: float
    severity: str # CRITICAL, MAJOR, MINOR
    detected_at: str
    model: str
    model_version: str
    explanation: str

class DetectionModel:
    def detect(self, metadata: Dict[str, str], metric: str, current_value: float, historical_data: List[float]) -> Optional[AnomalyResult]:
        raise NotImplementedError

class StatisticalThresholdModel(DetectionModel):
    def __init__(self, metric_thresholds: Dict[str, Dict[str, float]]):
        # e.g., {'latency': {'max': 100}, 'availability': {'min': 95}}
        self.thresholds = metric_thresholds

    def detect(self, metadata: Dict[str, str], metric: str, current_value: float, historical_data: List[float]) -> Optional[AnomalyResult]:
        if metric not in self.thresholds:
            return None
            
        limits = self.thresholds[metric]
        is_anomaly = False
        expected = None
        explanation = ""
        severity = "MINOR"
        
        if 'max' in limits and current_value > limits['max']:
            is_anomaly = True
            expected = limits['max']
            diff = current_value - expected
            explanation = f"Observed {metric} ({current_value}) exceeds maximum threshold ({expected})."
            severity = "CRITICAL" if diff > (expected * 0.5) else "MAJOR"
            
        elif 'min' in limits and current_value < limits['min']:
            is_anomaly = True
            expected = limits['min']
            diff = expected - current_value
            explanation = f"Observed {metric} ({current_value}) fell below minimum threshold ({expected})."
            severity = "CRITICAL" if diff > (expected * 0.2) else "MAJOR"
            
        if is_anomaly:
            return AnomalyResult(
                **metadata,
                metric=metric,
                observed_value=current_value,
                expected_value=expected,
                anomaly_score=1.0,
                severity=severity,
                detected_at=datetime.utcnow().isoformat(),
                model="StatisticalThreshold",
                model_version="v1.0",
                explanation=explanation
            )
        return None

class RollingBaselineModel(DetectionModel):
    def __init__(self, std_dev_multiplier: float = 3.0):
        self.std_dev_multiplier = std_dev_multiplier

    def detect(self, metadata: Dict[str, str], metric: str, current_value: float, historical_data: List[float]) -> Optional[AnomalyResult]:
        if not historical_data or len(historical_data) < 10:
            return None # Not enough data to establish a baseline
            
        mean = np.mean(historical_data)
        std = np.std(historical_data)
        
        # Avoid division by zero
        if std == 0:
            std = 0.001
            
        z_score = abs(current_value - mean) / std
        
        if z_score > self.std_dev_multiplier:
            severity = "CRITICAL" if z_score > 5.0 else "MAJOR" if z_score > 4.0 else "MINOR"
            return AnomalyResult(
                **metadata,
                metric=metric,
                observed_value=current_value,
                expected_value=float(mean),
                anomaly_score=float(z_score),
                severity=severity,
                detected_at=datetime.utcnow().isoformat(),
                model="RollingBaseline",
                model_version="v1.0",
                explanation=f"Value {current_value:.2f} is {z_score:.2f} standard deviations from the rolling mean of {mean:.2f}."
            )
        return None

class IsolationForestWrapper(DetectionModel):
    def __init__(self):
        from sklearn.ensemble import IsolationForest
        self.model = IsolationForest(contamination=0.05, random_state=42)
        
    def detect(self, metadata: Dict[str, str], metric: str, current_value: float, historical_data: List[float]) -> Optional[AnomalyResult]:
        if not historical_data or len(historical_data) < 50:
            return None # Requires more data
            
        # Fit on history
        data = np.array(historical_data).reshape(-1, 1)
        self.model.fit(data)
        
        # Predict on current
        pred = self.model.predict(np.array([[current_value]]))
        score = self.model.decision_function(np.array([[current_value]]))[0]
        
        if pred[0] == -1: # Anomaly detected
            # For explanation, we can compare to median
            median = np.median(historical_data)
            return AnomalyResult(
                **metadata,
                metric=metric,
                observed_value=current_value,
                expected_value=float(median),
                anomaly_score=float(-score), # Negative score indicates anomaly in sklearn, invert for easier reading
                severity="MAJOR",
                detected_at=datetime.utcnow().isoformat(),
                model="IsolationForest",
                model_version="v1.0",
                explanation=f"Isolation Forest classified {current_value:.2f} as a structural anomaly compared to recent typical behavior (median ~{median:.2f})."
            )
        return None

class XGBoostPredictiveModel(DetectionModel):
    def __init__(self):
        # Placeholder for XGBoost model trained on historical fault data
        # import xgboost as xgb
        # self.model = xgb.Booster({'nthread': 4})
        # self.model.load_model('xgboost_fault_model.json')
        pass
        
    def detect(self, metadata: Dict[str, str], metric: str, current_value: float, historical_data: List[float]) -> Optional[AnomalyResult]:
        # Implementation would extract features from historical_data + current_value
        # and predict probability of a fault.
        # For this prototype, we return None as we don't have a pre-trained model.
        return None

class AnomalyEngine:
    def __init__(self):
        self.models = [
            StatisticalThresholdModel({
                'latency': {'max': 50.0},
                'packet_loss': {'max': 1.0},
                'availability': {'min': 99.0}
            }),
            RollingBaselineModel(std_dev_multiplier=3.0),
            IsolationForestWrapper(),
            XGBoostPredictiveModel()
        ]

    def analyze(self, metadata: Dict[str, str], metric: str, current_value: float, historical_data: List[float]) -> List[AnomalyResult]:
        import uuid
        anomalies = []
        for model in self.models:
            result = model.detect(metadata, metric, current_value, historical_data)
            if result:
                if not result.id:
                    result.id = f"ANOM-{str(uuid.uuid4())[:8]}"
                anomalies.append(result)
        return anomalies
