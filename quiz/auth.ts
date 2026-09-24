import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { isDevLoginEnabled, isHeritageEmail } from "@/lib/env";

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
    signIn({ user }) {
      return isHeritageEmail(user.email ?? "") ? true : "/signin?error=domain";
    },
  },
});
