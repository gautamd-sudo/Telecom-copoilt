from pydantic import BaseModel
from typing import Dict, Any, Optional

class InteractionAnalysisResult(BaseModel):
    sentiment: str # POSITIVE, NEUTRAL, NEGATIVE
    intent: str
    frustration_score: float
    urgency_score: float
    severity: str # HIGH, MEDIUM, LOW
    confidence: float
    model_version: str
    explanation: str

class SentimentAnalyzer:
    def __init__(self):
        self.model_version = "v1.0-sentiment-classifier"
        
        # Keywords for intent detection
        self.intents = {
            "billing": ["bill", "charge", "invoice", "payment", "overcharge", "fees"],
            "network": ["no service", "drop", "signal", "coverage", "slow", "internet", "data", "network", "dead", "outage"],
            "recharge": ["topup", "recharge", "balance", "credit"],
            "sim": ["sim", "lost", "replacement", "esim"],
            "roaming": ["travel", "international", "roaming", "abroad"],
            "cancellation": ["cancel", "close", "disconnect", "leave"]
        }

    def _determine_intent(self, text: str) -> str:
        text_lower = text.lower()
        for intent, keywords in self.intents.items():
            if any(kw in text_lower for kw in keywords):
                return intent.upper()
        return "OTHER"

    def analyze(self, text: str) -> InteractionAnalysisResult:
        # 1. Base initialization
        text_lower = text.lower()
        
        # 2. Heuristics for prototype (in production this calls an NLP model like HuggingFace Transformers)
        sentiment = "NEUTRAL"
        frustration = 0.1
        urgency = 0.1
        severity = "LOW"
        confidence = 0.85
        explanation = "Default neutral assessment."

        # Detect negative signals
        negative_words = ['bad', 'terrible', 'worst', 'angry', 'hate', 'stupid', 'ridiculous', 'unacceptable', 'fail', 'issue']
        urgent_words = ['immediately', 'asap', 'now', 'urgent', 'emergency']
        
        neg_count = sum(1 for w in negative_words if w in text_lower)
        urg_count = sum(1 for w in urgent_words if w in text_lower)
        
        if neg_count > 0:
            sentiment = "NEGATIVE"
            frustration = min(0.3 + (neg_count * 0.2), 1.0)
            explanation = f"Detected {neg_count} negative keywords indicating frustration."
        
        if urg_count > 0:
            urgency = min(0.5 + (urg_count * 0.3), 1.0)
            explanation += f" Detected high urgency signals."

        if 'thank' in text_lower or 'great' in text_lower or 'awesome' in text_lower or 'good' in text_lower:
            sentiment = "POSITIVE"
            frustration = 0.0
            urgency = 0.0
            explanation = "Detected positive sentiment keywords."

        # Severity mapping
        if frustration >= 0.7 or urgency >= 0.8:
            severity = "HIGH"
        elif frustration >= 0.4 or urgency >= 0.5:
            severity = "MEDIUM"
            
        intent = self._determine_intent(text)

        # Handle uncertainty constraint
        # "Do not claim emotions as facts when the model has uncertainty."
        if neg_count == 0 and '?' in text:
            # Maybe just a question, lower confidence
            confidence = 0.6
            explanation = "Customer is asking a question; emotion is ambiguous so assuming neutral."
            sentiment = "NEUTRAL"

        return InteractionAnalysisResult(
            sentiment=sentiment,
            intent=intent,
            frustration_score=round(frustration, 2),
            urgency_score=round(urgency, 2),
            severity=severity,
            confidence=confidence,
            model_version=self.model_version,
            explanation=explanation.strip()
        )
