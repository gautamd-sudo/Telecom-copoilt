# Deployment Guide

## 1. Architecture
The Telecom AI platform utilizes a containerized microservices architecture optimized for Kubernetes.
- **Frontend:** Next.js (Standalone build)
- **Backend:** Node.js/Express with Prisma ORM
- **AI Core:** Python/FastAPI with Scikit-learn
- **Data Layer:** PostgreSQL (State), Redis (Cache), Kafka (Event Bus)

## 2. CI/CD Pipeline
Deployment is fully automated via GitHub Actions (`.github/workflows/deploy.yml`):
1. **Pre-flight:** Unit testing, Jest, PyTest, and static analysis (tsc).
2. **Containerization:** Immutable Docker images tagged with Git SHA.
3. **Migration:** Prisma schema migrations execute as a discrete Kubernetes Job *before* rolling updates.
4. **Rollout:** Kubernetes Deployment executes a `RollingUpdate` strategy (`maxUnavailable: 0`).

## 3. Kubernetes Primitives
- **Horizontal Pod Autoscaler (HPA):** Auto-scales Backend and AI pods dynamically between 3 and 10 replicas targeting 70% CPU utilization.
- **Liveness & Readiness:** Prevents routing traffic to cold AI models until memory is fully hydrated.

## 4. Rollback Strategy
If a deployment fails the health checks or SLA metrics dip:
```bash
kubectl rollout undo deployment/telecom-backend
kubectl rollout undo deployment/telecom-ai
```
Database rollbacks must be performed manually using the Disaster Recovery runbook if a destructive schema change was committed.
