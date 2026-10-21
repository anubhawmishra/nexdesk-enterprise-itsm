import { TicketPriority, SLAStatus } from "@prisma/client";

export interface SLADefinition {
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationTimeMinutes: number;
}

export const DEFAULT_SLA_POLICIES: Record<TicketPriority, SLADefinition> = {
  [TicketPriority.CRITICAL]: {
    responseTimeMinutes: 15,
    resolutionTimeMinutes: 120, // 2h
    escalationTimeMinutes: 60,
  },
  [TicketPriority.HIGH]: {
    responseTimeMinutes: 60, // 1h
    resolutionTimeMinutes: 480, // 8h
    escalationTimeMinutes: 240,
  },
  [TicketPriority.MEDIUM]: {
    responseTimeMinutes: 240, // 4h
    resolutionTimeMinutes: 1440, // 24h
    escalationTimeMinutes: 720,
  },
  [TicketPriority.LOW]: {
    responseTimeMinutes: 480, // 8h
    resolutionTimeMinutes: 2880, // 48h
    escalationTimeMinutes: 1440,
  },
};

export function calculateSLADeadlines(
  priority: TicketPriority,
  createdAt: Date = new Date(),
  customPolicy?: SLADefinition,
): { firstResponseDue: Date; resolutionDue: Date } {
  const policy = customPolicy || DEFAULT_SLA_POLICIES[priority] || DEFAULT_SLA_POLICIES.MEDIUM;

  const firstResponseDue = new Date(createdAt.getTime() + policy.responseTimeMinutes * 60 * 1000);
  const resolutionDue = new Date(createdAt.getTime() + policy.resolutionTimeMinutes * 60 * 1000);

  return { firstResponseDue, resolutionDue };
}

export function determineSLAStatus(
  resolutionDue: Date | null,
  resolvedAt: Date | null,
  now: Date = new Date(),
  warningThresholdMinutes: number = 30,
): SLAStatus {
  if (!resolutionDue) return "WITHIN_SLA";

  // If already resolved, check if resolution was within deadline
  if (resolvedAt) {
    return resolvedAt.getTime() > resolutionDue.getTime() ? "BREACHED" : "WITHIN_SLA";
  }

  // Active ticket checks
  const diffMs = resolutionDue.getTime() - now.getTime();
  if (diffMs < 0) {
    return "BREACHED";
  }

  const warningMs = warningThresholdMinutes * 60 * 1000;
  if (diffMs <= warningMs) {
    return "APPROACHING_BREACH";
  }

  return "WITHIN_SLA";
}

export function formatRemainingTime(
  targetDate: Date | null,
  now: Date = new Date(),
): {
  text: string;
  isOverdue: boolean;
  minutes: number;
} {
  if (!targetDate) {
    return { text: "No SLA target", isOverdue: false, minutes: 0 };
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));

  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;

  let text = "";
  if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${minutes}m`;
  }

  return {
    text: isOverdue ? `${text} overdue` : `${text} left`,
    isOverdue,
    minutes: Math.round(diffMs / (1000 * 60)),
  };
}
