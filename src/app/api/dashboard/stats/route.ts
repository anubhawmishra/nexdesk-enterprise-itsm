import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { TicketStatus, TicketType } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAgent = isSupportAgent(user);
    const userFilter = !isAgent ? { requesterId: user.userId } : {};

    const [
      totalTickets,
      openIncidents,
      awaitingAssignment,
      breachedCount,
      resolvedTickets,
      priorityCounts,
      statusCounts,
      categoryDistribution,
      assetStats,
      recentUrgentTickets,
    ] = await Promise.all([
      // 1. Total tickets
      prisma.ticket.count({ where: userFilter }),

      // 2. Open incidents (not resolved and not closed)
      prisma.ticket.count({
        where: {
          ...userFilter,
          status: {
            in: [
              TicketStatus.NEW,
              TicketStatus.TRIAGED,
              TicketStatus.IN_PROGRESS,
              TicketStatus.PENDING_USER,
            ],
          },
        },
      }),

      // 3. Awaiting assignment (unassigned and new/triaged)
      prisma.ticket.count({
        where: {
          ...userFilter,
          assignedAgentId: null,
          status: { in: [TicketStatus.NEW, TicketStatus.TRIAGED] },
        },
      }),

      // 4. Overdue / breached incidents
      prisma.ticket.count({
        where: {
          ...userFilter,
          status: {
            in: [
              TicketStatus.NEW,
              TicketStatus.TRIAGED,
              TicketStatus.IN_PROGRESS,
              TicketStatus.PENDING_USER,
            ],
          },
          resolutionDue: { lt: new Date() },
        },
      }),

      // 5. Resolved tickets for SLA compliance calculation
      prisma.ticket.findMany({
        where: {
          ...userFilter,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: {
          resolvedAt: true,
          resolutionDue: true,
          createdAt: true,
        },
      }),

      // 6. Tickets by priority
      prisma.ticket.groupBy({
        by: ["priority"],
        where: userFilter,
        _count: { _all: true },
      }),

      // 7. Tickets by status
      prisma.ticket.groupBy({
        by: ["status"],
        where: userFilter,
        _count: { _all: true },
      }),

      // 8. Category distribution
      prisma.category.findMany({
        select: {
          name: true,
          code: true,
          _count: {
            select: { tickets: { where: userFilter } },
          },
        },
      }),

      // 9. Asset stats (total, in use, in repair, in storage)
      isAgent
        ? prisma.asset.groupBy({
            by: ["lifecycleStatus"],
            _count: { _all: true },
          })
        : [],

      // 10. Urgent queue (open Critical / High priority tickets)
      prisma.ticket.findMany({
        where: {
          ...userFilter,
          status: { in: [TicketStatus.NEW, TicketStatus.TRIAGED, TicketStatus.IN_PROGRESS] },
          priority: { in: ["CRITICAL", "HIGH"] },
        },
        include: {
          category: { select: { name: true } },
          requester: { select: { name: true } },
          assignedAgent: { select: { name: true } },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

    // SLA compliance calculation
    let slaComplianceRate = 100;
    let avgResolutionHours = 0;

    if (resolvedTickets.length > 0) {
      const withinSlaCount = resolvedTickets.filter(
        (t) => t.resolutionDue && t.resolvedAt && t.resolvedAt <= t.resolutionDue,
      ).length;
      slaComplianceRate = Math.round((withinSlaCount / resolvedTickets.length) * 100);

      const totalMinutes = resolvedTickets.reduce((acc, t) => {
        if (!t.resolvedAt) return acc;
        return acc + (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60);
      }, 0);
      avgResolutionHours = Number((totalMinutes / resolvedTickets.length / 60).toFixed(1));
    }

    // Format priority stats
    const priorityMap: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    priorityCounts.forEach((p) => {
      priorityMap[p.priority] = p._count._all;
    });

    // Format status stats
    const statusMap: Record<string, number> = {
      NEW: 0,
      TRIAGED: 0,
      IN_PROGRESS: 0,
      PENDING_USER: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    statusCounts.forEach((s) => {
      statusMap[s.status] = s._count._all;
    });

    // Format category distribution
    const categoriesFormatted = categoryDistribution.map((c) => ({
      name: c.name,
      code: c.code,
      count: c._count.tickets,
    }));

    // Format asset stats
    const assetCounts: Record<string, number> = {
      IN_USE: 0,
      IN_STORAGE: 0,
      IN_REPAIR: 0,
      RETIRED: 0,
      TOTAL: 0,
    };
    if (Array.isArray(assetStats)) {
      assetStats.forEach((a) => {
        assetCounts[a.lifecycleStatus] = a._count._all;
        assetCounts.TOTAL += a._count._all;
      });
    }

    return NextResponse.json({
      metrics: {
        totalTickets,
        openIncidents,
        awaitingAssignment,
        breachedCount,
        slaComplianceRate,
        avgResolutionHours,
      },
      priorityBreakdown: priorityMap,
      statusBreakdown: statusMap,
      categoryDistribution: categoriesFormatted,
      assetStats: assetCounts,
      recentUrgentTickets,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to generate dashboard metrics" }, { status: 500 });
  }
}
