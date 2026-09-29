# Security Architecture

## 1. Authentication & Authorization
- **Identity Provider**: Integration with enterprise SSO (SAML 2.0 / OIDC).
- **Tokens**: Short-lived JWTs for API access, securely stored in HTTP-only cookies on the frontend.
- **RBAC**: Fine-grained Role-Based Access Control (Admin, Operator, Analyst, Viewer).

## 2. Data Protection
- **Encryption in Transit**: TLS 1.3 enforced for all external and internal microservice communication.
- **Encryption at Rest**: AES-256 for all databases and object storage.
- **Secrets Management**: No secrets in source code. Environment variables managed via Kubernetes Secrets, HashiCorp Vault, or AWS Secrets Manager.

## 3. Tenant Isolation
- Strict PostgreSQL Row-Level Security (RLS).
- Dedicated Kafka topics or structured topic partitions per tenant where applicable, ensuring cross-tenant data boundaries.

## 4. Audit & Observability
- **Audit Logging**: Every write action is logged with `user_id`, `tenant_id`, timestamp, and before/after state.
- **WAF**: Web Application Firewall to block common vulnerabilities (SQLi, XSS).
- **Rate Limiting**: Applied per IP and per tenant to prevent abuse.
