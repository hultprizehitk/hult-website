import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { isSuperAdminEmail, isAdminRole } from "@/lib/admin-check";
import { sendWelcomeEmail } from "@/lib/email-templates";
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
        const domain = email.split("@")[1];
        if (domain !== "heritageit.edu.in") {
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
              welcomeEmailSent: true,
            });

            // Trigger Google Workspace official welcome email for new account creation
            sendWelcomeEmail({
              name: dbUser.name,
              email: dbUser.email,
              department: dbUser.department,
              year: dbUser.year,
              role: dbUser.role,
            }).catch((emailErr) => {
              console.error("[Google Workspace SMTP] Failed to send welcome email on account creation:", emailErr);
            });
          } else {
            const updates: Record<string, any> = {
              department: parsed.branchName,
              year: parsed.academicYear,
              role: assignedRole,
            };
            if (user.image) updates.image = user.image;

            // If user has not yet received their first-time welcome email, send it now
            if (!dbUser.welcomeEmailSent) {
              updates.welcomeEmailSent = true;
              sendWelcomeEmail({
                name: dbUser.name || parsed.fullName || user.name || "HITK Innovator",
                email: dbUser.email,
                department: dbUser.department || parsed.branchName,
                year: dbUser.year || parsed.academicYear,
                role: dbUser.role,
              }).catch((emailErr) => {
                console.error("[Google Workspace SMTP] Failed to send welcome email on first login:", emailErr);
              });
            }

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
        const email = (user.email || token.email || "").toLowerCase().trim();
        const parsed = parseHeritageEmail(email);
        token.name = parsed.fullName || user.name;
        token.id = user.id;
        token.department = (user as { department?: string }).department;
        token.year = (user as { year?: string }).year;
        token.role = (user as { role?: string }).role;
      }

      const email = (token.email || "").toLowerCase().trim();
      if (email) {
        const parsed = parseHeritageEmail(email);
        token.name = parsed.fullName || (token.name as string);
      }
      const isSuperAdmin = isSuperAdminEmail(email);

      if (isSuperAdmin && (!token.role || token.role === "user")) {
        token.role = "master_admin";
      } else if (!token.role || token.role === "user") {
        // Query database to see if this user was appointed with an admin role
        try {
          await connectDB();
          const dbUser = await User.findOne({ email }).select("role name").lean();
          if (dbUser?.name) {
            token.name = dbUser.name;
          }
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
        const parsed = parseHeritageEmail(email);
        const isSuperAdmin = isSuperAdminEmail(email);

        session.user.name = (token.name as string) || parsed.fullName || session.user.name;

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
