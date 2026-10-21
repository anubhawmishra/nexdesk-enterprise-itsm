import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { createKnowledgeArticleSchema } from "@/lib/validation/kb.schema";
import { logAuditEvent } from "@/server/services/audit-service";
import { ArticleStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search")?.trim();

    const where: any = {};

    // Employees can only read published articles
    if (!isSupportAgent(user)) {
      where.status = ArticleStatus.PUBLISHED;
    }

    if (categorySlug && categorySlug !== "ALL") {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [articles, categories] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        include: {
          category: true,
          author: { select: { id: true, name: true, jobTitle: true } },
        },
        orderBy: { viewCount: "desc" },
      }),
      prisma.knowledgeCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              articles: {
                where: !isSupportAgent(user) ? { status: ArticleStatus.PUBLISHED } : undefined,
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ articles, categories });
  } catch (error) {
    console.error("Knowledge base GET error:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupportAgent(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = createKnowledgeArticleSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const article = await prisma.knowledgeArticle.create({
      data: {
        slug,
        title: data.title,
        summary: data.summary,
        content: data.content,
        categoryId: data.categoryId,
        status: data.status,
        tags: data.tags || "",
        troubleshootingSteps: data.troubleshootingSteps,
        prerequisites: data.prerequisites,
        expectedResults: data.expectedResults,
        authorId: user.userId,
      },
      include: {
        category: true,
        author: { select: { name: true } },
      },
    });

    await logAuditEvent({
      actor: user,
      action: "KB_ARTICLE_CREATED",
      entityType: "KnowledgeArticle",
      entityId: article.id,
      description: `Published KB article "${article.title}"`,
    });

    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (error) {
    console.error("Knowledge POST error:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
