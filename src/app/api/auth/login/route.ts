import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth.schema";
import { createSessionCookie } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/server/services/audit-service";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: 10 attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(`login_${ip}`, 10, 15 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many authentication attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid login credentials", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });

    // Generic error message to prevent account enumeration
    if (!user || user.status !== "ACTIVE") {
      await logAuditEvent({
        action: "AUTH_LOGIN_FAILED",
        entityType: "User",
        entityId: email,
        description: `Failed login attempt for ${email}`,
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      await logAuditEvent({
        action: "AUTH_LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        description: `Incorrect password for ${email}`,
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    };

    const cookieData = await createSessionCookie(sessionPayload);

    await logAuditEvent({
      actor: sessionPayload,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      description: `User ${user.email} signed in successfully`,
      ipAddress: ip,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department?.name,
      },
    });

    response.cookies.set(cookieData.name, cookieData.value, cookieData.options);
    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred during authentication." },
      { status: 500 },
    );
  }
}
