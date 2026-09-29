import json
from src.rca import RCAEngine

def test_rca():
    engine = RCAEngine()
    metadata = {
        "tenant": "Acme Telecom",
        "network": "5G-SA",
        "region": "NA-EAST",
        "site": "NYC-01",
        "cell": "CELL_NYC_104"
    }
    
    result = engine.analyze("INC-2026-9042", metadata)
    print("RCA Result:")
    print(result.model_dump_json(indent=2))
    assert result.root_cause == "Backhaul degradation"
    assert result.confidence > 0.7

if __name__ == "__main__":
    test_rca()
    print("\nAll RCA tests passed!")
