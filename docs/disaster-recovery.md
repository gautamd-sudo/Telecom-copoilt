# Disaster Recovery (DR) Plan

## Recovery Time Objective (RTO)
**Target:** 15 Minutes for active-active failover; 2 Hours for complete regional rebuild from cold storage.

## Recovery Point Objective (RPO)
**Target:** 1 Hour max data loss for historical telemetry. 0 Minutes for active subscriptions (via streaming replication).

## Procedures

### 1. Database Corruption
1. Terminate all incoming API traffic via Ingress scale-down.
2. Initialize the latest S3 Snapshot via `/docs/backup-strategy.md`.
3. Replay the Kafka Dead Letter Queue (DLQ) if any ingestions occurred during the corruption window.

### 2. Regional Outage
1. Update DNS records (Route53/Cloudflare) to point to the fallback region's Load Balancer.
2. Ensure Kafka MirrorMaker has synced the event queues.
3. Bring up the passive read-replica PostgreSQL instance to Primary.

### 3. Compromised Secrets
1. Revoke the master API tokens immediately from the Tenant Dashboard.
2. Rotate Kubernetes Secrets:
```bash
kubectl apply -f new-secrets.yaml
kubectl rollout restart deployment/telecom-backend
```
