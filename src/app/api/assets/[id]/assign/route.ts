import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { assignAssetSchema } from "@/lib/validation/asset.schema";
import { logAuditEvent } from "@/server/services/audit-service";
import { AssetLifecycleStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportAgent(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only IT personnel can reassign assets" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = assignAssetSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { assignedToUserId, notes } = parseResult.data;

    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetTag: id }] },
      include: { assignedToUser: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    let targetUser = null;
    if (assignedToUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: assignedToUserId },
        select: { id: true, name: true, email: true },
      });
      if (!targetUser) {
        return NextResponse.json({ error: "Selected user not found" }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If asset was previously assigned to someone, mark returnedAt in history
      if (asset.assignedToUserId) {
        const lastAssignment = await tx.assetAssignmentHistory.findFirst({
          where: { assetId: asset.id, returnedAt: null },
          orderBy: { assignedAt: "desc" },
        });

        if (lastAssignment) {
          await tx.assetAssignmentHistory.update({
            where: { id: lastAssignment.id },
            data: { returnedAt: new Date() },
          });
        }
      }

      // New status: IN_USE if assigned, IN_STORAGE if unassigned
      const newStatus = assignedToUserId
        ? AssetLifecycleStatus.IN_USE
        : AssetLifecycleStatus.IN_STORAGE;

      const updatedAsset = await tx.asset.update({
        where: { id: asset.id },
        data: {
          assignedToUserId,
          lifecycleStatus: newStatus,
        },
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
        },
      });

      // If new user assigned, log new assignment history
      if (assignedToUserId) {
        await tx.assetAssignmentHistory.create({
          data: {
            assetId: asset.id,
            assignedToUserId,
            assignedByUserId: user.userId,
            notes: notes || `Assigned to ${targetUser?.name}`,
          },
        });
      }

      return updatedAsset;
    });

    await logAuditEvent({
      actor: user,
      action: "ASSET_ASSIGNMENT_CHANGED",
      entityType: "Asset",
      entityId: asset.id,
      description: assignedToUserId
        ? `Assigned ${asset.assetTag} to ${targetUser?.name}`
        : `Unassigned ${asset.assetTag} (returned to inventory)`,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error("Asset assignment error:", error);
    return NextResponse.json({ error: "Failed to update asset assignment" }, { status: 500 });
  }
}
