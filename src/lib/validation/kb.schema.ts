import { z } from "zod";
import { ArticleStatus } from "@prisma/client";

export const createKnowledgeArticleSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(500),
  content: z.string().trim().min(20, "Content must be at least 20 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.PUBLISHED),
  tags: z.string().optional().default(""),
  troubleshootingSteps: z.string().optional(),
  prerequisites: z.string().optional(),
  expectedResults: z.string().optional(),
});

export type CreateKnowledgeArticleInput = z.infer<typeof createKnowledgeArticleSchema>;
