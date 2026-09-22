"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";

interface AdminAccessDeniedProps {
  email?: string;
  name?: string;
}

export default function AdminAccessDenied({ email, name }: AdminAccessDeniedProps) {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-950/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="relative rounded-2xl border border-red-500/20 bg-neutral-900/80 backdrop-blur-xl p-8 shadow-2xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2">
            Access Clearance Denied
          </h2>

          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            The authenticated account <span className="font-mono text-white/90">{email || "unknown"}</span> ({name || "Student"}) does not hold administrator clearance for the Hult Prize HITK Command Center.
          </p>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left mb-6 font-mono text-[11px] space-y-1 text-neutral-400">
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="text-white">Registered Student</span>
            </div>
            <div className="flex justify-between">
              <span>Required Role:</span>
              <span className="text-rose-400">master_admin / lead_admin</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-neutral-300">Contact Committee Leads</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => signOut({ callbackUrl: "/admin" })}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium px-5 py-3 text-xs border border-white/10 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Switch Account / Sign Out</span>
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white font-medium px-5 py-2.5 text-xs transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
