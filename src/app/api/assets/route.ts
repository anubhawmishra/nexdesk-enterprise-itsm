import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { createAssetSchema } from "@/lib/validation/asset.schema";
import { logAuditEvent } from "@/server/services/audit-service";
import { AssetLifecycleStatus, AssetType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // If regular employee, only show assets assigned to them
    if (!isSupportAgent(user)) {
      where.assignedToUserId = user.userId;
    }

    if (type && type !== "ALL") {
      where.assetType = type as AssetType;
    }

    if (status && status !== "ALL") {
      where.lifecycleStatus = status as AssetLifecycleStatus;
    }

    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
        { assignedToUser: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [assets, totalCount] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true, code: true } },
          _count: { select: { tickets: true, maintenanceLogs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Assets GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportAgent(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only IT personnel can register new assets" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parseResult = createAssetSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    // Check duplicate serial number or asset tag
    const duplicate = await prisma.asset.findFirst({
      where: {
        OR: [{ assetTag: data.assetTag }, { serialNumber: data.serialNumber }],
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: `Asset with tag ${data.assetTag} or serial number ${data.serialNumber} already exists`,
        },
        { status: 409 },
      );
    }

    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({
        data: {
          assetTag: data.assetTag,
          serialNumber: data.serialNumber,
          assetType: data.assetType,
          manufacturer: data.manufacturer,
          model: data.model,
          operatingSystem: data.operatingSystem,
          processor: data.processor,
          ramGb: data.ramGb,
          storageGb: data.storageGb,
          purchaseDate: data.purchaseDate,
          warrantyExpiry: data.warrantyExpiry,
          lifecycleStatus: data.lifecycleStatus,
          location: data.location,
          purchaseCost: data.purchaseCost,
          assignedToUserId: data.assignedToUserId,
          departmentId: data.departmentId,
          notes: data.notes,
        },
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
          department: true,
        },
      });

      if (data.assignedToUserId) {
        await tx.assetAssignmentHistory.create({
          data: {
            assetId: created.id,
            assignedToUserId: data.assignedToUserId,
            assignedByUserId: user.userId,
            notes: "Initial registration assignment",
          },
        });
      }

      return created;
    });

    await logAuditEvent({
      actor: user,
      action: "ASSET_CREATED",
      entityType: "Asset",
      entityId: asset.id,
      description: `Registered asset ${asset.assetTag} (${asset.manufacturer} ${asset.model})`,
    });

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (error) {
    console.error("Asset POST error:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
