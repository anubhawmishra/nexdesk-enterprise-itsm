import { cookies } from "next/headers";
import { verifySessionToken, signSessionToken, SessionPayload } from "./jwt";
import { prisma } from "../db/prisma";

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "nexdesk_session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Optional: check user is still active in database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, status: true, role: true, name: true, email: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  // Always use the latest role and details from DB to prevent privilege escalations
  return {
    ...payload,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

export async function createSessionCookie(
  payload: SessionPayload,
): Promise<{ name: string; value: string; options: any }> {
  const token = await signSessionToken(payload);
  const isProduction = process.env.NODE_ENV === "production";

  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    },
  };
}
