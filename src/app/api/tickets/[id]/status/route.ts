import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent, canReopenTicket } from "@/lib/auth/rbac";
import { updateTicketStatusSchema } from "@/lib/validation/ticket.schema";
import { logAuditEvent } from "@/server/services/audit-service";
import { createNotification } from "@/server/services/notification-service";
import { TicketStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = updateTicketStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { status: targetStatus, changeReason, resolutionNotes, rootCause } = parseResult.data;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketCode: id }] },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const currentStatus = ticket.status;

    // Permissions check
    const isAgent = isSupportAgent(user);
    const isReopen =
      (currentStatus === TicketStatus.RESOLVED || currentStatus === TicketStatus.CLOSED) &&
      (targetStatus === TicketStatus.IN_PROGRESS || targetStatus === TicketStatus.NEW);

    if (!isAgent) {
      // Non-agents can only reopen their own closed/resolved tickets
      if (!isReopen || !canReopenTicket(user, ticket)) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to perform this status transition" },
          { status: 403 },
        );
      }
    }

    const now = new Date();
    const updateData: any = {
      status: targetStatus,
    };

    if (targetStatus === TicketStatus.RESOLVED) {
      updateData.resolvedAt = now;
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      if (rootCause) updateData.rootCause = rootCause;

      // Check SLA compliance
      if (ticket.resolutionDue && now > ticket.resolutionDue) {
        updateData.slaStatus = "BREACHED";
      } else {
        updateData.slaStatus = "WITHIN_SLA";
      }
    } else if (targetStatus === TicketStatus.CLOSED) {
      updateData.closedAt = now;
    } else if (isReopen) {
      updateData.reopenedAt = now;
      updateData.reopenCount = { increment: 1 };
      updateData.resolvedAt = null;
      updateData.closedAt = null;
    }

    // Execute in transaction: update ticket + create status history record
    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: updateData,
        include: {
          category: true,
          requester: { select: { id: true, name: true, email: true } },
          assignedAgent: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          previousStatus: currentStatus,
          newStatus: targetStatus,
          changedById: user.userId,
          changeReason: changeReason || `Status changed from ${currentStatus} to ${targetStatus}`,
        },
      });

      return updated;
    });

    // Send notifications
    if (user.userId !== ticket.requesterId) {
      await createNotification({
        userId: ticket.requesterId,
        title: `Ticket ${ticket.ticketCode} is now ${targetStatus}`,
        message: `Your ticket "${ticket.title}" status was updated to ${targetStatus}.`,
        type: "STATUS_CHANGED",
        linkUrl: `/tickets/${ticket.id}`,
      });
    }

    if (ticket.assignedAgentId && user.userId !== ticket.assignedAgentId) {
      await createNotification({
        userId: ticket.assignedAgentId,
        title: `Ticket ${ticket.ticketCode} status updated`,
        message: `${user.name} changed status to ${targetStatus}.`,
        type: "STATUS_CHANGED",
        linkUrl: `/tickets/${ticket.id}`,
      });
    }

    await logAuditEvent({
      actor: user,
      action: "TICKET_STATUS_CHANGED",
      entityType: "Ticket",
      entityId: ticket.id,
      description: `Status changed from ${currentStatus} to ${targetStatus} on ${ticket.ticketCode}`,
      metadata: {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        changeReason,
      },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error("Status transition error:", error);
    return NextResponse.json({ error: "Failed to update ticket status" }, { status: 500 });
  }
}
