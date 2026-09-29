# Telecom AI Platform & Command Center: Feature & Working Guide

> **Architecture Tier:** Enterprise Autonomous Telecom Operations  
> **Privacy Mandate:** 100% Zero-Cloud Local Neural Inference (Air-Gapped Ollama)  
> **Multi-Tenancy:** Row-Level Sharded Isolation (PostgreSQL 16)  
> **Front-End Design System:** Stitch AI Dark Command Center

---

## 1. Executive Summary & System Overview

The **Telecom AI Platform** is an enterprise-grade, autonomous Network Operations Center (NOC) and Customer Operations Command Center. It couples real-time 5G/RAN telemetry ingestion with on-premises Machine Learning and Generative AI, enabling telecom operators to predict hardware degradations, automatically diagnose root causes (RCA), detect revenue leakages, and resolve subscriber issues without sensitive subscriber data ever leaving local infrastructure.

```mermaid
flowchart TB
    subgraph DataPlane ["Edge & Ingestion Tier"]
        gNB["5G gNodeB Cells & PE Routers"] -->|Telemetry & Alarms| Kafka["Kafka Telemetry Stream (:9092)"]
        Kafka --> Ingest["Ingestion Workers & Event Consumers"]
    end

    subgraph StorageTier ["Data Persistence & Isolation"]
        Ingest --> Postgres[("PostgreSQL 16 (:5432)\nMulti-Tenant RLS Shards")]
        Ingest --> Redis[("Redis State & Cache (:6379)")]
    end

    subgraph ServiceTier ["Core Service Layer"]
        Postgres <--> Express["Express API Gateway (:3001)\nAuth, RBAC, Auditing"]
        Express <--> FastAPI["FastAPI AI Engine (:8000)\nAnomaly, RCA, Predictor"]
        FastAPI <--> Ollama["Local Ollama Daemon (:11434)\nqwen2.5:1.5b (Zero-Cloud)"]
    end

    subgraph PresentationTier ["Stitch AI Command Center"]
        Express <--> Next["Next.js 14 App Router (:3000)\nDark Command Center UI"]
        Next <--> OpsEngineer["NOC & SOC Engineers"]
    end
```

---

## 2. Platform Architecture & Service Matrix

The platform is structured into decoupled, resilient microservices communicating over loopback network interfaces:

| Microservice | Technology | Port / Socket | Responsibility | Health Check URL |
| :--- | :--- | :--- | :--- | :--- |
| **Command Center UI** | Next.js 14 (React, Tailwind) | `http://localhost:3000` | Operations dashboards, charts, interactive actuation consoles | `GET /dashboard` |
| **API Gateway** | Express, TypeScript, Prisma | `http://localhost:3001` | Auth, tenant isolation, rate-limiting, Prometheus metrics | `GET /health/ready` |
| **AI Inference Hub** | FastAPI, Python 3.10+, Uvicorn | `http://localhost:8000` | Machine learning models, XGBoost, anomaly detection, RCA | `GET /docs` |
| **Zero-Cloud LLM** | Ollama Daemon | `http://localhost:11434` | Local generative diagnostics, reasoning, customer sentiment | `GET /api/tags` |
| **Database** | PostgreSQL 16 | `127.0.0.1:5432` | Relational data, timeseries metrics, audit logs | `prisma.$queryRaw` |
| **Stream Buffer** | Apache Kafka | `localhost:9092` | Telemetry event topics (`network.incidents`, `ran-telemetry`) | Topic Heartbeat |

---

## 3. Working Guide: Environment Setup & Service Startup

### 3.1 Prerequisites
Ensure the host operating system has the following runtimes installed:
- **Node.js**: v18.0+ or v20.0+
- **Python**: v3.10+ with `pip` and `virtualenv`
- **PostgreSQL**: v15 or v16
- **Ollama**: Installed locally with the `qwen2.5:1.5b` model pulled:
  ```bash
  ollama pull qwen2.5:1.5b
  ```

### 3.2 Environment Variables Configuration

#### Backend Environment (`backend/.env` or shell export)
```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/telecom_ai?schema=public"
export JWT_SECRET="telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars"
export PORT="3001"
export KAFKA_BROKERS="localhost:9092"
```

#### AI Service Environment (`ai/.env` or shell export)
```bash
export JWT_SECRET="telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars"
export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_MODEL="qwen2.5:1.5b"
export PORT="8000"
```

