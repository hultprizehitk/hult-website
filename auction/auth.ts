import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

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

export async function verifyAdminClearance(email: string): Promise<{
  authorized: boolean;
  name: string;
  role: "master_admin" | "lead_admin" | null;
  reason?: string;
}> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Check environment superadmin list (.env.local)
  if (isSuperAdminEmail(cleanEmail)) {
    return {
      authorized: true,
      name: "Master Administrator",
      role: "master_admin",
    };
  }

  // 2. Check live MongoDB database records in users collection
  try {
    await connectDB();
    const dbUser = await User.findOne({ email: cleanEmail }).select("name role").lean();

    if (!dbUser) {
      return {
        authorized: false,
        name: "",
        role: null,
        reason: "User not found in Hult Prize HITK registry.",
      };
    }

    if (dbUser.role === "master_admin" || dbUser.role === "lead_admin") {
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
      reason: `Account role '${dbUser.role}' is not authorized. Lead Admin or Master Admin required.`,
    };
  } catch (err: any) {
    console.error("[Auth] Database check error:", err);
    return { authorized: false, name: "", role: null, reason: "Database verification error." };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      id: "credentials",
      name: "Heritage Admin Credentials",
      credentials: {
        email: { label: "Heritage Admin Email", type: "email" },
        accessKey: { label: "Admin Access Key", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const accessKey = String(credentials?.accessKey ?? "").trim();
        const requiredKey = process.env.ADMIN_ACCESS_KEY || "HULT2026_AUCTION_LEAD";

        if (accessKey && accessKey !== requiredKey) {
          return null;
        }

        const clearance = await verifyAdminClearance(email);
        if (!clearance.authorized || !clearance.role) {
          return null;
        }

        return {
          id: email,
          email,
          name: clearance.name,
          role: clearance.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = String(user?.email || profile?.email || "").toLowerCase().trim();

      // Check Heritage domain restriction
      const domain = email.split("@")[1];
      if (domain !== "heritageit.edu.in" && !isSuperAdminEmail(email)) {
        return "/login?error=DomainRestricted";
      }

      // Check role against MongoDB
      const clearance = await verifyAdminClearance(email);
      if (!clearance.authorized || !clearance.role) {
        return "/login?error=AdminOnly";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.toLowerCase().trim();
        const clearance = await verifyAdminClearance(email);
        token.email = email;
        token.name = user.name || clearance.name;
        token.role = (user as any).role || clearance.role;
        token.admin = clearance.authorized;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).role = token.role as string;
        (session.user as any).admin = Boolean(token.admin);
      }
      return session;
    },
  },
});
