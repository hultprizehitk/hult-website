import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { isSuperAdminEmail, isAdminRole } from "@/lib/admin-check";
import type { UserRole } from "@/types";

// When deployed to production, ensure NEXTAUTH_URL and AUTH_URL never point to localhost
if (process.env.NODE_ENV === "production") {
  if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost")) {
    process.env.NEXTAUTH_URL = "https://www.hultprizehitk.live";
  }
  if (!process.env.AUTH_URL || process.env.AUTH_URL.includes("localhost")) {
    process.env.AUTH_URL = "https://www.hultprizehitk.live";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
  ],
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/register",
    error: "/register",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (user.email || profile?.email || "").toLowerCase().trim();
        console.log(`[Google OAuth Attempt] User email: ${email}`);

        // STRICT DOMAIN RESTRICTION: ONLY @heritageit.edu.in
        if (!email.endsWith("@heritageit.edu.in")) {
          console.warn(`[Security Alert] Denied Google sign-in for non-heritage domain: ${email}`);
          return "/register?error=DomainRestricted";
        }

        try {
          await connectDB();
          let dbUser = await User.findOne({ email });
          const parsed = parseHeritageEmail(email, user.name);

          const isSuperAdmin = isSuperAdminEmail(email);

          // If in admin emails list, default to master_admin
          // Otherwise, if dbUser already has an authorized admin role, preserve it!
          let assignedRole: UserRole = isSuperAdmin ? "master_admin" : "user";
          if (!isSuperAdmin && dbUser && isAdminRole(dbUser.role)) {
            assignedRole = dbUser.role as UserRole;
          }

          if (!dbUser) {
            dbUser = await User.create({
              name: parsed.fullName || user.name || "HITK Student",
              email: email,
              image: user.image || "",
              department: parsed.branchName,
              year: parsed.academicYear,
              role: assignedRole,
            });
          } else {
            const updates: Record<string, string> = {
              department: parsed.branchName,
              year: parsed.academicYear,
              role: assignedRole,
            };
            if (user.image) updates.image = user.image;
            await User.updateOne({ _id: dbUser._id }, updates);
            Object.assign(dbUser, updates);
          }

          user.id = dbUser._id.toString();
          (user as { department?: string }).department = dbUser.department;
          (user as { year?: string }).year = dbUser.year;
          (user as { role?: string }).role = dbUser.role;
        } catch (dbErr) {
          console.error("Error creating/syncing Google user in MongoDB:", dbErr);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.department = (user as { department?: string }).department;
        token.year = (user as { year?: string }).year;
        token.role = (user as { role?: string }).role;
      }

      const email = (token.email || "").toLowerCase().trim();
      const isSuperAdmin = isSuperAdminEmail(email);

      if (isSuperAdmin && (!token.role || token.role === "user")) {
        token.role = "master_admin";
      } else if (!token.role || token.role === "user") {
        // Query database to see if this user was appointed with an admin role
        try {
          await connectDB();
          const dbUser = await User.findOne({ email }).select("role").lean();
          if (dbUser?.role && isAdminRole(dbUser.role)) {
            token.role = dbUser.role;
          } else {
            token.role = "user";
          }
        } catch {
          token.role = token.role || "user";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        const email = (session.user.email || token.email || "").toLowerCase().trim();
        const isSuperAdmin = isSuperAdminEmail(email);

        Object.assign(session.user, {
          department: token.department,
          year: token.year,
          role:
            token.role && isAdminRole(token.role as string)
              ? token.role
              : isSuperAdmin
              ? "master_admin"
              : "user",
        });
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
