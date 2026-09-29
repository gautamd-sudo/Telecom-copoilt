# Operations Runbook

## Alert: High API Latency (>500ms)
**Symptoms:** P99 latency spikes on `/api/v1/network` or `/api/v1/incidents`.
**Resolution:**
1. Check Database connection pool limits.
2. Verify Redis cache hit rates. If Redis was evicted, latency will temporarily spike.
3. Verify HPA is scaling Pods. Run `kubectl get hpa`.

## Alert: AI Inference Queue Deepening
**Symptoms:** `kafka_consumer_lag` metric climbs rapidly.
**Resolution:**
1. The AI engine is CPU-bound. Verify `telecom-ai` limits.
2. Temporarily increase MaxReplicas in `hpa.yaml`.
3. Check if identical telemetry metrics are bypassing the Hash-Deduplicator cache.

## Alert: Out of Memory (OOMKilled)
**Symptoms:** Pods restarting with `OOMKilled` status.
**Resolution:**
1. Typically impacts the AI Pod due to large XGBoost/IsolationForest model matrices.
2. Increase memory limits in `deployment-backend.yaml` from `1Gi` to `2Gi`.
3. Ensure Python GC is running.