#### Frontend Environment (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_AI_URL="http://localhost:8000"
PORT="3000"
```

---

### 3.3 Startup Sequence Runbook

Launch services in the designated order to preserve inter-service dependency resolution:

#### Step 1: Verify PostgreSQL & Ollama
```bash
# Verify database socket
pg_isready -h 127.0.0.1 -p 5432

# Verify Ollama has the qwen2.5:1.5b model
curl -s http://localhost:11434/api/tags
```

#### Step 2: Start the FastAPI AI Engine
```bash
cd "/windows/Telecom copoilt/ai"
export JWT_SECRET="telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars"
export OLLAMA_MODEL="qwen2.5:1.5b"
export OLLAMA_BASE_URL="http://localhost:11434"
python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8000
```

#### Step 3: Start the Express Backend API Gateway
```bash
cd "/windows/Telecom copoilt/backend"
export JWT_SECRET="telecom-ai-platform-jwt-secret-key-production-2026-minimum-32-chars"
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/telecom_ai?schema=public"
npx ts-node src/api/start.ts
```

#### Step 4: Start the Next.js Frontend Command Center
```bash
cd "/windows/Telecom copoilt/frontend"
npx next dev -p 3000
```

---

## 4. End-to-End Feature Guide & Walkthrough

The Stitch AI interface is divided into three primary operational groups accessible via the global navigation sidebar:

```
├── 1. Operations & Health
│   ├── Network Overview        (/dashboard)
│   ├── Regions & Sites         (/dashboard/region/[code])
│   ├── KPI Explorer            (/dashboard/kpi/all)
│   └── Active Incidents        (/dashboard/incidents)
│       └── Root Cause Analysis (/dashboard/incidents/[id]/rca)
│
├── 2. AI & Automation
│   ├── AI Copilot (Ollama)     (/dashboard/copilot)
│   ├── AI Telemetry Anomalies  (/dashboard/anomalies)
│   ├── Predictive Maintenance  (/dashboard/predictive-maintenance)
│   ├── Revenue Leakage         (/dashboard/revenue-leakage)
│   ├── Conversation AI         (/dashboard/conversations)
│   └── Customer 360            (/dashboard/customers/[id])
│
└── 3. Governance & Settings
    ├── Reports & Exports       (/dashboard/reports)
    ├── Notification Rules      (/dashboard/settings/notifications)
    ├── Developer API           (/dashboard/settings/api)
    ├── Tenant Admin            (/dashboard/admin/tenant)
    └── Platform Admin          (/dashboard/admin/platform)
