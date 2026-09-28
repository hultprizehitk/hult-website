import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isDevLoginEnabled, isHeritageEmail, adminEmailsFromEnv } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin";
import { checkUserRegistration } from "@/lib/sync/mongo-read";

const devProvider = Credentials({
  id: "dev",
  name: "Dev login",
  credentials: { email: { label: "Email", type: "email" } },
  authorize: async (credentials) => {
    const email = String(credentials?.email ?? "").toLowerCase().trim();
    if (!isHeritageEmail(email)) return null;
    return { id: email, email, name: email.split("@")[0] };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    ...(isDevLoginEnabled() ? [devProvider] : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const email = String(user?.email ?? "").toLowerCase().trim();
      const base = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

      // Detect portal: Admin Console (/admin) vs Participant Portal (/signin)
      let isAdminPortal = false;
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const portalCookie = cookieStore.get("quiz_portal")?.value;
        if (portalCookie === "admin") {
          isAdminPortal = true;
        } else if (portalCookie === "participant") {
          isAdminPortal = false;
        } else {
          const callbackUrl =
            cookieStore.get("authjs.callback-url")?.value ||
            cookieStore.get("__Secure-authjs.callback-url")?.value ||
            cookieStore.get("next-auth.callback-url")?.value ||
            cookieStore.get("__Secure-next-auth.callback-url")?.value ||
            "";
          if (callbackUrl.includes("/admin")) {
            isAdminPortal = true;
          }
        }
      } catch {
        // Outside request scope
      }

      if (!isHeritageEmail(email)) {
        return isAdminPortal ? `${base}/admin?error=domain` : `${base}/signin?error=domain`;
      }

      const isAdmin = adminEmailsFromEnv().includes(email) || (await isAdminEmail(email));

      // Admin portal: organizers only.
      if (isAdminPortal) return isAdmin ? true : `${base}/admin?error=admin_only`;

      // Participant portal. Admins may play too (rehearsal, organizers on a team); the quiz itself decides
      // team membership. Everyone else must be on a registered team and scanned at the venue desk.
      if (isAdmin || (account?.provider === "dev" && isDevLoginEnabled())) return true;
      const reg = await checkUserRegistration(email);
      if (!reg.allowed) {
        return `${base}/signin?error=${reg.reason ?? "not_registered"}`;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.toLowerCase().trim();
        token.email = email;
        token.admin = adminEmailsFromEnv().includes(email) || (await isAdminEmail(email));
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
        (session.user as { admin?: boolean }).admin = Boolean(token.admin);
      }
      return session;
    },
  },
});

