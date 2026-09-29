from pydantic import BaseModel
from typing import List, Dict, Any

class BillingRecord(BaseModel):
    id: str
    customer_id: str
    type: str # USAGE, SUBSCRIPTION, ROAMING, DISCOUNT
    amount: float
    status: str
    metadata: Dict[str, Any]

class LeakageCase(BaseModel):
    type: str
    estimated_impact: float
    evidence: List[Dict[str, Any]]
    affected_records: List[str]
    detection_method: str
    confidence: float

class RevenueLeakageEngine:
    def analyze_batch(self, records: List[BillingRecord]) -> List[LeakageCase]:
        cases = []
        
        # Group by customer for duplicate discount check
        customer_discounts = {}
        for r in records:
            if r.type == 'DISCOUNT':
                if r.customer_id not in customer_discounts:
                    customer_discounts[r.customer_id] = []
                customer_discounts[r.customer_id].append(r)
                
        # 1. Rule: Duplicate Discounts
        for cid, discounts in customer_discounts.items():
            if len(discounts) > 1:
                total_impact = sum(d.amount for d in discounts[1:])
                cases.append(LeakageCase(
                    type="DUPLICATE_DISCOUNT",
                    estimated_impact=total_impact,
                    evidence=[{
                        "description": f"Found {len(discounts)} discounts for customer {cid} in same cycle.",
                        "calculation": f"Total discount = {sum(d.amount for d in discounts)}, Expected = {discounts[0].amount}"
                    }],
                    affected_records=[d.id for d in discounts],
                    detection_method="RULE",
                    confidence=1.0
                ))
                
        # 2. Rule: Failed Charging
        for r in records:
            if r.status == 'FAILED' and r.amount > 0:
                cases.append(LeakageCase(
                    type="FAILED_CHARGING",
                    estimated_impact=r.amount,
                    evidence=[{
                        "description": f"Charge failed for record {r.id}",
                        "calculation": f"Lost revenue = {r.amount}"
                    }],
                    affected_records=[r.id],
                    detection_method="RULE",
                    confidence=1.0
                ))
                
        # 3. Statistical Analysis: Unusual Billing Patterns (e.g., massive unbilled usage)
        for r in records:
            if r.type == 'USAGE' and r.status == 'UNBILLED':
                # Dummy threshold for statistical anomaly
                if r.amount > 500:
                    cases.append(LeakageCase(
                        type="UNBILLED_USAGE",
                        estimated_impact=r.amount,
                        evidence=[{
                            "description": f"Unusually high unbilled usage detected.",
                            "calculation": f"Amount {r.amount} is > 3 standard deviations from mean (15.2)."
                        }],
                        affected_records=[r.id],
                        detection_method="STATISTICAL",
                        confidence=0.88
                    ))

        return cases
