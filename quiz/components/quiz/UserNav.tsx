"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { firebaseClient } from "@/lib/firebase/client";
import { handleSignOut } from "@/app/actions/auth";

/** lockSignOut: hidden while the quiz is live, so a mis-tap cannot drop the team's player mid-question. */
export function UserNav({ lockSignOut = false }: { lockSignOut?: boolean }) {
  const fb = useFirebaseUser();
  const onAdminPage = usePathname().startsWith("/admin");

  if (fb.status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />;
  }

  // Signed out: players are already sent to sign-in, so the nav offers the organizer route instead.
  if (fb.status === "anonymous" || !fb.email) {
    if (onAdminPage) return null;
    return (
      <Link
        href="/admin"
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold text-white/70 transition-all hover:border-pink-500/60 hover:text-white"
      >
        <ShieldCheck className="size-3.5" />
        <span>Admin console</span>
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
      {fb.admin && (
        <Link
          href="/admin"
          className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/20 sm:flex"
        >
          <ShieldCheck className="size-3" />
          <span>Admin</span>
        </Link>
      )}

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
