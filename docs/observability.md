# Telecom AI Platform Observability

## 1. Metrics & Monitoring
- **Prometheus** integrations established across both Node.js and Python ecosystems (`/metrics`).
- **Backend Latency:** Histogram for HTTP processing (`http_request_duration_ms`).
- **Database Telemetry:** Global Prisma `$use` middleware dynamically tracks database operations to identify slow queries (`db_query_duration_ms`).
- **AI Telemetry:** Automatically instrumented FastAPI ML pipelines tracking P99 LLM request latency and token sizes via `prometheus-fastapi-instrumentator`.
- **Kafka & Queues:** Emitted metrics to monitor partition consumption and event `kafka_consumer_lag`.

## 2. Distributed Tracing & Correlation
- Injected `x-correlation-id` edge mapping. Every single inbound request is tagged with a UUID.
- **Asynchronous Traceability:** The Event Bus (Kafka) extracts the upstream `correlationId` and passes it through idempotency checks and worker executions, all the way to the Dead Letter Queue (DLQ).

## 3. Structured Logging
- Replaced basic console output with **Pino** (Node.js) and **Loguru** (Python).
- Log output is rendered in highly parsable JSON (Node) and tagged string formats (Python).
- The correlation ID is persistently bound to the async execution context using `asgi_correlation_id` (Python) and custom pino interceptors, ensuring all logs perfectly group together by request lifecycle.

## 4. Health & Resilience
- Established three-tier Kubernetes-ready health checks:
  - `/health/live`: Lightweight ping for container orchestrators.
  - `/health/ready`: Deep dependency checks (verifying live PostgreSQL connections and Kafka hooks).
  - Both endpoints are strictly rate-limited and segregated from the auth gateway.
