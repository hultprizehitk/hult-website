"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DotPattern } from "@/components/ui/DotPattern";
import { ShieldCheck, Lock, Mail, ArrowRight, RefreshCw, AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated via auction session
  useEffect(() => {
    fetch("/api/auction/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          router.replace(callbackUrl);
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => setCheckingSession(false));
  }, [router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your Heritage admin email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter the unified admin password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auction/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center font-['Helvetica',Arial,sans-serif]">
        <RefreshCw className="size-6 text-[#f20089] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center px-4 font-['Helvetica',Arial,sans-serif] select-none overflow-hidden">
      <DotPattern
        width={32}
        height={32}
        cx={1}
        cy={1}
        cr={1}
        className="text-white/10 opacity-40 fixed inset-0 pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0e0e12] border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-[#f20089]/10 border border-[#f20089]/30 text-[#f20089] mb-3">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">
            Hult Prize HITK
          </h1>
          <p className="text-xs font-mono text-[#f20089] tracking-wider uppercase mt-1">
            Auction Portal &bull; Admin Clearance
          </p>
          <p className="text-[11px] text-white/40 mt-1">
            Restricted to Lead Administrators &amp; Master Administrators
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 font-mono">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Email & Unified Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1.5">
              Heritage Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin.aiml28@heritageit.edu.in"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black border border-white/15 focus:border-[#f20089] focus:outline-none text-white text-xs font-mono placeholder:text-white/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1.5">
              Unified Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Unified Password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black border border-white/15 focus:border-[#f20089] focus:outline-none text-white text-xs font-mono placeholder:text-white/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider bg-[#f20089] hover:bg-[#d00075] disabled:opacity-50 text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#f20089]/20"
          >
            {loading ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <>
                <span>Enter Auction Console</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-black text-white flex items-center justify-center font-['Helvetica',Arial,sans-serif]">
          <RefreshCw className="size-6 text-[#f20089] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
