import { describe, it, expect } from "vitest";
import {
  calculateSLADeadlines,
  determineSLAStatus,
  formatRemainingTime,
  DEFAULT_SLA_POLICIES,
} from "@/lib/sla/sla-engine";
import { TicketPriority } from "@prisma/client";

describe("SLA Calculation Engine", () => {
  it("calculates exact deadlines for Critical (P1) priority", () => {
    const baseTime = new Date("2026-10-21T10:00:00Z");
    const { firstResponseDue, resolutionDue } = calculateSLADeadlines(
      TicketPriority.CRITICAL,
      baseTime
    );

    // 15 mins response
    expect(firstResponseDue.toISOString()).toBe("2026-10-21T10:15:00.000Z");
    // 120 mins resolution (2h)
    expect(resolutionDue.toISOString()).toBe("2026-10-21T12:00:00.000Z");
  });

  it("calculates exact deadlines for High (P2) priority", () => {
    const baseTime = new Date("2026-10-21T10:00:00Z");
    const { firstResponseDue, resolutionDue } = calculateSLADeadlines(
      TicketPriority.HIGH,
      baseTime
    );

    // 60 mins response (1h)
    expect(firstResponseDue.toISOString()).toBe("2026-10-21T11:00:00.000Z");
    // 480 mins resolution (8h)
    expect(resolutionDue.toISOString()).toBe("2026-10-21T18:00:00.000Z");
  });

  it("calculates exact deadlines for Medium (P3) priority", () => {
    const baseTime = new Date("2026-10-21T10:00:00Z");
    const { firstResponseDue, resolutionDue } = calculateSLADeadlines(
      TicketPriority.MEDIUM,
      baseTime
    );

    // 240 mins (4h)
    expect(firstResponseDue.toISOString()).toBe("2026-10-21T14:00:00.000Z");
    // 1440 mins (24h)
    expect(resolutionDue.toISOString()).toBe("2026-10-22T10:00:00.000Z");
  });

  it("correctly identifies status as WITHIN_SLA when deadline is in the future", () => {
    const now = new Date("2026-10-21T10:00:00Z");
    const deadline = new Date("2026-10-21T12:00:00Z"); // 2 hours away

    const status = determineSLAStatus(deadline, null, now, 30);
    expect(status).toBe("WITHIN_SLA");
  });

  it("correctly identifies status as APPROACHING_BREACH when within warning threshold", () => {
    const now = new Date("2026-10-21T11:45:00Z");
    const deadline = new Date("2026-10-21T12:00:00Z"); // 15 mins away (threshold is 30m)

    const status = determineSLAStatus(deadline, null, now, 30);
    expect(status).toBe("APPROACHING_BREACH");
  });

  it("correctly identifies status as BREACHED when now > resolutionDue", () => {
    const now = new Date("2026-10-21T12:05:00Z");
    const deadline = new Date("2026-10-21T12:00:00Z"); // 5 mins in the past

    const status = determineSLAStatus(deadline, null, now, 30);
    expect(status).toBe("BREACHED");
  });

  it("correctly flags resolved ticket as BREACHED if resolvedAt occurred after deadline", () => {
    const deadline = new Date("2026-10-21T12:00:00Z");
    const resolvedAt = new Date("2026-10-21T12:30:00Z");

    const status = determineSLAStatus(deadline, resolvedAt, new Date());
    expect(status).toBe("BREACHED");
  });

  it("formats remaining countdown time correctly", () => {
    const now = new Date("2026-10-21T10:00:00Z");
    const deadline = new Date("2026-10-21T11:30:00Z"); // 1h 30m

    const formatted = formatRemainingTime(deadline, now);
    expect(formatted.isOverdue).toBe(false);
    expect(formatted.text).toBe("1h 30m left");
  });

  it("formats overdue countdown time correctly", () => {
    const now = new Date("2026-10-21T10:45:00Z");
    const deadline = new Date("2026-10-21T10:00:00Z"); // 45m overdue

    const formatted = formatRemainingTime(deadline, now);
    expect(formatted.isOverdue).toBe(true);
    expect(formatted.text).toBe("45m overdue");
  });
});
