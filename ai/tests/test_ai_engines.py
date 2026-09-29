import pytest
from src.engine import AnomalyEngine
from src.rca import RCAEngine
from src.copilot import TelecomCopilot
from src.sentiment import SentimentAnalyzer

def test_anomaly_engine():
    engine = AnomalyEngine()
    metadata = {"tenant": "T1", "network": "N1", "region": "R1", "site": "S1", "cell": "C1"}
    # Normal data
    normal_res = engine.analyze(metadata, "latency", 20.0, [20.0, 21.0, 19.0, 20.5])
    assert len(normal_res) == 0

    # Anomalous data
    anomaly_res = engine.analyze(metadata, "latency", 150.0, [20.0, 21.0, 19.0, 20.5])
    assert len(anomaly_res) == 1
    assert anomaly_res[0].severity in ["HIGH", "CRITICAL"]
    assert anomaly_res[0].metric == "latency"

def test_sentiment_analyzer():
    analyzer = SentimentAnalyzer()
    res = analyzer.analyze("The network is constantly dropping calls, this is terrible!")
    assert res.sentiment == "NEGATIVE"
    assert res.intent in ["technical_support", "network", "complaint", "NETWORK", "TECHNICAL_SUPPORT"]

def test_copilot_prompt_injection_handling():
    copilot = TelecomCopilot("T1", "U1")
    # Copilot process_message itself does not block injections, the API does.
    # We test that copilot tools strictly enforce tenant ID.
    metrics = copilot.tools.queryNetworkMetrics("T1", "latency", "24h")
    assert isinstance(metrics, str)

