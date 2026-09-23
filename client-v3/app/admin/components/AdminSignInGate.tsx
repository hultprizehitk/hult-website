"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Button } from "@/components/ui/button";

export default function AdminSignInGate() {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSub = window.location.host.startsWith("admin.");
      setIsSubdomain(isSub);
      if (isSub) {
        setMainSiteUrl(`${window.location.protocol}//${window.location.host.replace(/^admin\./, "")}`);
      } else {
        setMainSiteUrl("/");
      }
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-black font-sans text-white selection:bg-white/25 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Lightweight Dot Pattern Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <DotPattern
          width={28}
          height={28}
          cx={1.5}
          cy={1.5}
          cr={1.2}
          className="fill-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent_85%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
      </div>

      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#08080a] shadow-md">
        <div className="flex items-center gap-3">
          <Link href={isSubdomain ? mainSiteUrl : "/"} className="relative aspect-[1080/659] h-7 sm:h-8">
            <Image src="/Hult-Prize.png" alt="Hult Prize Logo" fill sizes="48px" className="object-contain" />
          </Link>
          <div className="h-4 w-[1px] bg-white/20" />
          <span className="text-xs font-bold tracking-widest text-white/80 uppercase font-[family-name:var(--font-google-sans)]">
            Admin Console
          </span>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full text-xs bg-[#16161d] border-white/15 hover:bg-[#202028]">
          <Link href={isSubdomain ? mainSiteUrl : "/"}>
            ← Return to Website
          </Link>
        </Button>
      </header>

      {/* Center Gate Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#0e0e12] p-8 sm:p-10 text-center shadow-2xl">
            {/* Ambient Glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-neutral-800/40 blur-3xl" />

            <div className="pt-2" />

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest mb-3">
              Restricted Admin Access
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-[family-name:var(--font-google-sans)]">
              Admin Portal
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xs mx-auto mb-8 leading-relaxed">
              Google authentication is required to enter the Admin Command Center. Please sign in with your authorized administrator account.
            </p>

            {/* Google Admin Login Button */}
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                const targetUrl = typeof window !== "undefined" ? window.location.href : (isSubdomain ? "/" : "/admin");
                signIn("google", { callbackUrl: targetUrl });
              }}
              className="w-full flex items-center justify-center gap-3 rounded-2xl py-6 font-bold shadow-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-google-sans)]"
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
            </Button>

            {/* Security Notice */}
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-black/60 p-3 text-[11px] text-white/60 text-left">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
              <span><strong>Security Policy:</strong> Only verified administrator accounts listed in the organizing team whitelist are permitted. Unauthorized attempts will be denied.</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 py-4 text-center text-[11px] text-white/40">
        © 2026 Hult Prize HITK • Internal Administrative Operations
      </footer>
    </div>
  );
}
