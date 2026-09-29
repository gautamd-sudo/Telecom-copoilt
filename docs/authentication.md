# Authentication & Authorization Architecture

## 1. Authentication Layer

The authentication layer is designed to support both local credentials and enterprise Identity Providers (IdP).

### 1.1 Local Authentication
- **Mechanism**: Email/Password.
- **Security**: Passwords are mathematically hashed using `bcrypt` (10 rounds).
- **Protection**: Brute force protection is natively built into the `AuthService`. After 5 consecutive failed attempts, the account is temporarily locked.
- **Session Management**: Successful logins issue an `accessToken` (JWT, short-lived 15m) and a `refreshToken` (Opaque crypto-string stored in the database, long-lived 7d).

### 1.2 Enterprise SSO Architecture
To support Google OAuth, Microsoft OAuth, SAML, and OIDC, we will implement Passport.js within NestJS, alongside an `IdentityProvider` table in the database.

- **IdP Table**: A tenant can configure multiple IdPs (e.g., Azure AD).
- **Just-In-Time Provisioning**: When a user logs in via SAML/OIDC, the backend intercepts the assertion, verifies the signature against the Tenant's configured IdP certificates, and dynamically creates or links the local `User` record.
- **Token Exchange**: The frontend never receives raw SAML assertions. The backend exchanges the SSO assertion for the standard `accessToken` and `refreshToken` used locally.

## 2. Authorization Layer (RBAC)

Authorization is **strictly authoritative on the backend**. The frontend uses permissions only to toggle UI visibility (UX). Every sensitive endpoint invokes the `AuthzGuard`.

### 2.1 Roles & Permissions
Roles aggregate granular permissions. A user is assigned a role via `UserRole`.
- **Platform Super Admin**: Wildcard `*` permissions.
- **Tenant Admin**: `tenant.manage`, `users.manage`, `integrations.manage`.
- **Network Administrator**: `network.read`, `network.write`.
- **Viewer**: `network.read`, `reports.read`, `ai.read`.

### 2.2 AuthzGuard Execution
1. Decodes JWT to extract `userId` and `tenantId`.
2. Fetches User and their associated Roles and Permissions from the database.
3. Checks if the User's permissions set includes all `requiredPermissions` for the endpoint.
4. Denies access and creates an `AUTHZ_DENIED` audit log if lacking.

## 3. Audit & Observability
Every authentication and authorization event is recorded in the `AuditLog` table, including IP addresses, timestamps, and specific failures (e.g., missing specific permission keys), guaranteeing SOC2 compliance.
