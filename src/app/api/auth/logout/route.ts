import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getCurrentUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/server/services/audit-service";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAuditEvent({
        actor: user,
        action: "AUTH_LOGOUT",
        entityType: "User",
        entityId: user.userId,
        description: `User ${user.email} signed out`,
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Logout route error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
