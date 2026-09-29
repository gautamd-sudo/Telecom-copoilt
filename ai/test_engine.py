import json
from src.engine import AnomalyEngine

def test_engine():
    engine = AnomalyEngine()
    
    metadata = {
        "tenant": "Acme Telecom",
        "network": "5G-SA",
        "region": "NA-EAST",
        "site": "NYC-01",
        "cell": "CELL_NYC_104"
    }

    # 1. Test Statistical Threshold
    anomalies = engine.analyze(metadata, "latency", 65.0, [])
    assert len(anomalies) > 0
    print("Statistical Anomaly:")
    print(anomalies[0].model_dump_json(indent=2))

    # 2. Test Rolling Baseline
    historical_baseline = [20.0, 21.0, 19.5, 20.5, 22.0, 20.0, 19.0, 21.5, 20.2, 19.8]
    anomalies = engine.analyze(metadata, "throughput", 5.0, historical_baseline)
    # The mean is ~20.35, std is ~0.89. A value of 5.0 is ~17 std devs away.
    assert len(anomalies) > 0
    print("\nRolling Baseline Anomaly:")
    print(anomalies[0].model_dump_json(indent=2))

    # 3. Test Isolation Forest
    # Normal data around 50
    historical_if = [50 + (i % 5 - 2) for i in range(100)] 
    anomalies = engine.analyze(metadata, "packet_loss", 95.0, historical_if)
    assert len(anomalies) > 0
    print("\nIsolation Forest Anomaly:")
    print(anomalies[0].model_dump_json(indent=2))

if __name__ == "__main__":
    test_engine()
    print("\nAll tests passed successfully!")
