import { describe, it, expect } from "vitest";
import {
  canAccessTicket,
  canViewInternalNotes,
  canExportData,
  canAccessAuditLogs,
  canAccessAdministration,
  canReopenTicket,
} from "@/lib/auth/rbac";
import { UserRole } from "@prisma/client";

describe("Role-Based Access Control (RBAC) Policies", () => {
  const employeeSession = {
    userId: "user-emp-1",
    email: "emp1@example.com",
    name: "Employee 1",
    role: UserRole.EMPLOYEE,
  };

  const agentSession = {
    userId: "user-agent-1",
    email: "agent@example.com",
    name: "Support Agent",
    role: UserRole.IT_SUPPORT_AGENT,
  };

  const managerSession = {
    userId: "user-mgr-1",
    email: "mgr@example.com",
    name: "IT Manager",
    role: UserRole.IT_MANAGER,
  };

  const adminSession = {
    userId: "user-admin-1",
    email: "admin@example.com",
    name: "Administrator",
    role: UserRole.ADMINISTRATOR,
  };

  it("permits employee to access only their own requested tickets", () => {
    const ownTicket = { requesterId: "user-emp-1" };
    const foreignTicket = { requesterId: "user-emp-2" };

    expect(canAccessTicket(employeeSession, ownTicket)).toBe(true);
    expect(canAccessTicket(employeeSession, foreignTicket)).toBe(false);
  });

  it("permits support staff, managers, and admins to access all tickets", () => {
    const foreignTicket = { requesterId: "user-emp-2" };

    expect(canAccessTicket(agentSession, foreignTicket)).toBe(true);
    expect(canAccessTicket(managerSession, foreignTicket)).toBe(true);
    expect(canAccessTicket(adminSession, foreignTicket)).toBe(true);
  });

  it("hides internal notes from regular employees", () => {
    expect(canViewInternalNotes(employeeSession)).toBe(false);
    expect(canViewInternalNotes(agentSession)).toBe(true);
    expect(canViewInternalNotes(managerSession)).toBe(true);
    expect(canViewInternalNotes(adminSession)).toBe(true);
  });

  it("restricts CSV data export to managers and administrators", () => {
    expect(canExportData(employeeSession)).toBe(false);
    expect(canExportData(agentSession)).toBe(false);
    expect(canExportData(managerSession)).toBe(true);
    expect(canExportData(adminSession)).toBe(true);
  });

  it("restricts security audit log access to managers and administrators", () => {
    expect(canAccessAuditLogs(employeeSession)).toBe(false);
    expect(canAccessAuditLogs(agentSession)).toBe(false);
    expect(canAccessAuditLogs(managerSession)).toBe(true);
    expect(canAccessAuditLogs(adminSession)).toBe(true);
  });

  it("restricts administration settings strictly to administrators", () => {
    expect(canAccessAdministration(employeeSession)).toBe(false);
    expect(canAccessAdministration(agentSession)).toBe(false);
    expect(canAccessAdministration(managerSession)).toBe(false);
    expect(canAccessAdministration(adminSession)).toBe(true);
  });

  it("allows employee to reopen their own resolved ticket within 7 days", () => {
    const now = Date.now();
    const ownResolvedRecently = {
      requesterId: "user-emp-1",
      status: "RESOLVED",
      resolvedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    };
    const ownNew = { requesterId: "user-emp-1", status: "NEW" };
    const foreignResolved = { requesterId: "user-emp-2", status: "RESOLVED" };

    expect(canReopenTicket(employeeSession, ownResolvedRecently)).toBe(true);
    expect(canReopenTicket(employeeSession, ownNew)).toBe(false);
    expect(canReopenTicket(employeeSession, foreignResolved)).toBe(false);
  });

  it("enforces 7-day policy: prevents employee from reopening ticket resolved >7 days ago, but allows IT agent", () => {
    const now = Date.now();
    const ownResolvedOld = {
      requesterId: "user-emp-1",
      status: "RESOLVED",
      resolvedAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
    };

    // Employee is denied reopening after 7 days
    expect(canReopenTicket(employeeSession, ownResolvedOld)).toBe(false);

    // IT Agent can reopen even after 7 days
    expect(canReopenTicket(agentSession, ownResolvedOld)).toBe(true);
  });
});