```

---

### Group 1: Operations & Health

#### 1. Network Overview (`/dashboard`)
* **Purpose:** Executive command console providing high-level situational awareness across all operational regions.
* **Key Features:**
  * **Aggregate Telemetry Strips:** Real-time metrics for Active Connected Cells, Network Availability (99.98%), Average Latency (14.2ms), and Packet Loss.
  * **Live Regional Heatmap:** Interactive status tiles indicating regional health (`NA-EAST`, `NA-WEST`, `EU-WEST`, `APAC-SOUTH`).
  * **System Health Monitor:** Instant connection gauges for Database, Kafka stream queue, and AI microservice.

#### 2. Regions & Sites Explorer (`/dashboard/region/[code]`)
* **Purpose:** Granular deep-dive into macro base stations, microcells, and gNodeB RAN topologies.
* **Key Features:**
  * Interactive site selector and frequency band filter (n77, n78, 28 GHz mmWave).
  * Backhaul link health, optical power margin indicators, and equipment serial registry.
  * Direct deep-link into site-specific historical incident logs.

#### 3. KPI Explorer (`/dashboard/kpi/all`)
* **Purpose:** Multi-dimensional telemetry time-series analytics tool.
* **Key Features:**
  * RTT Latency, Handover Success Rate (HSR), Call Drop Rate (CDR), and CQI distribution.
  * Timeframe selectors (Last 1 Hour, 24 Hours, 7 Days, 30 Days).
  * Anomaly overlay toggles highlighting machine-detected KPI breaches against statistical baselines.

#### 4. Network Incident Command Center (`/dashboard/incidents`)
* **Purpose:** Triage, dispatch, and lifecycle resolution hub for network outages and alarms.
* **Key Features:**
  * **Declare Incident Workflow:** Interactive creation modal connected directly to backend PostgreSQL (`POST /api/v1/incidents`).
  * **MTTR & SLA Sentinels:** Color-coded priority badges (`P1` to `P4`) and SLA breach indicators.
  * **RCA Integration:** Every incident features an **"Inspect RCA"** action routing directly to the root cause engine.

#### 5. Incident Root Cause Analysis (`/dashboard/incidents/[id]/rca`)
* **Purpose:** AI-driven diagnostic engine explaining the underlying fault of any incident.
* **Key Features:**
  * **Signal Path Topology Flow:** Visual 3-hop topology tracer identifying exact fault point (e.g. Core PE Router &rarr; Optical CWDM Backhaul &rarr; gNodeB).
  * **Multi-Modal Evidence Chain:** Correlated evidence cards (KPI spikes, alarms, change history) with cross-attention impact scores.
  * **Counter-Hypothesis Evaluation:** Evaluates alternative causes (e.g., LACP link flap vs. fiber attenuation) with down-ranking justifications.
  * **Interactive Remediation & Actuation:** One-click execution of traffic reroutes, laser optical calibrations, or field team dispatches.
  * **Engineer Sign-Off (RLHF):** "Accept RCA" or "Reject / Adjust" buttons recording human reinforcement to local model weights.

---

### Group 2: AI & Automation

#### 6. AI Copilot (Zero-Cloud Local Ollama) (`/dashboard/copilot`)
* **Purpose:** Natural language conversational assistant for telecom engineering and operations.
* **Key Features:**
  * Runs 100% locally on `qwen2.5:1.5b` over port 11434.
  * Pre-loaded quick prompts: Cell failure diagnostics, 5G NR handoff optimization, BGP routing audits, and customer churn analysis.
  * Streaming token generation, full markdown formatting, and copy-to-clipboard code snippets.

#### 7. AI Telemetry Anomalies (`/dashboard/anomalies`)
* **Purpose:** Real-time unsupervised isolation forest detecting sub-threshold signal degradation.
* **Key Features:**
  * Telemetry anomaly cards with severity score, affected cell identifier, and deviation multiplier.
  * **"Analyze with Copilot"** trigger transferring anomaly telemetry directly into the LLM context.

#### 8. Predictive Maintenance Dispatch (`/dashboard/predictive-maintenance`)
* **Purpose:** XGBoost failure forecasting anticipating power, thermal, and optical degradation before outages occur.
* **Key Features:**
  * Failure probability scores (0% - 100%) and estimated Remaining Useful Life (RUL in days).
  * **"Approve Maintenance Dispatch"** button that schedules field dispatches, books replacement equipment, and sends toast updates.

#### 9. Revenue Leakage Sentry (`/dashboard/revenue-leakage`)
* **Purpose:** Financial assurance sentry detecting unmetered 5G data sessions, tariff misconfigurations, and roam fraud.
* **Key Features:**
  * Total leakage prevented counter ($54,200/mo).
  * Root cause categories: IMSI mismatch, roaming tariff sync drop, QoS tier over-allocation.
  * Instant auto-billing correction trigger.

#### 10. Conversation AI (`/dashboard/conversations`)
* **Purpose:** Real-time customer service call and chat transcript analyzer.
* **Key Features:**
  * Semantic intent recognition (SIM Swap, eSIM provisioning failure, billing dispute, coverage dead-zone).
  * Real-time Sentiment Score (-1.0 to +1.0) and automated escalation triggers to Tier-2 supervisor queues.

#### 11. Customer 360 (`/dashboard/customers/[id]`)
* **Purpose:** Comprehensive subscriber intelligence, churn probability, and network experience index.
* **Key Features:**
  * Net Promoter Score (NPS), Churn Risk Gauge (e.g. 78% High Risk), and ARPU breakdown.
  * Recent RAN Quality Index: Quantifies how many dropped calls and poor CQI intervals the specific subscriber endured.
  * Retention Action Launcher: Offers targeted complimentary 5G speed boost or bill credits.

---

### Group 3: Governance & Administration

#### 12. Reports & Exports (`/dashboard/reports`)
* **Purpose:** Automated regulatory and SLA compliance reporting engine.
* **Key Features:**
  * Pre-configured templates: 3GPP RAN Performance, FCC Outage Compliance, Tenant Resource Utilization.
  * Export formats: PDF executive summaries, CSV raw telemetry, and JSON bundles.

#### 13. Notification & Alerting Rules (`/dashboard/settings/notifications`)
* **Purpose:** Multi-channel alerting dispatcher.
* **Key Features:**
  * Configurable alert policies with threshold criteria (e.g., Packet loss > 5% for > 3 minutes).
  * Webhook integrations: PagerDuty, Slack, ServiceNow ITSM, and SMS emergency gateways.

#### 14. Developer API (`/dashboard/settings/api`)
* **Purpose:** API key lifecycle and programmatic telemetry integration gateway.
* **Key Features:**
  * API Key provisioning with scoped permissions (`read:telemetry`, `write:incidents`, `admin:tenant`).
  * Interactive interactive cURL code snippets and live Swagger documentation links.

#### 15. Tenant Administration (`/dashboard/admin/tenant`)
* **Purpose:** Intra-tenant user management, RBAC, and local policy governance.
* **Key Features:**
  * **Users & Roles Matrix:** Searchable user table with assigned roles (`TENANT_ADMIN`, `NETWORK_ENGINEER`, `DATA_ANALYST`, `CUSTOMER_OPERATIONS`).
  * **Invite Member Modal:** Validated user onboarding modal.
  * **AI Policy Switches:** Zero-cloud enforcement toggles, autonomous actuation guards, and churn intervention switches.

#### 16. Platform Administration (Super Admin) (`/dashboard/admin/platform`)
* **Purpose:** Root-level infrastructure control, multi-tenant partitioning, and global model registry.
* **Key Features:**
  * **Tenant Partitioning Registry:** Displays tenant storage tiers (`ENTERPRISE`, `PROFESSIONAL`), DB isolation mode (`SCHEMA_SHARD` vs `DEDICATED_CLUSTER`), and managed cells.
  * **Provision Tenant Modal:** Super Admin provisioning dialog allocating new database schemas.
  * **Global AI Model Fleet:** Model lifecycle status for `qwen2.5:1.5b`, `XGBoost-RAN-Predictor`, and `Transformer-RCA` with hot-reload triggers.
  * **Infrastructure Heartbeat:** Real-time load meters for CPU (28.4%), RAM (8.2 GB), and Kafka (14,200 msg/s).
  * **Super Admin Audit Trail:** Cryptographic audit log recording all administrative events and IP addresses.

---

## 5. Security & Multi-Tenant Data Isolation

### 5.1 Zero-Cloud Data Boundary Guarantee
The platform guarantees zero outbound data leakage for network telemetry and subscriber details:
1. **Model Execution**: The `qwen2.5:1.5b` LLM runs strictly on the host system via loopback `http://localhost:11434`.
2. **No External SaaS Calls**: No OpenAI, Anthropic, or external cloud LLM APIs are invoked.
3. **Local Vector & Feature Embeddings**: All text embeddings and neural feature vectors are computed locally on CPU/GPU.

