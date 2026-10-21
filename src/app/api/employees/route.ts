import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const departmentId = searchParams.get("departmentId");

    const where: any = {
      status: "ACTIVE",
    };

    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        department: { select: { id: true, name: true, code: true } },
        employeeProfile: true,
        assignedAssets: {
          select: {
            id: true,
            assetTag: true,
            assetType: true,
            model: true,
            manufacturer: true,
          },
        },
        _count: {
          select: {
            requestedTickets: true,
            assignedTickets: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
