"use client";

import Link from "next/link";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { firebaseClient } from "@/lib/firebase/client";
import { handleSignOut } from "@/app/actions/auth";

export function UserNav() {
  const fb = useFirebaseUser();

  if (fb.status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />;
  }

  if (fb.status === "anonymous" || !fb.email) {
    return (
      <Link
        href="/signin"
        className="flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 px-3.5 py-1 text-xs font-semibold text-pink-300 transition-all hover:border-pink-500 hover:bg-pink-500/20 hover:text-white"
      >
        <LogIn className="size-3.5" />
        <span>Sign In</span>
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
        <button
          type="button"
          onClick={onLogout}
          className="ml-1 text-white/50 transition-colors hover:text-rose-400"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
