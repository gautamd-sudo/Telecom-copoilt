# System Design

## 1. Domain-Driven Design (DDD) Modules
The system is divided into bounded contexts:

- **Identity & Access Management (IAM)**: Users, Roles, Tenants, API Keys.
- **Network Operations (NetOps)**: Device state, network events, alarms, topologies.
- **Customer Experience Management (CEM)**: Customer satisfaction, churn risk, sentiment.
- **AI Intelligence**: Model predictions, LLM orchestrations.

## 2. API Design
- **REST APIs**: For CRUD operations and standard dashboard data fetching. Versioned (e.g., `/api/v1/...`).
- **GraphQL**: Optional for complex data aggregation on the frontend.
- **WebSockets**: WSS connections for real-time KPI updates and network incident alerts.

## 3. LLM Provider Abstraction
The AI services will implement a strategy pattern to abstract the LLM provider:
- `ILLMProvider` interface defining `generateText`, `generateEmbeddings`.
- Implementations: `OpenAIProvider`, `AnthropicProvider`, `GeminiProvider`.
- Controlled via environment variables (e.g., `LLM_PROVIDER=gemini`).

## 4. Multi-Tenant Architecture
- **Data Isolation**: Logical separation using a `tenant_id` column on every tenant-specific database table. Row-Level Security (RLS) in PostgreSQL enforced at the database level to prevent cross-tenant data leakage.
- **Config Isolation**: Each tenant can configure their API integrations, SSO, and alerting rules.
