import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { logAuditEvent } from "@/server/services/audit-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetTag: id }] },
      include: {
        assignedToUser: {
          select: { id: true, name: true, email: true, jobTitle: true, department: true },
        },
        department: true,
        assignmentHistory: {
          include: {
            assignedToUser: { select: { id: true, name: true, email: true } },
            assignedByUser: { select: { id: true, name: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
        maintenanceLogs: {
          orderBy: { performedAt: "desc" },
        },
        tickets: {
          include: {
            requester: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Role check: Employee can only see their own assigned asset
    if (!isSupportAgent(user) && asset.assignedToUserId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Asset detail error:", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportAgent(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetTag: id }] },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: {
        model: body.model,
        manufacturer: body.manufacturer,
        location: body.location,
        lifecycleStatus: body.lifecycleStatus,
        operatingSystem: body.operatingSystem,
        notes: body.notes,
        departmentId: body.departmentId,
      },
    });

    await logAuditEvent({
      actor: user,
      action: "ASSET_UPDATED",
      entityType: "Asset",
      entityId: asset.id,
      description: `Updated asset ${asset.assetTag}`,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error("Asset update error:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}
