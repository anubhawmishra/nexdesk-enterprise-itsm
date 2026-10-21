import { z } from "zod";
import {
  TicketPriority,
  ImpactLevel,
  UrgencyLevel,
  TicketStatus,
  TicketType,
} from "@prisma/client";

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(160, "Title cannot exceed 160 characters"),
  description: z
    .string()
    .trim()
    .min(15, "Please provide at least 15 characters describing the issue or request")
    .max(5000, "Description cannot exceed 5000 characters"),
  type: z.nativeEnum(TicketType).default(TicketType.INCIDENT),
  categoryId: z.string().min(1, "Please select a category"),
  subcategoryId: z.string().optional().nullable(),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  impact: z.nativeEnum(ImpactLevel).default(ImpactLevel.MEDIUM),
  urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.MEDIUM),
  affectedAssetId: z.string().optional().nullable(),
});

export const updateTicketStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  changeReason: z.string().trim().max(500).optional(),
  resolutionNotes: z.string().trim().max(3000).optional(),
  rootCause: z.string().trim().max(1000).optional(),
});

export const assignTicketSchema = z.object({
  agentId: z.string().nullable(),
  notes: z.string().trim().max(500).optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(3000, "Comment cannot exceed 3000 characters"),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
