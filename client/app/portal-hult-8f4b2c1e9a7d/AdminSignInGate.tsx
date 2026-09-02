"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import AnimatedGradient from "@/components/ui/animated-gradient";

export default function AdminSignInGate() {
  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-[#f20089] selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Aurora Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <AnimatedGradient config={{ preset: "Aurora", speed: 16 }} noise={{ opacity: 0.1, scale: 1 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/90" />
      </div>

      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image src="/Hult-Prize.png" alt="Hult Prize Logo" fill sizes="48px" className="object-contain" />
          </Link>
          <div className="h-4 w-[1px] bg-white/20" />
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase font-[family-name:var(--font-google-sans)]">
            Admin Console
          </span>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/20 bg-white/[0.06] hover:bg-white/15 px-4 py-1.5 text-xs font-semibold text-white transition-all font-[family-name:var(--font-google-sans)]"
        >
          ← Return to Website
        </Link>
      </header>

      {/* Center Gate Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/[0.04] p-8 sm:p-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.7),inset_0_1.5px_1px_rgba(255,255,255,0.35)] backdrop-blur-3xl">
            {/* Ambient Glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#f20089]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-900/30 blur-3xl" />

            {/* Lock Icon Badge */}
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/20 text-2xl shadow-[0_0_25px_rgba(242,0,137,0.3)]">
              🛡️
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f20089]/40 bg-[#f20089]/15 px-3 py-1 text-[10px] font-extrabold text-[#f20089] uppercase tracking-widest mb-3">
              Restricted Admin Access
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-[family-name:var(--font-google-sans)]">
              Admin Portal
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xs mx-auto mb-8 leading-relaxed">
              Google authentication is required to enter the Admin Command Center. Please sign in with your authorized administrator account.
            </p>

            {/* Google Admin Login Button */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/portal-hult-8f4b2c1e9a7d/dashboard" })}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-neutral-100 py-3.5 px-5 text-xs sm:text-sm font-extrabold text-neutral-900 shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-[family-name:var(--font-google-sans)]"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Admin Google Account</span>
            </button>

            {/* Security Notice */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-white/50 text-left">
              🔒 <strong>Security Policy:</strong> Only verified administrator accounts listed in the organizing team whitelist are permitted. Unauthorized attempts will be denied.
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 py-4 text-center text-[11px] text-white/40">
        © 2027 Hult Prize HITK • Internal Administrative Operations
      </footer>
    </div>
  );
}
