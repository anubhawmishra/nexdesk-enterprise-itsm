# NEXDESK Architecture & System Design

NEXDESK is an enterprise-tier IT Service Desk & Asset Management platform built for mid-sized organizations (~300 employees) with internal IT operations, multi-tier SLAs, hardware custody tracking, and incident escalation.

---

## 1. High-Level Architecture

The system follows a modern Next.js 15 App Router architecture with a clear separation of concerns across presentation, server actions, route handlers, database persistence, and security controls:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│  - Dark Slate Enterprise UI (Tailwind CSS, Lucide, Recharts)│
│  - Reactive Modals, Filters, Keybindings (Ctrl+K Search)    │
│  - HttpOnly Cookie Transport (Credentials: "same-origin")   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/HTTPS (REST JSON)
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js 15 App Router                    │
│  ├── Middleware & Security Headers (CSP, FrameGuard, HSTS)  │
│  ├── API Route Handlers (/api/tickets, /api/assets, etc.)   │
│  │   ├── Rate Limiting (Token Bucket Sliding Window)        │
│  │   ├── Zod Request Validation                             │
│  │   └── RBAC Permission Evaluation (JWT Jose Verification) │
│  └── Services Layer                                         │
│      ├── SLA Calculation Engine                             │
│      ├── Audit Logging Service (Strip Credentials)          │
│      └── In-App Notification Dispatcher                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM (Connection Pool)
┌──────────────────────────────▼──────────────────────────────┐
│                     PostgreSQL Database                     │
│  - Normalized Schema (Users, Tickets, Assets, Audit Events) │
│  - Database Transactions for State Transitions              │
│  - B-tree Indexes on Lookups, Status, and Deadlines         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Responsibilities

- **`src/app/`**: Route segments, page views, and API route handlers.
  - `(auth)/login`: Authentication portal with 1-click persona fast-switchers.
  - `(dashboard)/dashboard`: Primary operational KPI center with Recharts metrics.
  - `tickets/`: Incident queue, filters, and dynamic ticket detail timelines (`/tickets/[id]`).
  - `assets/`: Hardware fleet tracking, warranty health, and CSV export.
  - `employees/`: Corporate directory and equipment custodianship.
  - `knowledge-base/`: Searchable self-service SOP documentation with feedback counters.
  - `sla-escalations/`: Real-time SLA breach countdowns and escalation queue.
  - `reports/`: Incident throughput, MTTR, and agent workload distribution.
  - `audit-logs/`: Immutable security ledger for compliance and forensics.
  - `admin/`: Configuration parameters and user role modification.
  - `privacy/`, `terms/`, `acceptable-use/`, `security/`: Transparency and legal disclosures.
- **`src/components/`**: Reusable atomic UI components (Button, Badge, Card, Modal, Input, Select, Textarea) and shell layout elements (Sidebar, TopBar, GlobalSearchModal, Footer).
- **`src/lib/`**:
  - `auth/`: JWT verification, session cookie encoding, and RBAC authorization predicates.
  - `db/`: Prisma singleton client with hot-reload connection pooling safety.
  - `validation/`: Zod schemas enforcing input boundaries across all mutations.
  - `security/`: RFC 4180 CSV serializer with formula injection sanitization and in-memory rate limiting.
  - `sla/`: Deterministic SLA deadline calculation and time formatting.
- **`src/server/services/`**:
  - `audit-service.ts`: Captures security audit events while redacting sensitive fields.
  - `notification-service.ts`: Routes in-app alerts to ticket requesters and assigned agents.
- **`scripts/powershell/`**:
  - `Get-ITDiagnostics.ps1`: Authorized, read-only Windows hardware/network triage utility.
- **`tests/`**: Unit test suites (SLA engine, CSV injection mitigation, RBAC, Zod schemas), PostgreSQL integration tests, and Playwright end-to-end tests.
