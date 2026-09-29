import json
from src.leakage import RevenueLeakageEngine, BillingRecord

def test_leakage():
    engine = RevenueLeakageEngine()
    
    records = [
        BillingRecord(id="B1", customer_id="C1", type="DISCOUNT", amount=50.0, status="BILLED", metadata={}),
        BillingRecord(id="B2", customer_id="C1", type="DISCOUNT", amount=50.0, status="BILLED", metadata={}),
        BillingRecord(id="B3", customer_id="C2", type="USAGE", amount=650.0, status="UNBILLED", metadata={}),
        BillingRecord(id="B4", customer_id="C3", type="SUBSCRIPTION", amount=20.0, status="FAILED", metadata={})
    ]
    
    cases = engine.analyze_batch(records)
    print("Detected Leakages:")
    for c in cases:
        print(c.model_dump_json(indent=2))
        
    assert len(cases) == 3
    
    dup = next(c for c in cases if c.type == "DUPLICATE_DISCOUNT")
    assert dup.estimated_impact == 50.0
    
    fail = next(c for c in cases if c.type == "FAILED_CHARGING")
    assert fail.estimated_impact == 20.0
    
    unbill = next(c for c in cases if c.type == "UNBILLED_USAGE")
    assert unbill.estimated_impact == 650.0

if __name__ == "__main__":
    test_leakage()
    print("\nAll Revenue Leakage tests passed!")
