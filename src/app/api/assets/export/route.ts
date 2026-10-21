import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canExportData } from "@/lib/auth/rbac";
import { generateCsv } from "@/lib/security/csv-export";
import { logAuditEvent } from "@/server/services/audit-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canExportData(user)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Exporting hardware inventory requires Manager or Administrator privileges",
        },
        { status: 403 },
      );
    }

    const assets = await prisma.asset.findMany({
      include: {
        assignedToUser: { select: { name: true, email: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { assetTag: "asc" },
    });

    const csvContent = generateCsv(assets, [
      { header: "Asset Tag", key: "assetTag" },
      { header: "Serial Number", key: "serialNumber" },
      { header: "Type", key: "assetType" },
      { header: "Manufacturer", key: "manufacturer" },
      { header: "Model", key: "model" },
      { header: "OS", key: (a) => a.operatingSystem || "N/A" },
      { header: "RAM (GB)", key: (a) => a.ramGb || "N/A" },
      { header: "Storage (GB)", key: (a) => a.storageGb || "N/A" },
      { header: "Lifecycle Status", key: "lifecycleStatus" },
      { header: "Location", key: "location" },
      { header: "Department", key: (a) => a.department?.name || "Unassigned" },
      { header: "Assigned To", key: (a) => a.assignedToUser?.name || "Unassigned" },
      { header: "Assigned Email", key: (a) => a.assignedToUser?.email || "" },
      { header: "Purchase Date", key: (a) => a.purchaseDate.toISOString().split("T")[0] },
      { header: "Warranty Expiry", key: (a) => a.warrantyExpiry.toISOString().split("T")[0] },
      {
        header: "Purchase Cost (USD)",
        key: (a) => (a.purchaseCost ? a.purchaseCost.toFixed(2) : "0.00"),
      },
    ]);

    await logAuditEvent({
      actor: user,
      action: "ASSETS_EXPORTED_CSV",
      entityType: "Asset",
      entityId: "all",
      description: `Exported ${assets.length} assets to CSV`,
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexdesk-assets-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Asset export error:", error);
    return NextResponse.json({ error: "Failed to export assets" }, { status: 500 });
  }
}
