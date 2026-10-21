# NEXDESK Database Design & Entity Relationship

The database schema is defined in `prisma/schema.prisma` and backed by PostgreSQL 18. It is structured into normalized entities with referential integrity, cascading policies, foreign keys, and indexes designed for low-latency operational queries.

---

## 1. Core Entities

### User & Authentication
- **`User`**: Corporate identity record (`id`, `email`, `passwordHash`, `name`, `role`, `status`, `departmentId`).
  - Roles: `EMPLOYEE`, `IT_SUPPORT_AGENT`, `IT_MANAGER`, `ADMINISTRATOR`.
  - Statuses: `ACTIVE`, `INACTIVE`, `SUSPENDED`.
- **`Department`**: Organizational department (`id`, `name`, `code`, `description`).
- **`EmployeeProfile`**: Detailed employee workplace data (`employeeNumber`, `location`, `officeDesk`, `managerName`, `hireDate`).

### Incident & Service Request Management
- **`Ticket`**: Operational issue or service catalog order (`id`, `ticketNumber`, `ticketCode`, `type`, `title`, `description`, `priority`, `impact`, `urgency`, `status`, `requesterId`, `assignedAgentId`, `affectedAssetId`, `firstResponseDue`, `firstResponseAt`, `resolutionDue`, `resolvedAt`, `closedAt`, `reopenedAt`, `reopenCount`, `slaStatus`, `resolutionNotes`, `rootCause`).
- **`Category` & `Subcategory`**: Categorization hierarchy (e.g. Hardware > Laptops, Network > VPN).
- **`TicketComment`**: Chronological conversation history (`id`, `ticketId`, `authorId`, `content`, `isInternal`).
  - Enforces privacy: `isInternal` is true for technical support notes, hidden from non-IT employees.
- **`TicketStatusHistory`**: Immutable log of every status transition (`previousStatus`, `newStatus`, `changedById`, `changeReason`).
- **`AssignmentHistory`**: Assignment and escalation ownership record (`previousAgentId`, `newAgentId`, `assignedById`).

### Service Level Agreements (SLA) & Escalation
- **`SLAPolicy`**: Target configuration per priority tier (`priority`, `responseTimeMinutes`, `resolutionTimeMinutes`, `escalationTimeMinutes`).
- **`SLATracking`**: Per-ticket deadline enforcement (`responseDeadline`, `resolutionDeadline`, `isResponseBreached`, `isResolutionBreached`).
- **`EscalationRecord`**: Management escalation record (`level`, `reason`, `escalatedById`, `escalatedToId`, `status`).

### IT Hardware & Asset Management
- **`Asset`**: Workstation or hardware record (`assetTag`, `serialNumber`, `assetType`, `manufacturer`, `model`, `operatingSystem`, `processor`, `ramGb`, `storageGb`, `purchaseDate`, `warrantyExpiry`, `lifecycleStatus`, `location`, `assignedToUserId`).
  - Unique constraints on `assetTag` and `serialNumber`.
- **`AssetAssignmentHistory`**: Custody change log (`assetId`, `assignedToUserId`, `assignedByUserId`, `assignedAt`, `returnedAt`).
- **`AssetMaintenanceRecord`**: Servicing log (`maintenanceType`, `description`, `cost`, `performedBy`).

### Knowledge Base & Audit
- **`KnowledgeCategory` & `KnowledgeArticle`**: Technical SOPs (`slug`, `title`, `summary`, `content`, `troubleshootingSteps`, `prerequisites`, `expectedResults`, `viewCount`, `helpfulCount`).
- **`Notification`**: In-app notifications with read tracking (`userId`, `title`, `message`, `type`, `linkUrl`, `isRead`).
- **`AuditEvent`**: Security ledger (`actorId`, `actorEmail`, `actorRole`, `action`, `entityType`, `entityId`, `description`, `ipAddress`, `metadataJson`).
- **`ApplicationSettings`**: Global parameters (`organizationName`, `supportEmail`, `defaultTimezone`, `businessHoursStart`, `businessHoursEnd`).

---

## 2. Indexing Strategy

B-Tree indexes are applied on high-cardinality search fields and query filters:
- `Ticket`: `[status]`, `[priority]`, `[type]`, `[requesterId]`, `[assignedAgentId]`, `[ticketCode]`, `[resolutionDue]`.
- `Asset`: `[assetTag]`, `[serialNumber]`, `[assignedToUserId]`, `[lifecycleStatus]`.
- `AuditEvent`: `[actorId]`, `[entityType]`, `[entityId]`, `[createdAt]`.
- `User`: `[role]`, `[status]`, `[email]`.
