import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { maintenanceRecordSchema } from "@/lib/validation/asset.schema";
import { logAuditEvent } from "@/server/services/audit-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const parseResult = maintenanceRecordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { maintenanceType, description, cost, notes } = parseResult.data;

    const asset = await prisma.asset.findFirst({
      where: { OR: [{ id }, { assetTag: id }] },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const maintenance = await prisma.assetMaintenanceRecord.create({
      data: {
        assetId: asset.id,
        maintenanceType,
        description,
        cost,
        performedBy: user.name,
        notes,
      },
    });

    await logAuditEvent({
      actor: user,
      action: "ASSET_MAINTENANCE_LOGGED",
      entityType: "Asset",
      entityId: asset.id,
      description: `Logged ${maintenanceType} maintenance for ${asset.assetTag}`,
    });

    return NextResponse.json({ success: true, maintenance }, { status: 201 });
  } catch (error) {
    console.error("Maintenance error:", error);
    return NextResponse.json({ error: "Failed to record maintenance" }, { status: 500 });
  }
}
