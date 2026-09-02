"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";

interface AdminAccessDeniedProps {
  userEmail: string;
}

export default function AdminAccessDenied({ userEmail }: AdminAccessDeniedProps) {
  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-red-600 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Ambient Red/Dark Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-75">
        <AnimatedGradient config={{ preset: "Amber", speed: 10 }} noise={{ opacity: 0.12, scale: 1 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image src="/Hult-Prize.png" alt="Hult Prize Logo" fill sizes="48px" className="object-contain" />
          </Link>
          <div className="h-4 w-[1px] bg-white/20" />
          <span className="text-xs font-bold tracking-widest text-red-400 uppercase font-[family-name:var(--font-google-sans)]">
            Security Gateway
          </span>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-1.5 text-xs font-semibold text-white transition-all font-[family-name:var(--font-google-sans)]"
        >
          ← Return to Website
        </Link>
      </header>

      {/* Main Alert Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-red-500/30 bg-red-950/20 p-8 sm:p-12 text-center shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(239,68,68,0.2)] backdrop-blur-3xl animate-in zoom-in-95 duration-200">
            {/* Ambient Red Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-red-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-rose-900/30 blur-3xl" />

            {/* Warning Shield Icon */}
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/30 text-3xl shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              🚫
            </div>

            {/* Pill */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-3.5 py-1 text-[11px] font-extrabold text-red-400 uppercase tracking-widest mb-4">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Unauthorized Access
            </span>

            {/* Main Message */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-[family-name:var(--font-google-sans)] leading-tight">
              You are not allowed to access the admin portal
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto mb-6 leading-relaxed">
              This administrative portal is restricted to authorized super administrators only. Your current Google account does not have administrative clearance.
            </p>

            {/* Identity Info Box */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4 mb-8 text-left text-xs font-mono">
              <div className="flex items-center justify-between text-neutral-400 mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-white/50">Signed in as:</span>
                <span className="text-[10px] text-red-400 font-bold uppercase">Role: Student</span>
              </div>
              <p className="text-white font-semibold break-all text-xs sm:text-sm">
                {userEmail}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-neutral-400 leading-normal font-sans">
                🔒 If you are an authorized administrator, please sign in with your designated admin email address.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto rounded-full bg-white hover:bg-neutral-200 text-neutral-900 px-7 py-3 text-xs sm:text-sm font-bold shadow-xl transition-all hover:scale-105 font-[family-name:var(--font-google-sans)]"
              >
                Go to Homepage →
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/portal-hult-8f4b2c1e9a7d" })}
                className="w-full sm:w-auto rounded-full border border-white/20 bg-white/[0.08] hover:bg-white/15 px-6 py-3 text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer font-[family-name:var(--font-google-sans)]"
              >
                Sign In with Different Account
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 py-4 text-center text-[11px] text-white/40">
        © 2027 Hult Prize HITK • Security Gateway Protected
      </footer>
    </div>
  );
}
