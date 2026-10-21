import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createTicketSchema } from "@/lib/validation/ticket.schema";
import { isSupportAgent } from "@/lib/auth/rbac";
import { calculateSLADeadlines } from "@/lib/sla/sla-engine";
import { logAuditEvent } from "@/server/services/audit-service";
import { createNotification } from "@/server/services/notification-service";
import { TicketPriority, TicketType, TicketStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search")?.trim();
    const scope = searchParams.get("scope"); // "my" | "assigned" | "all"

    const where: any = {};

    // Enforcement: Employees can only view tickets where they are the requester
    if (!isSupportAgent(user) || scope === "my") {
      where.requesterId = user.userId;
    } else if (scope === "assigned") {
      where.assignedAgentId = user.userId;
    }

    if (status && status !== "ALL") {
      where.status = status as TicketStatus;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority as TicketPriority;
    }

    if (type && type !== "ALL") {
      where.type = type as TicketType;
    }

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { ticketCode: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { requester: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          subcategory: { select: { id: true, name: true, code: true } },
          requester: { select: { id: true, name: true, email: true } },
          assignedAgent: { select: { id: true, name: true, email: true } },
          affectedAsset: { select: { id: true, assetTag: true, model: true, manufacturer: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Tickets GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = createTicketSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    // Generate unique sequential ticket code
    const prefix = data.type === TicketType.INCIDENT ? "INC" : "REQ";
    const lastTicket = await prisma.ticket.findFirst({
      where: { ticketCode: { startsWith: `${prefix}-` } },
      orderBy: { createdAt: "desc" },
      select: { ticketCode: true },
    });

    let nextNum = 1001;
    if (lastTicket?.ticketCode) {
      const parts = lastTicket.ticketCode.split("-");
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed)) {
        nextNum = Math.max(nextNum, parsed + 1);
      }
    }
    const ticketCode = `${prefix}-${nextNum}`;

    // SLA Deadlines
    const { firstResponseDue, resolutionDue } = calculateSLADeadlines(data.priority);

    // Multi-step database transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketCode,
          type: data.type,
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || null,
          priority: data.priority,
          impact: data.impact,
          urgency: data.urgency,
          status: TicketStatus.NEW,
          requesterId: user.userId,
          affectedAssetId: data.affectedAssetId || null,
          firstResponseDue,
          resolutionDue,
          slaStatus: "WITHIN_SLA",
        },
        include: {
          category: true,
          requester: { select: { id: true, name: true, email: true } },
        },
      });

      // Status history entry
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          previousStatus: TicketStatus.NEW,
          newStatus: TicketStatus.NEW,
          changedById: user.userId,
          changeReason: "Ticket submitted via NexDesk portal.",
        },
      });

      // SLA Tracking entry
      await tx.sLATracking.create({
        data: {
          ticketId: ticket.id,
          responseDeadline: firstResponseDue,
          resolutionDeadline: resolutionDue,
        },
      });

      return ticket;
    });

    // Audit event
    await logAuditEvent({
      actor: user,
      action: "TICKET_CREATED",
      entityType: "Ticket",
      entityId: newTicket.id,
      description: `Created ${newTicket.type} ${newTicket.ticketCode}: ${newTicket.title}`,
      metadata: {
        ticketCode: newTicket.ticketCode,
        priority: newTicket.priority,
        type: newTicket.type,
      },
    });

    // Notify IT Managers / Agents
    const agents = await prisma.user.findMany({
      where: { role: { in: ["IT_SUPPORT_AGENT", "IT_MANAGER"] }, status: "ACTIVE" },
      select: { id: true },
      take: 5,
    });

    for (const agent of agents) {
      await createNotification({
        userId: agent.id,
        title: `New ${newTicket.type}: ${newTicket.ticketCode}`,
        message: `${user.name} submitted: "${newTicket.title}" (${newTicket.priority})`,
        type: "TICKET_CREATED",
        linkUrl: `/tickets/${newTicket.id}`,
      });
    }

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (error) {
    console.error("Tickets POST error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
