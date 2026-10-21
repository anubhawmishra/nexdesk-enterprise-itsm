import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isAdmin } from "@/lib/auth/rbac";
import { logAuditEvent } from "@/server/services/audit-service";
import { UserRole, UserStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator access required" },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      include: {
        department: true,
        employeeProfile: true,
        _count: { select: { requestedTickets: true, assignedTickets: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { targetUserId, newRole, newStatus } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Security check: cannot change your own role
    if (targetUserId === user.userId && newRole && newRole !== user.role) {
      return NextResponse.json(
        { error: "Administrators cannot modify their own role" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: newRole ? (newRole as UserRole) : undefined,
        status: newStatus ? (newStatus as UserStatus) : undefined,
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    await logAuditEvent({
      actor: user,
      action: "USER_PERMISSIONS_MODIFIED",
      entityType: "User",
      entityId: targetUserId,
      description: `Modified role/status for ${targetUser.email} to Role: ${newRole || targetUser.role}, Status: ${newStatus || targetUser.status}`,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
