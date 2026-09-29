# Data Flow Architecture

## 1. Telemetry Ingestion Flow
1. Network Probes/Devices push SNMP/Telemetry data to an API Gateway or directly to Kafka topics.
2. Kafka buffers the high-throughput data stream.
3. A Consumer Service (NestJS or Python) processes the stream, applies normalization, and stores metrics into TimescaleDB.
4. Alerts or anomalies are pushed to a Redis pub/sub channel for real-time delivery to active frontend WebSocket clients.

## 2. AI Anomaly Detection Flow
1. FastAPI ML service continuously reads recent time-series windows from TimescaleDB or Kafka.
2. Models (XGBoost/PyTorch) run inference on the window.
3. If an anomaly is detected, an event is published to the `network-alerts` Kafka topic.
4. The Incident Management Service consumes the event, creates a ticket, and triggers notifications (Email/SMS/Webhooks).

## 3. Telecom Copilot (RAG) Flow
1. User types a query in the frontend UI.
2. Request goes to NestJS API -> FastAPI AI Service.
3. AI Service retrieves context using vector search (pgvector) on network documentation, current active alerts, and historical incidents.
4. Augmented prompt is sent to the configured LLM provider.
5. Response is streamed back to the user via Server-Sent Events (SSE) or WebSockets.
