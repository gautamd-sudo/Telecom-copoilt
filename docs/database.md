# Database Architecture & Schema Documentation

## 1. Overview
The Telecom AI Command Center uses **PostgreSQL** as the primary relational database. We utilize **Prisma ORM** for schema modeling, migrations, and type-safe database queries.

## 2. Multi-Tenancy Design
The database implements a "Pool" model for multi-tenancy.
- **Tenant ID**: Every tenant-owned record contains a `tenantId` foreign key referencing the `Tenant` table.
- **Data Isolation**: Application-level isolation is enforced via the `BaseRepository` pattern which automatically injects `tenantId` into `where` clauses of every query.
- **Row-Level Security (RLS)**: For production readiness, PostgreSQL RLS policies can be layered on top of this schema to prevent any cross-tenant leakage at the database connection level.

## 3. Key Entities
### Access Control
- `Tenant`, `TenantSettings`: Core account models.
- `User`, `Role`, `Permission`, `UserRole`: Fine-grained RBAC.

### Network Topology
- `Organization` -> `Network` -> `Region` -> `Site` -> `Cell` / `Equipment`
- Models the physical and logical structure of the telecom network.

### Customer Management
- `Customer` -> `Subscription` -> `Device` / `ServicePlan`

### Operations & Telemetry
- `NetworkMetric`: Time-series structural data (ideal for TimescaleDB hypertables).
- `NetworkEvent`, `Alarm`, `Incident`, `IncidentEvent`, `MaintenanceRecord`: Event tracking.

### AI Intelligence
- `AIAnalysis`, `AIRecommendation`, `Prediction`: Stores model outputs.
- `Model`, `ModelVersion`, `Dataset`, `MLJob`: MLOps tracking.

## 4. Constraints & Integrity
- **Foreign Keys**: Enforced via Prisma relations with `onDelete: Cascade`.
- **Unique Constraints**: Used extensively, such as `@@unique([tenantId, email])` to ensure emails are unique *per tenant*.
- **Indexes**: Explicit `@@index([tenantId])` applied to all tenant tables to optimize filter performance.
- **Soft Deletion**: Applied via `deletedAt` timestamps. Handled automatically in the `BaseRepository`.
