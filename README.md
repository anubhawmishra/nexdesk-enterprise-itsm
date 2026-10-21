# NEXDESK — Enterprise IT Service Desk & Asset Management

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?style=flat&logo=vitest)](https://vitest.dev/)

**NEXDESK** is an enterprise-grade, internal IT Service Desk & Asset Management platform built for mid-sized organizations (~300 employees). Designed to reflect modern IT operations (ITIL/ITSM best practices), it features multi-tier SLA monitoring, hardware custody tracking, role-based authorization, security audit logging, an immutable state-machine workflow, and a self-service knowledge base.

> **Full Verification Audit:** For detailed test evidence, OWASP security evaluations, and the verified feature matrix, inspect the [Comprehensive Verification Report](docs/VERIFICATION_REPORT.md).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│  - Dark Navy/Slate Enterprise Interface                     │
│  - Reactive Modals, Quick Filters, Global Ctrl+K Search     │
│  - Recharts Operational Metrics & SLA Countdown Badges      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js 15 App Router                    │
│  ├── Security Headers (CSP, FrameGuard, HSTS, NoSniff)      │
│  ├── Server-Side RBAC (Administrator, Manager, Agent, User) │
│  ├── In-Memory Sliding-Window Rate Limiting (Token Bucket)  │
│  ├── Zod Strict Request Validation & RFC 4180 CSV Escaping  │
│  └── Services Layer (SLA Engine, Audit Ledger, Notifications)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM Connection Pool
┌──────────────────────────────▼──────────────────────────────┐
│                     PostgreSQL Database                     │
│  - 21 Normalized Entities, Foreign Keys, Referential Actions│
│  - B-Tree Indexes on Status, Priority, Deadlines, Custody   │
│  - Multi-Entity Atomic Transactions for State Transitions   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

- **Multi-Role Authorization (RBAC):** Strict server-side enforcement across four tiers: *Employee*, *IT Support Agent*, *IT Manager*, and *Administrator*.
- **Incident & Service Request State Machine:** Linear, audited transitions (`NEW` → `TRIAGED` → `IN_PROGRESS` → `PENDING_USER` → `RESOLVED` → `CLOSED`) with controlled 7-day employee reopening.
- **SLA Countdown & Breach Engine:** Deterministic response and resolution calculations per priority tier (P1 Critical: 15m/2h; P2 High: 1h/8h; P3 Medium: 4h/24h; P4 Low: 8h/48h).
- **Internal IT Notes vs Public Replies:** Support specialists can log confidential technical notes hidden from employees.
- **IT Hardware & Asset Management:** Serialized inventory tracking, hardware specs (CPU, RAM, NVMe), warranty health indicators, maintenance history logs, and RFC 4180 CSV exports with spreadsheet formula injection protection.
- **Corporate Employee Directory:** Departmental staffing, contact info, and current hardware custody.
- **Self-Service Knowledge Base:** Searchable SOP articles with step-by-step checklists, prerequisites, expected results, and helpfulness voting.
- **Security Audit Event Ledger:** Immutable ledger capturing all authentication events, ticket modifications, and permission updates with actor IPs and timestamps.
- **Global Search (`Ctrl+K`):** Real-time multi-entity search across tickets, assets, employees, and articles with role-based access filtering.
- **Windows IT Diagnostic Utility:** Safe, read-only PowerShell diagnostic tool (`Get-ITDiagnostics.ps1`) for authorized desktop troubleshooting.

---

## Technology Stack

- **Framework:** Next.js 15 (App Router, Server-Side Route Handlers, Strict Mode)
- **Language:** TypeScript 5.7 (Strict compiler settings)
- **Database:** PostgreSQL 18 with Prisma ORM 6.19
- **Authentication:** Stateless JWT sessions via `jose` stored in secure `HttpOnly`, `SameSite=Lax` cookies; passwords hashed with `bcryptjs`
- **Styling:** Tailwind CSS 3.4 with dark navy/slate enterprise design system
- **Data Visualization:** Recharts for operational trends and SLA compliance
- **Icons:** Lucide React
- **Validation:** Zod 3.24
- **Testing:** Vitest 3.2 (Unit & Integration tests) + Playwright 1.50 (Browser E2E)
- **Tooling:** Prettier, ESLint, TypeScript compiler

---

## Prerequisites

- **Node.js:** v20.x, v22.x, or v24.x (`node -v`)
- **Package Manager:** npm 10+ or 11+
- **Database:** PostgreSQL 15, 16, 17, or 18 running locally or on a remote server

---

## Installation & Setup

### 1. Clone & Install Dependencies
```bash
cd "c:\Users\Anubhaw Mishra\Downloads\Enterprise IT Service Desk & Incident Management System"
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure `.env` contains your database connection string and secret key:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nexdesk_db?schema=public"
AUTH_SECRET="your-32-character-random-secret-key-goes-here"
SESSION_COOKIE_NAME="nexdesk_session"
NODE_ENV="development"
ENABLE_DEMO_ACCOUNTS="true"
```

### 3. Initialize PostgreSQL Database
Create the database in PostgreSQL if it doesn't already exist, then push the Prisma schema:
```bash
npm run prisma:push
```

### 4. Seed Enterprise Demo Data
Populate the database with realistic organizations, departments, demo users, hardware assets, knowledge articles, and active tickets:
```bash
npm run prisma:seed
```

---

## Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## Demo Accounts & Role Permissions

All pre-seeded demo accounts share the password: **`NexDesk@2026!`**

| Role | Name | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Alex Vance | `admin@nexdesk.internal` | `NexDesk@2026!` | Full platform administration, system settings, SLA policies, user roles, audit logs, CSV exports |
| **IT Manager** | Marcus Chen | `itmanager@nexdesk.internal` | `NexDesk@2026!` | Reassign tickets, view team queues, review SLA performance, operational reports, audit logs |
| **Support Specialist**| Sarah Jenkins | `agent1@nexdesk.internal` | `NexDesk@2026!` | Triage queues, assign tickets, internal technical notes, change status, resolve incidents |
| **Employee** | Elena Rostova | `employee@nexdesk.internal` | `NexDesk@2026!` | Submit tickets, view only own tickets, read knowledge base, view own assigned hardware |

> **Fast Persona Switcher:** The login page and the top-right profile menu feature 1-click persona buttons for rapid evaluation across role boundaries.

---

## Automated Testing

### Run Vitest Test Suite (Unit & Database Integration)
```bash
npm test
```
The test suite includes:
- **`tests/unit/sla-engine.test.ts`**: Verifies SLA deadline calculations (P1–P4), breach detection boundaries, and countdown timers.
- **`tests/unit/csv-export.test.ts`**: Verifies RFC 4180 escaping and spreadsheet formula injection neutralization (`=`, `+`, `-`, `@`).
- **`tests/unit/rbac.test.ts`**: Verifies horizontal isolation (employees cannot access others' tickets) and role permissions.
- **`tests/unit/validation.test.ts`**: Verifies Zod boundary validation and payload rejection.
- **`tests/integration/database.test.ts`**: Verifies transactions, foreign key cascades, and real PostgreSQL database persistence.

### Run TypeScript Typecheck
```bash
npm run typecheck
```

### Run Playwright Browser E2E Tests
```bash
npm run test:e2e
```

---

## Windows IT Diagnostic Utility

A dedicated, safe, read-only diagnostic script is included for Windows desktop support:
`scripts/powershell/Get-ITDiagnostics.ps1`

### Capabilities
- Queries Windows OS caption, build number, and uptime via WMI/CIM.
- Evaluates CPU model, RAM capacity, and BIOS serial number.
- Measures free disk capacity across volumes and flags drives with &lt;15% space.
- Inspects active network adapters, IPv4 gateways, and DNS servers.
- Tests outbound ping connectivity and DNS name resolution.
- Optional JSON or human-readable text report export to the local Desktop.

### Execution Instructions
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\powershell\Get-ITDiagnostics.ps1
```
To export to JSON on your Desktop:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\powershell\Get-ITDiagnostics.ps1 -ExportJson
```

---

## Security Model & Known Limitations

- **Rate Limiting:** In-memory sliding-window token bucket is used for local multi-instance development. For distributed horizontal production deployments, configure a shared Redis store.
- **Independent Testing Notice:** NEXDESK implements OWASP-guided hygiene controls (HttpOnly cookies, CSP headers, formula neutralization, bcrypt hashing, parameterized queries). As an open portfolio application, external penetration testing is recommended prior to commercial deployment.
- **No External Telemetry:** The application does not transmit data or credentials to third-party tracking services.

---

## License

This project is released under the [MIT License](LICENSE).
