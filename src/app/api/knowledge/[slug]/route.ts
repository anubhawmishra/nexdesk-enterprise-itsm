import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isSupportAgent } from "@/lib/auth/rbac";
import { ArticleStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const article = await prisma.knowledgeArticle.findUnique({
      where: { slug },
      include: {
        category: true,
        author: { select: { id: true, name: true, jobTitle: true, department: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!isSupportAgent(user) && article.status !== ArticleStatus.PUBLISHED) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Increment view count asynchronously
    await prisma.knowledgeArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    // Suggest related articles from the same category
    const relatedArticles = await prisma.knowledgeArticle.findMany({
      where: {
        categoryId: article.categoryId,
        id: { not: article.id },
        status: ArticleStatus.PUBLISHED,
      },
      select: { id: true, slug: true, title: true, summary: true },
      take: 4,
    });

    return NextResponse.json({ article, relatedArticles });
  } catch (error) {
    console.error("Knowledge article detail error:", error);
    return NextResponse.json({ error: "Failed to retrieve article" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();
    const { feedback } = body; // "helpful" | "not_helpful"

    const article = await prisma.knowledgeArticle.findUnique({
      where: { slug },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (feedback === "helpful") {
      await prisma.knowledgeArticle.update({
        where: { id: article.id },
        data: { helpfulCount: { increment: 1 } },
      });
    } else if (feedback === "not_helpful") {
      await prisma.knowledgeArticle.update({
        where: { id: article.id },
        data: { notHelpfulCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
