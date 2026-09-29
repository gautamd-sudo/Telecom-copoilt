from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class RCAEvidence(BaseModel):
    description: str
    source_type: str # 'KPI', 'ALARM', 'EVENT', 'HISTORY'
    impact_score: float # 0.0 to 1.0

class RCAResult(BaseModel):
    incident_id: str
    root_cause: str
    confidence: float
    evidence: List[RCAEvidence]
    alternative_causes: List[str]
    recommended_actions: List[str]

class MockEvidenceCollector:
    def collect(self, incident_id: str, metadata: Dict[str, str]) -> Dict[str, Any]:
        # In a real system, this queries TimescaleDB, PostgreSQL, ElasticSearch, etc.
        return {
            "kpis": [
                {"metric": "latency", "trend": "increase", "percentage": 42},
                {"metric": "packet_loss", "trend": "increase", "percentage": 17}
            ],
            "alarms": [
                {"name": "Backhaul Interface Down", "time_offset_min": -4, "severity": "CRITICAL"}
            ],
            "history": [
                {"similar_incidents": 2, "timeframe_days": 30, "resolved_cause": "Transport Congestion"}
            ]
        }

class RCAEngine:
    def __init__(self):
        self.collector = MockEvidenceCollector()

    def analyze(self, incident_id: str, metadata: Dict[str, str]) -> RCAResult:
        raw_evidence = self.collector.collect(incident_id, metadata)
        
        evidence_list = []
        score = 0.0
        
        # Correlate KPIs
        for kpi in raw_evidence.get('kpis', []):
            if kpi['metric'] == 'latency' and kpi['percentage'] > 30:
                evidence_list.append(RCAEvidence(
                    description=f"latency {kpi['trend']}d {kpi['percentage']}%",
                    source_type="KPI",
                    impact_score=0.8
                ))
                score += 0.3
            elif kpi['metric'] == 'packet_loss' and kpi['percentage'] > 10:
                evidence_list.append(RCAEvidence(
                    description=f"packet loss {kpi['trend']}d {kpi['percentage']}%",
                    source_type="KPI",
                    impact_score=0.7
                ))
                score += 0.2
                
        # Correlate Alarms
        for alarm in raw_evidence.get('alarms', []):
            if 'Backhaul' in alarm['name']:
                evidence_list.append(RCAEvidence(
                    description=f"backhaul alarm occurred {abs(alarm['time_offset_min'])} minutes earlier",
                    source_type="ALARM",
                    impact_score=0.9
                ))
                score += 0.4
                
        # Correlate History
        for hist in raw_evidence.get('history', []):
            if hist['similar_incidents'] > 0:
                evidence_list.append(RCAEvidence(
                    description=f"same site had similar incident {hist['similar_incidents']} times previously",
                    source_type="HISTORY",
                    impact_score=0.6
                ))
                
        confidence = min(0.95, score) # Cap at 95%
        
        if score > 0.7:
            root_cause = "Backhaul degradation"
            alternative_causes = ["Transport congestion", "Equipment fault at PE router"]
            recommended_actions = [
                "Verify optical power levels on backhaul interface",
                "Check transport network for upstream routing loops",
                "Dispatch field engineer if remote reboot fails"
            ]
        else:
            root_cause = "Unknown Degradation"
            alternative_causes = ["Software bug", "Interference"]
            recommended_actions = ["Gather more logs", "Restart cell"]

        return RCAResult(
            incident_id=incident_id,
            root_cause=root_cause,
            confidence=round(confidence, 2),
            evidence=evidence_list,
            alternative_causes=alternative_causes,
            recommended_actions=recommended_actions
        )
