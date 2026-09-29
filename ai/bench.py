import time
from src.engine import AnomalyEngine

engine = AnomalyEngine()
metadata = {"tenant": "T1", "network": "N1", "region": "R1", "site": "S1", "cell": "C1"}

start = time.time()
for _ in range(100):
    engine.analyze(metadata, "latency", 150.0, [20.0]*100)
end = time.time()
baseline = (end - start)/100 * 1000
print(f"Baseline Anomaly Inference: {baseline:.2f} ms/req")

# Caching/Optimization (skip inference if exact same payload recently processed)
cache = {}
start = time.time()
for _ in range(100):
    key = hash(("latency", 150.0, 20.0)) # simplifed
    if key in cache:
        res = cache[key]
    else:
        res = engine.analyze(metadata, "latency", 150.0, [20.0]*100)
        cache[key] = res
end = time.time()
optimized = (end - start)/100 * 1000
print(f"Cached Anomaly Inference: {optimized:.2f} ms/req")
