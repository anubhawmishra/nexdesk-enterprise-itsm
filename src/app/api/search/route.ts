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
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        tickets: [],
        assets: [],
        knowledge: [],
        employees: [],
      });
    }

    const isAgent = isSupportAgent(user);

    // 1. Tickets Search with RBAC
    const ticketWhere: any = {
      OR: [
        { ticketCode: { contains: query, mode: "insensitive" } },
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };
    if (!isAgent) {
      ticketWhere.requesterId = user.userId;
    }

    // 2. Assets Search with RBAC
    const assetWhere: any = {
      OR: [
        { assetTag: { contains: query, mode: "insensitive" } },
        { serialNumber: { contains: query, mode: "insensitive" } },
        { model: { contains: query, mode: "insensitive" } },
        { manufacturer: { contains: query, mode: "insensitive" } },
      ],
    };
    if (!isAgent) {
      assetWhere.assignedToUserId = user.userId;
    }

    // 3. Knowledge Base Search
    const kbWhere: any = {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
        { tags: { contains: query, mode: "insensitive" } },
      ],
    };
    if (!isAgent) {
      kbWhere.status = "PUBLISHED";
    }

    // 4. Employees Search
    const employeeWhere: any = {
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { jobTitle: { contains: query, mode: "insensitive" } },
      ],
    };

    const [tickets, assets, knowledge, employees] = await Promise.all([
      prisma.ticket.findMany({
        where: ticketWhere,
        select: {
          id: true,
          ticketCode: true,
          title: true,
          status: true,
          priority: true,
          type: true,
        },
        take: 6,
      }),
      prisma.asset.findMany({
        where: assetWhere,
        select: {
          id: true,
          assetTag: true,
          model: true,
          manufacturer: true,
          lifecycleStatus: true,
          assetType: true,
        },
        take: 6,
      }),
      prisma.knowledgeArticle.findMany({
        where: kbWhere,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          category: { select: { name: true } },
        },
        take: 6,
      }),
      prisma.user.findMany({
        where: employeeWhere,
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          department: { select: { name: true } },
        },
        take: 6,
      }),
    ]);

    return NextResponse.json({
      tickets,
      assets,
      knowledge,
      employees,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Failed to execute search" }, { status: 500 });
  }
}
