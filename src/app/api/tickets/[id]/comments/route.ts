import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessTicket, isSupportAgent } from "@/lib/auth/rbac";
import { createCommentSchema } from "@/lib/validation/ticket.schema";
import { logAuditEvent } from "@/server/services/audit-service";
import { createNotification } from "@/server/services/notification-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = createCommentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { content, isInternal } = parseResult.data;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketCode: id }] },
      include: {
        requester: { select: { id: true, email: true, name: true } },
        assignedAgent: { select: { id: true, email: true, name: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!canAccessTicket(user, ticket)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only agents can make internal notes
    let sanitizedIsInternal = isInternal;
    if (!isSupportAgent(user)) {
      sanitizedIsInternal = false;
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: user.userId,
          content,
          isInternal: sanitizedIsInternal,
        },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });

      // If an agent responds for the first time on a ticket that has no firstResponseAt, record it
      if (isSupportAgent(user) && !ticket.firstResponseAt && user.userId !== ticket.requesterId) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { firstResponseAt: new Date() },
        });
      }

      return newComment;
    });

    // Notifications
    if (sanitizedIsInternal) {
      // Internal note: if agent, notify manager or assigned agent
      if (ticket.assignedAgentId && ticket.assignedAgentId !== user.userId) {
        await createNotification({
          userId: ticket.assignedAgentId,
          title: `Internal Note on ${ticket.ticketCode}`,
          message: `${user.name} added an internal note to "${ticket.title}"`,
          type: "COMMENT_ADDED",
          linkUrl: `/tickets/${ticket.id}`,
        });
      }
    } else {
      // Public reply
      if (user.userId === ticket.requesterId) {
        // Employee responded, notify assigned agent
        if (ticket.assignedAgentId) {
          await createNotification({
            userId: ticket.assignedAgentId,
            title: `Reply on ${ticket.ticketCode}`,
            message: `${user.name} replied on "${ticket.title}"`,
            type: "COMMENT_ADDED",
            linkUrl: `/tickets/${ticket.id}`,
          });
        }
      } else {
        // Agent responded, notify requester
        await createNotification({
          userId: ticket.requesterId,
          title: `Update on your ticket ${ticket.ticketCode}`,
          message: `${user.name} posted an update on "${ticket.title}"`,
          type: "COMMENT_ADDED",
          linkUrl: `/tickets/${ticket.id}`,
        });
      }
    }

    await logAuditEvent({
      actor: user,
      action: sanitizedIsInternal ? "INTERNAL_NOTE_ADDED" : "TICKET_COMMENT_ADDED",
      entityType: "Ticket",
      entityId: ticket.id,
      description: `${sanitizedIsInternal ? "Internal note" : "Public comment"} added to ${ticket.ticketCode}`,
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
