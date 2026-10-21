import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { assignTicketSchema } from "@/lib/validation/ticket.schema";
import { logAuditEvent } from "@/server/services/audit-service";
import { createNotification } from "@/server/services/notification-service";
import { TicketStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportAgent(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only IT personnel can assign tickets" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = assignTicketSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { agentId } = parseResult.data;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketCode: id }] },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    let targetAgent = null;
    if (agentId) {
      targetAgent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (
        !targetAgent ||
        (targetAgent.role !== "IT_SUPPORT_AGENT" &&
          targetAgent.role !== "IT_MANAGER" &&
          targetAgent.role !== "ADMINISTRATOR")
      ) {
        return NextResponse.json(
          { error: "Invalid agent selected for assignment" },
          { status: 400 },
        );
      }
    }

    const previousAgentId = ticket.assignedAgentId;

    // Transaction to update ticket + assignment history
    const updated = await prisma.$transaction(async (tx) => {
      // Auto move from NEW to TRIAGED on assignment
      const newStatus = ticket.status === TicketStatus.NEW ? TicketStatus.TRIAGED : ticket.status;

      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          assignedAgentId: agentId,
          status: newStatus,
        },
        include: {
          assignedAgent: { select: { id: true, name: true, email: true } },
          requester: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.assignmentHistory.create({
        data: {
          ticketId: ticket.id,
          previousAgentId,
          newAgentId: agentId,
          assignedById: user.userId,
        },
      });

      if (newStatus !== ticket.status) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            previousStatus: ticket.status,
            newStatus,
            changedById: user.userId,
            changeReason: `Assigned to ${targetAgent ? targetAgent.name : "Unassigned"}`,
          },
        });
      }

      return updatedTicket;
    });

    // Notify new agent
    if (agentId && agentId !== user.userId) {
      await createNotification({
        userId: agentId,
        title: `Ticket Assigned: ${ticket.ticketCode}`,
        message: `${user.name} assigned ticket "${ticket.title}" to you.`,
        type: "TICKET_ASSIGNED",
        linkUrl: `/tickets/${ticket.id}`,
      });
    }

    await logAuditEvent({
      actor: user,
      action: "TICKET_ASSIGNED",
      entityType: "Ticket",
      entityId: ticket.id,
      description: `Assigned ${ticket.ticketCode} to ${targetAgent ? targetAgent.name : "Unassigned"}`,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 });
  }
}
