import { prisma } from "@/lib/db/prisma";
import { SessionPayload } from "@/lib/auth/jwt";

export interface LogAuditOptions {
  actor?: SessionPayload | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    // Sanitize metadata to never include password or sensitive keys
    let sanitizedMetadata: string | undefined;
    if (options.metadata) {
      const copy = { ...options.metadata };
      delete copy.password;
      delete copy.passwordHash;
      delete copy.token;
      delete copy.secret;
      delete copy.authorization;
      sanitizedMetadata = JSON.stringify(copy);
    }

    await prisma.auditEvent.create({
      data: {
        actorId: options.actor?.userId || null,
        actorEmail: options.actor?.email || "system",
        actorRole: options.actor?.role || "SYSTEM",
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        metadataJson: sanitizedMetadata,
      },
    });
  } catch (err) {
    // Never crash the primary business operation if audit logging encounters an issue
    console.error("Failed to write audit event:", err);
  }
}
