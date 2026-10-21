import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessTicket, isSupportAgent } from "@/lib/auth/rbac";
import { logAuditEvent } from "@/server/services/audit-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketCode: id }],
      },
      include: {
        category: true,
        subcategory: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            department: { select: { name: true } },
            employeeProfile: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        affectedAsset: {
          include: {
            department: true,
          },
        },
        slaTracking: true,
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        assignmentHistory: {
          include: {
            assignedBy: { select: { id: true, name: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
        comments: {
          // If the caller is an employee, filter out internal notes!
          where: isSupportAgent(user) ? undefined : { isInternal: false },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Role-based access control
    if (!canAccessTicket(user, ticket)) {
      await logAuditEvent({
        actor: user,
        action: "UNAUTHORIZED_TICKET_ACCESS_ATTEMPT",
        entityType: "Ticket",
        entityId: id,
        description: `Employee ${user.email} attempted to view ticket ${ticket.ticketCode}`,
      });
      return NextResponse.json({ error: "Access denied: Unauthorized ticket" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Ticket detail error:", error);
    return NextResponse.json({ error: "Failed to retrieve ticket" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportAgent(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only IT personnel can update ticket metadata" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existingTicket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketCode: id }] },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updated = await prisma.ticket.update({
      where: { id: existingTicket.id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        impact: body.impact !== undefined ? body.impact : undefined,
        urgency: body.urgency !== undefined ? body.urgency : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        subcategoryId: body.subcategoryId !== undefined ? body.subcategoryId : undefined,
        affectedAssetId: body.affectedAssetId !== undefined ? body.affectedAssetId : undefined,
      },
      include: {
        category: true,
        requester: { select: { name: true, email: true } },
      },
    });

    await logAuditEvent({
      actor: user,
      action: "TICKET_METADATA_UPDATED",
      entityType: "Ticket",
      entityId: updated.id,
      description: `Updated metadata for ticket ${updated.ticketCode}`,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error("Ticket update error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
