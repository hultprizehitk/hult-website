import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { parseHeritageEmail } from "@/lib/heritage-parser";

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

          const SUPER_ADMINS = [
            "harsh.raj.iotcs28@heritageit.edu.in",
            "bhoomi.ladia.aiml28@heritageit.edu.in",
          ];
          const isSuperAdmin = SUPER_ADMINS.includes(email);

          // If in hardcoded superadmins list, always superadmin
          // Otherwise, if dbUser already has role 'admin' or 'superadmin', preserve it!
          let assignedRole: "student" | "admin" | "superadmin" = isSuperAdmin ? "superadmin" : "student";
          if (!isSuperAdmin && dbUser && (dbUser.role === "admin" || dbUser.role === "superadmin")) {
            assignedRole = dbUser.role;
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

      // Check SUPER_ADMINS whitelist
      const SUPER_ADMINS = [
        "harsh.raj.iotcs28@heritageit.edu.in",
        "bhoomi.ladia.aiml28@heritageit.edu.in",
      ];
      const email = (token.email || "").toLowerCase().trim();
      if (SUPER_ADMINS.includes(email)) {
        token.role = "superadmin";
      } else if (!token.role || token.role === "student") {
        // Query database to see if this user was appointed as admin
        try {
          await connectDB();
          const dbUser = await User.findOne({ email }).select("role").lean();
          if (dbUser?.role === "admin" || dbUser?.role === "superadmin") {
            token.role = dbUser.role;
          } else {
            token.role = "student";
          }
        } catch {
          token.role = token.role || "student";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        const SUPER_ADMINS = [
          "harsh.raj.iotcs28@heritageit.edu.in",
          "bhoomi.ladia.aiml28@heritageit.edu.in",
        ];
        const email = (session.user.email || token.email || "").toLowerCase().trim();
        const isSuperAdmin = SUPER_ADMINS.includes(email);

        Object.assign(session.user, {
          department: token.department,
          year: token.year,
          role: isSuperAdmin ? "superadmin" : (token.role || "student"),
        });
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
