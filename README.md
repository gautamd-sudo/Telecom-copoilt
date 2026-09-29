# Autonomous Telecom AI Platform & Command Center

[![License: Enterprise](https://img.shields.io/badge/License-Enterprise-blue.svg)](#)
[![Zero-Cloud Air-Gapped](https://img.shields.io/badge/Inference-100%25_Zero--Cloud_Local_Ollama-emerald.svg)](#)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js_14_App_Router-black.svg)](#)
[![FastAPI](https://img.shields.io/badge/AI_Engine-FastAPI_Python_3.10+-teal.svg)](#)
[![Express Gateway](https://img.shields.io/badge/Backend-Express_TypeScript_Prisma-cyan.svg)](#)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16_Multi--Tenant_RLS-indigo.svg)](#)
[![Status](https://img.shields.io/badge/Services-100%25_Operational-green.svg)](#)

A production-grade, autonomous 5G/RAN Operations & Customer Experience Command Center. The platform couples high-frequency telemetry ingestion with on-premises Machine Learning and Generative AI, enabling telecom operators to proactively predict outages, perform automated Root Cause Analysis (RCA), mitigate revenue leakage, and optimize subscriber experience without sensitive subscriber data ever leaving the on-premise infrastructure.

---

## 🏗️ High-Level Architecture

```mermaid
flowchart TB
    subgraph DataPlane ["Edge & Telemetry Ingestion"]
        gNB["5G gNodeB Cells & PE Routers"] -->|Telemetry & Alarms| Kafka["Kafka Telemetry Stream (:9092)"]
        Kafka --> Ingest["Stream Consumers & Event Normalizers"]
    end

    subgraph StorageTier ["Persistence & Isolation"]
        Ingest --> Postgres[("PostgreSQL 16 (:5432)\nMulti-Tenant Row-Level Security")]
        Ingest --> Redis[("Redis State & Session Cache (:6379)")]
    end

    subgraph CoreServices ["Microservices Layer"]
        Postgres <--> Express["Express API Gateway (:3001)\nAuth, RBAC, OpenAPI/Swagger, Pino"]
        Express <--> FastAPI["FastAPI AI Engine (:8000)\nAnomaly, XGBoost, RCA Correlator"]
        FastAPI <--> Ollama["Local Ollama Daemon (:11434)\nqwen2.5:1.5b (Zero-Cloud Inference)"]
    end

    subgraph PresentationTier ["Stitch AI Command Center"]
        Express <--> Next["Next.js 14 App Router (:3000)\nDark Command Center UI"]
        Next <--> NOC["Network Operations Engineers & Super Admins"]
    end
```

---

## ⚡ Core Microservice Matrix

| Service | Directory | Tech Stack | Port | Health Check | Primary Function |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Command Center UI** | `frontend/` | Next.js 14, Tailwind, Lucide | `3000` | `http://localhost:3000/dashboard` | Stitch AI Dark Command Center dashboards and actuation controls |
| **API Gateway** | `backend/` | Express, TypeScript, Prisma | `3001` | `http://localhost:3001/health/ready` | Multi-tenant auth, incident lifecycle, Prometheus metrics, usage tracking |
| **AI Inference Hub** | `ai/` | FastAPI, PyTorch, Scikit-learn | `8000` | `http://localhost:8000/docs` | Real-time anomaly detection, XGBoost maintenance predictions, RCA engine |
| **Zero-Cloud LLM** | Host Daemon | Ollama (`qwen2.5:1.5b`) | `11434` | `http://localhost:11434/api/tags` | Air-gapped on-premise Generative Telco Copilot reasoning |
| **Database** | Host Daemon | PostgreSQL 16 | `5432` | `telecom_ai` socket | Row-level sharded relational store for networks, cells, and incidents |
| **Stream Bus** | Host Daemon | Apache Kafka | `9092` | `ran-telemetry` topic | Real-time cell telemetry stream buffer |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0+ or v20.0+
- **Python**: v3.10+
- **PostgreSQL**: v15 or v16
- **Ollama**: Installed with `qwen2.5:1.5b` model pulled:
  ```bash
  ollama pull qwen2.5:1.5b
  ```

---

### 2. Environment Setup

#### Backend Environment Variables
```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/telecom_ai?schema=public"
export JWT_SECRET="telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars"
export PORT="3001"
```

#### AI Service Environment Variables
```bash
export JWT_SECRET="telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars"
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODEL="qwen2.5:1.5b"
export PORT="8000"
```

---

### 3. Running the Platform Services

Launch each service in separate terminal sessions or background jobs:

#### A. Start the FastAPI AI Engine (:8000)
```bash
cd ai
python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8000
```

#### B. Start the Express API Backend (:3001)
```bash
cd backend
npx ts-node src/api/start.ts
```

#### C. Start the Next.js Command Center (:3000)
```bash
cd frontend
npx next dev -p 3000
```

Or using Docker Compose:
```bash
./run.sh
```

---

## 🧭 Monorepo Structure

```
.
├── ai/                      # FastAPI Python AI/ML microservice
│   ├── src/
│   │   ├── api.py           # FastAPI routes & endpoints (/predict, /rca, /anomalies)
│   │   ├── rca.py           # Root cause analysis multimodal correlator
│   │   ├── copilot.py       # Local Ollama client & prompt orchestrator
│   │   └── telemetry.py     # Anomaly detector & timeseries isolation forest
│   └── tests/               # Pytest suite
│
├── backend/                 # Express & TypeScript API Gateway
│   ├── prisma/
│   │   └── schema.prisma    # Multi-tenant PostgreSQL database models & RLS
│   └── src/
│       ├── api/
│       │   ├── server.ts    # Express application, v1Router, RBAC, Prometheus
│       │   └── start.ts     # Process entry point on port 3001
│       ├── kafka/           # Kafka event producers & consumers
│       └── reports/         # Reporting & SLA compliance generator
│
├── frontend/                # Next.js 14 Command Center Web Application
│   └── src/
│       ├── app/
│       │   ├── dashboard/   # All Command Center operations pages
│       │   │   ├── admin/   # Tenant & Platform Super Admin consoles
│       │   │   ├── copilot/ # Zero-cloud Ollama Generative Copilot
│       │   │   └── incidents/ # Incident Command Center & RCA visualizer
│       │   └── api/         # Next.js API gateway proxies
│       └── components/      # UI components & dark Stitch design tokens
│
└── docs/                    # Architecture, Runbooks & Feature Documentation
    ├── FEATURE_AND_WORKING_GUIDE.md  # Complete 15-module operational manual
    ├── architecture.md               # Infrastructure & data-flow architecture
    ├── security-architecture.md      # Zero-cloud data boundary & threat model
    └── operations-runbook.md         # Production incident & maintenance runbook
```

---

## 🌟 Key Features & Capabilities

### 1. Operations & Health
* **Network Overview (`/dashboard`)**: Macro KPI summary, regional cell health heatmaps, and service connectivity sentries.
* **Regions & Sites (`/dashboard/region/[code]`)**: Deep-dive into gNodeB base stations, antenna azimuths, and frequency bands.
* **KPI Explorer (`/dashboard/kpi/all`)**: Time-series analytics for RTT latency, handover success, and call drop rates.
* **Incident Command Center (`/dashboard/incidents`)**: Full incident lifecycle management with integrated **"Declare Incident"** workflow.
* **Root Cause Analysis (`/dashboard/incidents/[id]/rca`)**: Visual 3-hop degradation path, cross-attention evidence chains, alternative hypotheses evaluation, and RLHF engineer verification.

### 2. AI & Autonomous Operations
* **Generative Telco Copilot (`/dashboard/copilot`)**: 100% on-premises conversational assistant powered by local `qwen2.5:1.5b`.
* **AI Telemetry Anomalies (`/dashboard/anomalies`)**: Isolation Forest sentry detecting sub-threshold degradation before service disruption.
* **Predictive Maintenance (`/dashboard/predictive-maintenance`)**: Failure forecast with automated field engineer dispatching.
* **Revenue Leakage (`/dashboard/revenue-leakage`)**: Fraud detection, unmetered session detection, and automatic billing rectification.
* **Customer 360 & Conversation AI (`/dashboard/customers/[id]`, `/dashboard/conversations`)**: Churn prediction, sentiment scoring, and network quality correlation.

### 3. Governance & Administration
* **Reports & Exports (`/dashboard/reports`)**: Regulatory compliance (3GPP / FCC) automated document generation.
* **Developer API (`/dashboard/settings/api`)**: Scoped API key management and live Swagger/OpenAPI documentation.
* **Tenant Administration (`/dashboard/admin/tenant`)**: RBAC member onboarding and AI governance policy switches.
* **Platform Super Admin (`/dashboard/admin/platform`)**: Multi-tenant database partition registry, neural model fleet hot-reload, and immutable governance audit trail.

---

## 🔒 Security & Privacy Guarantees

* **Zero-Cloud Isolation**: All inference runs locally on the host via Ollama. No telemetry, customer identifiers, or proprietary configuration is transmitted over the public internet.
* **Row-Level Security (RLS)**: Every database record is cryptographically indexed to `tenantId`. Cross-tenant querying is prevented at the gateway layer.
* **Immutable Audit Trail**: All privileged administrative operations are permanently logged with actor identities, severity classifications, and client IPs.

---

## 📚 Documentation Reference

For comprehensive deep-dive guides, refer to:
- **[Feature & Working Guide](docs/FEATURE_AND_WORKING_GUIDE.md)**: Exhaustive manual for all 15 platform modules.
- **[Architecture & Data Flow](docs/architecture.md)**: Low-level network topology and protocol specifications.
- **[Operations Runbook](docs/operations-runbook.md)**: NOC deployment, backup, and failover instructions.
- **[Security Architecture](docs/security-architecture.md)**: Zero-cloud boundary verification and encryption standards.
