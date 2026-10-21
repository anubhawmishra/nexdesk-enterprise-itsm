# NEXDESK Demonstration & Evaluator Guide

This guide provides instructions for evaluating NEXDESK across all four role tiers, running operational workflows, and testing the Windows PowerShell diagnostic tool.

---

## 1. Demo User Accounts

All pre-seeded demo accounts share the local development password: **`NexDesk@2026!`**

| Persona | Name | Email | Role | Recommended Evaluation Scenarios |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Alex Vance | `admin@nexdesk.internal` | `ADMINISTRATOR` | System configuration, SLA thresholds, user permissions, audit logs, CSV exports |
| **IT Manager** | Marcus Chen | `itmanager@nexdesk.internal` | `IT_MANAGER` | SLA escalations, triage queue reassignment, operational reports, audit logs |
| **Support Specialist** | Sarah Jenkins | `agent1@nexdesk.internal` | `IT_SUPPORT_AGENT` | Troubleshooting, internal IT notes, status transitions, resolving incidents |
| **Employee** | Elena Rostova | `employee@nexdesk.internal` | `EMPLOYEE` | Submitting tickets, viewing own assets, reading knowledge base, verifying private tickets |

> **Pro-Tip:** Use the **1-Click Persona Switcher** directly from the Login page or the Top-Bar profile dropdown to test different roles instantly without manual re-typing.

---

## 2. Key Verification Scenarios

### Scenario A: Horizontal Access Segregation
1. Log in as **Elena Rostova** (`employee@nexdesk.internal`).
2. Navigate to `/my-tickets`. Observe that only Elena's tickets appear.
3. Try opening a ticket belonging to another employee (e.g., navigate to ticket `INC-1001` or search for it). Notice access is denied with HTTP 403.
4. Open Elena's own ticket (`INC-1002`). Notice that internal IT notes are invisible to Elena.

### Scenario B: Internal IT Notes & Resolution
1. Switch to **Sarah Jenkins** (`agent1@nexdesk.internal`).
2. Open ticket `INC-1002`.
3. Notice that Sarah sees the yellow **Internal IT Note** posted by Marcus Chen.
4. Post a reply with the checkbox *"Internal Note"* enabled.
5. Click **Resolve Ticket**, fill in resolution findings and root cause, and confirm. Status changes to `RESOLVED` with SLA timestamps recorded.

### Scenario C: IT Asset Custody & CSV Export
1. Navigate to `/assets`.
2. Filter by status *"In Use"* or *"In Storage"*.
3. Click on **AST-1041** (Lenovo ThinkPad X1 Carbon).
4. Review technical specs, warranty expiration, and maintenance log.
5. Click **Export CSV** (as Manager or Admin) and inspect the RFC 4180 output.

### Scenario D: Read-Only Windows Diagnostic Tool
Run the included PowerShell script to test local workstation diagnostics:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\powershell\Get-ITDiagnostics.ps1
```
To generate a JSON diagnostic export:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\powershell\Get-ITDiagnostics.ps1 -ExportJson
```
