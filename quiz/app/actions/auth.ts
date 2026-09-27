"use server";

import { auth, signOut } from "@/auth";
import { releaseTeamDevice } from "@/lib/quiz/teams";

export async function handleSignOut() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (email) {
    try {
      await releaseTeamDevice(email);
    } catch (err) {
      console.warn("[quiz auth] Failed to release device on sign out:", err);
    }
  }
  await signOut({ redirectTo: "/" });
}
