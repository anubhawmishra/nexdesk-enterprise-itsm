import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "@prisma/client";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string | null;
}

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "nexdesk-enterprise-dev-secret-key-32chars-min-98124971249",
);

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      departmentId: (payload.departmentId as string) || null,
    };
  } catch {
    return null;
  }
}
