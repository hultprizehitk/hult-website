"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { firebaseClient } from "@/lib/firebase/client";
import { handleSignOut } from "@/app/actions/auth";

/** lockSignOut: hidden while the quiz is live, so a mis-tap cannot drop the team's player mid-question. */
export function UserNav({ lockSignOut = false }: { lockSignOut?: boolean }) {
  const fb = useFirebaseUser();
  const pathname = usePathname();
  const onAdminPage = pathname.startsWith("/admin");
  const onSignInPage = pathname.startsWith("/signin");

  if (fb.status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />;
  }

  // Signed out: show a clean sign-in link on frontend pages (hidden if already on sign-in or admin gate)
  if (fb.status === "anonymous" || !fb.email) {
    if (onAdminPage || onSignInPage) return null;
    return (
      <Link
        href="/signin"
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-white/70 transition-all hover:border-pink-500/60 hover:text-white"
      >
        <span>Sign in</span>
      </Link>
    );
  }

  const initial = (fb.name || fb.email || "U").charAt(0).toUpperCase();

  const onLogout = async () => {
    await firebaseSignOut(firebaseClient().auth).catch(() => {});
    await handleSignOut();
  };

  return (
    <div className="flex items-center gap-2">


      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#141418] py-1 pl-1.5 pr-2.5 shadow-sm">
        <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-tr from-hult to-pink-600 text-[11px] font-extrabold text-white">
          {initial}
        </div>
        <span className="max-w-[110px] truncate text-xs font-medium text-white sm:max-w-[150px]">
          {fb.name || fb.email.split("@")[0]}
        </span>
        {!lockSignOut && (
          <button
            type="button"
            onClick={onLogout}
            className="ml-1 text-white/50 transition-colors hover:text-rose-400"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
