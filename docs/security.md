# NEXDESK Security Architecture & Threat Model

This document outlines the security controls, authentication mechanisms, and OWASP-aligned defenses implemented across NEXDESK.

---

## 1. Authentication & Session Management

- **Cryptographic Hashing:** User passwords are encrypted with `bcrypt` (10 salt rounds). Plaintext passwords are never stored, logged, or exposed in API payloads.
- **Stateless Verified Sessions:** Authenticated sessions use signed JSON Web Tokens (JWT) signed via the `jose` library with HS256 and an environment-configured 256-bit secret key (`AUTH_SECRET`).
- **Transport Security:** Tokens are set exclusively in an `HttpOnly` cookie (`nexdesk_session`) with `SameSite=Lax`. In production HTTPS environments, the `Secure` flag is enforced.
- **Client Session Isolation:** JavaScript running in the browser cannot read or exfiltrate the session token via XSS.

---

## 2. Server-Side Role-Based Authorization (RBAC)

Access control is evaluated strictly on the server within each API route handler:
1. **Deny-by-Default:** Unauthenticated requests immediately return HTTP 401 Unauthorized.
2. **Horizontal Privilege Enforcement:** Regular employees can only query or read tickets where `requesterId == session.userId`, and hardware assets where `assignedToUserId == session.userId`. Any request targeting another employee's records returns HTTP 403 Forbidden.
3. **Internal Note Redaction:** Ticket comments flagged as `isInternal = true` are stripped at the database query level when queried by non-IT employees.
4. **Self-Demotion / Privilege Escalation Prevention:** Administrators cannot change their own roles in user management, preventing accidental or malicious privilege locking.

---

## 3. Injection Mitigations

### SQL Injection
All queries utilize Prisma ORM with parameterized queries and prepared statements. No raw, concatenated SQL queries exist.

### CSV Spreadsheet Formula Injection (CSV Injection)
When exporting assets via `/api/assets/export`, cell values are processed through `sanitizeCsvField`. Any string starting with dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) is prepended with a single quote (`'`), neutralizing executable commands in Microsoft Excel and LibreOffice Calc.

### Cross-Site Scripting (XSS)
React automatically escapes values rendered in JSX. Input fields sanitize and validate types through Zod schemas.

---

## 4. Rate Limiting & Denial of Service

Authentication endpoints (`/api/auth/login`) and sensitive mutation routes implement in-memory sliding-window token bucket rate limiters keyed by client IP:
- Login threshold: Max 10 attempts per 15 minutes per IP address. Exceeding requests receive HTTP 429 Too Many Requests.

---

## 5. Security Audit Logging

Security-sensitive events are persisted to the `AuditEvent` database table:
- Authentication outcomes (`AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`).
- Ticket lifecycle milestones (`TICKET_CREATED`, `TICKET_STATUS_CHANGED`, `TICKET_ASSIGNED`).
- Hardware custody changes (`ASSET_ASSIGNMENT_CHANGED`, `ASSET_MAINTENANCE_LOGGED`).
- Inventory exports (`ASSETS_EXPORTED_CSV`).
- Sensitive values (passwords, tokens, cookies) are automatically stripped prior to logging.
