import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export interface AdminSessionPayload {
  email: string;
  name: string;
  role: "master_admin" | "lead_admin" | "junior_admin";
  iat: number;
  exp: number;
}

export const COOKIE_NAME = "hult_auction_admin_session";

export function getEnvSuperAdmins(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .replace(/^["']|["']$/g, "")
    .split(",")
    .map((e) => e.replace(/^["']|["']$/g, "").toLowerCase().trim())
    .filter(Boolean);
}

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getEnvSuperAdmins().includes(email.toLowerCase().trim());
}

export function isAuthorizedAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return role === "master_admin" || role === "lead_admin";
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function signAdminToken(
  payload: Omit<AdminSessionPayload, "iat" | "exp">,
  expiresInSeconds = 7 * 24 * 3600
): string {
  const secret = process.env.AUTH_SECRET || "hult-hitk-auction-secret-key-2026";
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AdminSessionPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token?: string | null): AdminSessionPayload | null {
  if (!token) return null;
  try {
    const secret = process.env.AUTH_SECRET || "hult-hitk-auction-secret-key-2026";
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signatureB64 !== expectedSig) return null;

    const payload: AdminSessionPayload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Checks database and environment to verify if the given email has verified Lead or Master Admin clearance.
 */
export async function verifyAdminClearance(email: string): Promise<{
  authorized: boolean;
  name: string;
  role: "master_admin" | "lead_admin" | null;
  reason?: string;
}> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check environment variable superadmin list
  if (isSuperAdminEmail(cleanEmail)) {
    return {
      authorized: true,
      name: "Master Administrator",
      role: "master_admin",
    };
  }

  // 2. Check live MongoDB database
  await connectDB();
  const dbUser = await User.findOne({ email: cleanEmail }).select("name role").lean();

  if (!dbUser) {
    return {
      authorized: false,
      name: "",
      role: null,
      reason: "Account not found in Hult Prize HITK registry.",
    };
  }

  if (isAuthorizedAdminRole(dbUser.role)) {
    return {
      authorized: true,
      name: dbUser.name || "Administrator",
      role: dbUser.role as "master_admin" | "lead_admin",
    };
  }

  return {
    authorized: false,
    name: dbUser.name,
    role: null,
    reason: `Access restricted. Your account clearance is '${dbUser.role}'. Requires Lead Admin or Master Admin.`,
  };
}

/**
 * Validates request cookie in Route Handlers or Server Components.
 */
export async function getAuctionServerSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

/**
 * Validates request in NextRequest context.
 */
export function getAuctionRequestSession(req: NextRequest): AdminSessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}