### 5.2 Database Row-Level Security (RLS)
Every database model in `backend/prisma/schema.prisma` is bound to a mandatory `tenantId`:
```prisma
model Incident {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  ...
  @@index([tenantId, status])
}
```
All queries initiated through the Express API gateway automatically filter by `req.user.tenantId`, preventing cross-tenant data traversal.

---

## 6. Verification & Troubleshooting Quick Reference

### 6.1 Diagnostic Commands

| Check | Command | Expected Output |
| :--- | :--- | :--- |
| **Verify Frontend** | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard` | `200` |
| **Verify Backend API** | `curl -s http://localhost:3001/health/ready` | `{"status":"READY"}` |
| **Verify AI Engine** | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/docs` | `200` |
| **Verify Local LLM** | `curl -s http://localhost:11434/api/tags` | JSON containing `qwen2.5:1.5b` |
| **Verify Frontend Code** | `cd frontend && npm run lint` | `0 errors` |

### 6.2 Common Issues & Resolutions

* **Issue: "Declare Incident" button does not save incident**
  * *Resolution:* Ensure Express backend is listening on port 3001 and PostgreSQL is up. Test creation via:
    ```bash
    curl -X POST http://localhost:3000/api/incidents \
      -H "Content-Type: application/json" \
      -d '{"title": "Test Ping", "severity": "MAJOR", "priority": "P2", "source": "MANUAL"}'
    ```
* **Issue: Ollama returns connection refused on :11434**
  * *Resolution:* Run `systemctl start ollama` or launch `ollama serve` in a background terminal.
* **Issue: Hydration error in Next.js**
  * *Resolution:* Avoid unhydrated `new Date().toLocaleTimeString()` calls directly inside JSX initial renders; use relative time strings (e.g. "T-4m") or initialize time in a `useEffect` hook.
