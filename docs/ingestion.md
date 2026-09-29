# Telecom Data Ingestion Framework

## 1. Provider Abstraction Architecture
To ingest data from a vast array of protocols (REST, SNMP, Syslog, Kafka, Webhooks, CSV, SFTP), we use a strictly modular provider architecture to decouple *how data arrives* from *how data is processed*.

### Flow
`DataSource → Connector → Normalizer → Validator (Zod) → IngestionPipeline → Event DB / Relational DB`

1. **Connector**: E.g., `KafkaConnector`, `SftpConnector`. Its only job is to connect to the source, fetch raw bytes/strings, and emit them to the normalizer.
2. **Normalizer**: Transforms vendor-specific formats (like an Ericsson OSS alarm or Nokia KPI CSV) into a standard JSON payload that matches our system schemas.
3. **Validator**: Strict type-checking using **Zod**. Ensures all required fields (`source`, `sourceEventId`, `eventTime`, `eventType`, `payload`) are present and semantically correct.
4. **IngestionPipeline**: Core engine handling idempotency, storage, and downstream routing.

## 2. Core normalized Schemas
The system defines standard event schemas:
- `NetworkKPI`: Throughput, latency, packet loss, cell utilization.
- `Alarm`: Faults, severity, state (`ACTIVE`/`CLEARED`).
- `CellStatus` / `EquipmentStatus`: Up/Down states.
- `MaintenanceEvent`: Scheduled windows.

## 3. Resilience & Idempotency
- **Deduplication**: Handled at the database level using a composite unique index on `@@unique([tenantId, source, sourceEventId])`. If an event is re-delivered (e.g. at-least-once Kafka semantics), the pipeline safely ignores the duplicate.
- **Dead-Letter Queue (DLQ)**: Any event that fails schema validation (Zod) or downstream processing is automatically sent to the `DeadLetterQueue` table with the `errorReason` for operator review and manual retry.
- **Tenant Isolation**: Every event is strictly partitioned by `tenantId`.

## 4. Ingestion Tracing & Preservation
For auditing and compliance, **no raw data is lost**. The `IngestionEvent` table preserves:
- `source` and `sourceEventId`
- `tenantId`
- `receivedAt` (system time) vs `eventTime` (telecom device time)
- `payload` (JSON)
- `processingStatus` (`PENDING`, `PROCESSED`, `FAILED`)
