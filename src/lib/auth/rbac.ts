import { UserRole } from "@prisma/client";
import { SessionPayload } from "./jwt";

export function isEmployee(user: SessionPayload): boolean {
  return user.role === UserRole.EMPLOYEE;
}

export function isSupportAgent(user: SessionPayload): boolean {
  return (
    user.role === UserRole.IT_SUPPORT_AGENT ||
    user.role === UserRole.IT_MANAGER ||
    user.role === UserRole.ADMINISTRATOR
  );
}

export function isManager(user: SessionPayload): boolean {
  return user.role === UserRole.IT_MANAGER || user.role === UserRole.ADMINISTRATOR;
}

export function isAdmin(user: SessionPayload): boolean {
  return user.role === UserRole.ADMINISTRATOR;
}

export function canAccessTicket(
  user: SessionPayload,
  ticket: { requesterId: string; assignedAgentId?: string | null },
): boolean {
  if (isSupportAgent(user)) {
    return true;
  }
  // Employee can only access their own requested tickets
  return ticket.requesterId === user.userId;
}

export function canViewInternalNotes(user: SessionPayload): boolean {
  return isSupportAgent(user);
}

export function canManageAssets(user: SessionPayload): boolean {
  return isSupportAgent(user);
}

export function canExportData(user: SessionPayload): boolean {
  return isManager(user);
}

export function canAccessAuditLogs(user: SessionPayload): boolean {
  return isManager(user);
}

export function canAccessAdministration(user: SessionPayload): boolean {
  return isAdmin(user);
}

export function canReopenTicket(
  user: SessionPayload,
  ticket: {
    requesterId: string;
    status: string;
    resolvedAt?: Date | string | null;
    closedAt?: Date | string | null;
  },
): boolean {
  if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    return false;
  }
  // IT personnel can reopen at any time
  if (isSupportAgent(user)) return true;

  // Non-agents can only reopen their own tickets
  if (ticket.requesterId !== user.userId) return false;

  // Enforce 7-day policy: tickets resolved/closed over 7 days ago cannot be reopened by employees
  const terminationDate = ticket.resolvedAt || ticket.closedAt;
  if (!terminationDate) return true;

  const terminationTime = new Date(terminationDate).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - terminationTime <= sevenDaysMs;
}
