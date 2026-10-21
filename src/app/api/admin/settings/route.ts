import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isAdmin } from "@/lib/auth/rbac";
import { logAuditEvent } from "@/server/services/audit-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator access required" },
        { status: 403 },
      );
    }

    const [settings, policies] = await Promise.all([
      prisma.applicationSettings.findFirst(),
      prisma.sLAPolicy.findMany({ orderBy: { priority: "asc" } }),
    ]);

    return NextResponse.json({ settings, policies });
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json({ error: "Failed to retrieve settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden: Administrator access required" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const updated = await prisma.applicationSettings.upsert({
      where: { id: "default-settings" },
      update: {
        organizationName: body.organizationName,
        supportEmail: body.supportEmail,
        defaultTimezone: body.defaultTimezone,
        businessHoursStart: body.businessHoursStart,
        businessHoursEnd: body.businessHoursEnd,
        enableAutoAssignment: body.enableAutoAssignment,
        slaWarningThreshold: body.slaWarningThreshold,
      },
      create: {
        id: "default-settings",
        organizationName: body.organizationName || "NexTech Enterprise Solutions",
        supportEmail: body.supportEmail || "support@nexdesk.internal",
      },
    });

    await logAuditEvent({
      actor: user,
      action: "SETTINGS_UPDATED",
      entityType: "ApplicationSettings",
      entityId: "default-settings",
      description: "Updated core application configuration and SLA thresholds",
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
