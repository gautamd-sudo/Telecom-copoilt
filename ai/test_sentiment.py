import json
from src.sentiment import SentimentAnalyzer

def test_sentiment():
    analyzer = SentimentAnalyzer()
    
    # Negative / Urgent
    res1 = analyzer.analyze("My network is totally dead and I am very angry! Fix this immediately!")
    print("Negative/Urgent:", res1.model_dump_json(indent=2))
    assert res1.sentiment == "NEGATIVE"
    assert res1.severity == "HIGH"
    assert res1.intent == "NETWORK"
    
    # Billing Question
    res2 = analyzer.analyze("Can you explain why my invoice is higher this month?")
    print("\nBilling Neutral:", res2.model_dump_json(indent=2))
    assert res2.intent == "BILLING"
    assert res2.sentiment == "NEUTRAL"
    assert res2.confidence == 0.6 # Due to uncertainty constraint on questions
    assert "ambiguous" in res2.explanation
    
    # Cancellation
    res3 = analyzer.analyze("I want to cancel my plan, it's terrible.")
    print("\nCancellation:", res3.model_dump_json(indent=2))
    assert res3.intent == "CANCELLATION"
    assert res3.sentiment == "NEGATIVE"

if __name__ == "__main__":
    test_sentiment()
    print("\nAll Sentiment tests passed!")
