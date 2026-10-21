# NEXDESK Incident & Service Request Lifecycle Workflows

This document details the lifecycle progression, SLA deadline monitoring, and escalation procedures implemented in NEXDESK.

---

## 1. Ticket Lifecycle State Machine

```
              ┌─────────┐
              │   NEW   │ (Ticket submitted via portal)
              └────┬────┘
                   │
                   ▼ (Triage & Specialist Assignment)
             ┌───────────┐
             │  TRIAGED  │
             └─────┬─────┘
                   │
                   ▼ (Troubleshooting initiated)
           ┌───────────────┐
      ┌───►│  IN PROGRESS  │◄────────┐
      │    └───────┬───────┘         │
      │            │                 │
(User replies)     ▼ (User info req) │ (Reopened within 7 days)
      │      ┌───────────┐           │
      └──────┤PENDING USR│           │
             └───────────┘           │
                   │                 │
                   ▼ (Fix verified)  │
             ┌───────────┐           │
             │ RESOLVED  ├───────────┤
             └─────┬─────┘           │
                   │                 │
                   ▼ (Closure)       │
             ┌───────────┐           │
             │  CLOSED   ├───────────┘
             └───────────┘
```

### State Definitions
1. **NEW:** Newly submitted ticket awaiting triage. SLA response clock is active.
2. **TRIAGED:** Evaluated by IT management, assigned to category/agent, and prioritized.
3. **IN PROGRESS:** Assigned technician is actively working on diagnosis or remediation.
4. **PENDING USER:** Awaiting employee logs, verification, or hardware return.
5. **RESOLVED:** Fix documented, root cause recorded, and resolution timestamp stamped.
6. **CLOSED:** Final state after user verification or automatic administrative archive.
7. **REOPENED:** Permitted within 7 days for users or anytime for IT staff if the issue recurs.

---

## 2. SLA Priority Matrix

| Priority | First Response Target | Resolution Target | Escalation Target | Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL (P1)** | 15 Minutes | 2 Hours | 60 Minutes | 24/7/365 On-Call |
| **HIGH (P2)** | 60 Minutes | 8 Hours | 4 Hours | Business Hours (8am - 6pm) |
| **MEDIUM (P3)** | 4 Hours | 24 Hours | 12 Hours | Business Hours (8am - 6pm) |
| **LOW (P4)** | 8 Hours | 48 Hours | 24 Hours | Standard Queue |

---

## 3. Reopening Business Rules

- **Employee Requester:** Can reopen a ticket within 7 calendar days of being marked `RESOLVED` or `CLOSED` if symptoms persist.
- **IT Support Personnel:** Can reopen a ticket at any time to document recurring faults or update root cause analysis.
- Every reopen event increments `reopenCount`, clears `resolvedAt`, and transitions the ticket back to `IN_PROGRESS`.
