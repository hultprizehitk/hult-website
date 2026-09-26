import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";
import { isSuperAdminEmail, isAdminRole } from "@/lib/admin-check";
import type { UserRole } from "@/types/user";
import { sendWelcomeEmail } from "@/lib/email-templates";

// When deployed to production, ensure NEXTAUTH_URL and AUTH_URL point to the live domain
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
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        ...(process.env.NODE_ENV === "production"
          ? { domain: ".hultprizehitk.live" }
          : {}),
      },
    },
  },
  pages: {
    signIn: "/register",
    error: "/register",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (user.email || profile?.email || "").toLowerCase().trim();

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
              lastLoginAt: new Date(),
            });

            // Send welcome email — MUST be awaited, otherwise Next.js terminates
            // the TLS socket before SMTP delivery completes.
            try {
              console.log("[Welcome Email] Sending for NEW account:", dbUser.email);
              const emailResult = await sendWelcomeEmail({
                name: dbUser.name,
                email: dbUser.email,
                department: dbUser.department,
                year: dbUser.year,
                role: dbUser.role,
              });
              console.log("[Welcome Email] Result:", JSON.stringify(emailResult));
              if (!emailResult.success) {
                console.error("[Welcome Email] Failed — resetting flag for retry:", emailResult.error);
                await User.updateOne({ _id: dbUser._id }, { welcomeEmailSent: false });
              }
            } catch (emailErr) {
              console.error("[Welcome Email] Exception — resetting flag for retry:", emailErr);
              await User.updateOne({ _id: dbUser._id }, { welcomeEmailSent: false });
            }
          } else {
            const updates: Record<string, unknown> = {
              department: parsed.branchName,
              year: parsed.academicYear,
              role: assignedRole,
              lastLoginAt: new Date(),
            };
            if (user.image) updates.image = user.image;
            if (parsed.fullName) updates.name = parsed.fullName;

            if (!dbUser.welcomeEmailSent) {
              updates.welcomeEmailSent = true;
              const welcomeName = dbUser.name || parsed.fullName || user.name || "HITK Innovator";

              // Send welcome email — MUST be awaited (see above).
              try {
                console.log("[Welcome Email] Sending for EXISTING account (retry):", dbUser.email);
                const emailResult = await sendWelcomeEmail({
                  name: welcomeName,
                  email: dbUser.email,
                  department: dbUser.department || parsed.branchName,
                  year: dbUser.year || parsed.academicYear,
                  role: dbUser.role,
                });
                console.log("[Welcome Email] Result:", JSON.stringify(emailResult));
                if (!emailResult.success) {
                  console.error("[Welcome Email] Failed — resetting flag for retry:", emailResult.error);
                  updates.welcomeEmailSent = false;
                }
              } catch (emailErr) {
                console.error("[Welcome Email] Exception — resetting flag for retry:", emailErr);
                updates.welcomeEmailSent = false;
              }
            }

            await User.updateOne({ _id: dbUser._id }, updates);
            Object.assign(dbUser, updates);
          }

          user.id = dbUser._id.toString();
          user.name = parsed.fullName || dbUser.name || user.name;
          (user as { department?: string }).department = dbUser.department;
          (user as { year?: string }).year = dbUser.year;
          (user as { role?: string }).role = assignedRole;
          (user as { phone?: string }).phone = dbUser.phone || "";
          (user as { roll?: string }).roll = dbUser.roll || "";
        } catch (dbErr) {
          console.error("Error creating/syncing Google student in MongoDB:", dbErr);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.name) token.name = user.name;
        token.department = (user as { department?: string }).department;
        token.year = (user as { year?: string }).year;
        token.role = (user as { role?: string }).role || "user";
        token.phone = (user as { phone?: string }).phone || "";
        token.roll = (user as { roll?: string }).roll || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        if (token.name) {
          session.user.name = token.name as string;
        }
        Object.assign(session.user, {
          department: token.department,
          year: token.year,
          role: token.role || "user",
          phone: token.phone || "",
          roll: token.roll || "",
        });
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
