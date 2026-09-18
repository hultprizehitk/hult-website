"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { MapPin, AlertTriangle, RotateCcw, CheckCircle2, Crown, User, Check, Clock } from "lucide-react";

function CheckInContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInResult, setCheckInResult] = useState<{
    alreadyCheckedIn?: boolean;
    message?: string;
    rsvp?: any;
    team?: any;
  } | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      setLoading(false);
      return;
    }

    if (authStatus === "authenticated" && session?.user?.email && eventId) {
      performCheckIn();
    }
  }, [authStatus, session, eventId]);

  const performCheckIn = async () => {
    if (!eventId) {
      setError("No Event ID provided in QR code.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: "checkin",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check-in failed.");
      }

      setCheckInResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during check-in.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Unauthenticated state
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-google-sans)] relative overflow-hidden">
        {/* Background Glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#f20089]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-900/30 blur-3xl" />

        <div className="relative z-10 max-w-md w-full rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-8 space-y-6 shadow-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f20089]/20 border border-[#f20089]/40 text-[#f20089]">
            <MapPin className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="rounded-full bg-[#f20089]/20 border border-[#f20089]/40 px-3 py-0.5 text-[10px] font-bold text-[#f20089] uppercase tracking-wider">
              Auditorium QR Scanner
            </span>
            <h1 className="text-2xl font-black tracking-tight">Hult Ascend Check-In</h1>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Please sign in with your college email (<span className="text-[#f20089] font-mono">@heritageit.edu.in</span>) to confirm your physical presence.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              signIn("google", {
                callbackUrl: `/events/checkin?eventId=${eventId}`,
              })
            }
            className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-neutral-100 py-3.5 text-xs font-bold text-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Sign In with College Email (@heritageit.edu.in)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-google-sans)] relative">
        <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#f20089]/20 blur-3xl" />
        <div className="relative z-10 max-w-md w-full rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-10 space-y-4 shadow-2xl flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-[#f20089]/30 border-t-[#f20089] animate-spin" />
          <h2 className="text-lg font-bold">Verifying Attendance...</h2>
          <p className="text-xs text-white/60 font-sans">Connecting to Hult Ascend event server</p>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-google-sans)] relative">
        <div className="relative z-10 max-w-md w-full rounded-3xl border border-red-500/30 bg-red-950/20 backdrop-blur-2xl p-8 space-y-6 shadow-2xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-red-200">Check-In Action Required</h1>
            <p className="text-xs text-red-300/80 font-sans leading-relaxed">{error}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={performCheckIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 py-3 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
            <Link
              href="/events"
              className="w-full rounded-2xl bg-[#f20089] hover:bg-[#d8007a] py-3 text-xs font-bold text-white transition-all text-center"
            >
              Go to Events & RSVP
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Success / Checked-In State
  const rsvp = checkInResult?.rsvp;
  const team = checkInResult?.team;
  const checkedInMembers = rsvp?.checkedInMembers || [];
  const teamMembers = team?.members || [];
  const totalRosterCount = 1 + teamMembers.length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-google-sans)] relative overflow-hidden">
      {/* Iridescent Ambient Background */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#f20089]/20 blur-3xl" />

      <div className="relative z-10 max-w-lg w-full rounded-[2.5rem] border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-white/[0.03] to-black backdrop-blur-3xl p-8 space-y-6 shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
        {/* Success Icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/30 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        {/* Checked In Header */}
        <div className="space-y-1.5">
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-[11px] font-bold text-emerald-300 uppercase tracking-widest font-mono">
            {checkInResult?.alreadyCheckedIn ? "Already Checked In" : "Attendance Recorded!"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {session?.user?.name || "Student"}
          </h1>
          <p className="text-sm font-semibold text-[#f20089]">
            Team {team?.teamName || rsvp?.teamName} ({rsvp?.teamCode})
          </p>
        </div>

        {/* Member Roster Progress Bar */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3 font-sans text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Auditorium Team Roster</span>
            <span className="font-mono text-emerald-400 font-bold">
              {checkedInMembers.length} / {totalRosterCount} Members Present
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (checkedInMembers.length / totalRosterCount) * 100)}%` }}
            />
          </div>

          {/* Member List */}
          <div className="space-y-2 pt-1 text-xs">
            {/* Team Lead */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
              <span className="font-medium text-white flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>{team?.lead?.name || rsvp?.leadEmail}</span>
              </span>
              {checkedInMembers.some((m: any) => m.email.toLowerCase() === team?.leadEmail?.toLowerCase()) ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Check className="h-3 w-3" />
                  <span>Present</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span>Pending Scan</span>
                </span>
              )}
            </div>

            {/* Teammates */}
            {teamMembers.map((mate: any, idx: number) => {
              const isScanned = checkedInMembers.some(
                (m: any) => m.email.toLowerCase() === mate.email?.toLowerCase()
              );
              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-sky-400" />
                    <span>{mate.name}</span>
                  </span>
                  {isScanned ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" />
                      <span>Present</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      <span>Pending Scan</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-white/50 font-sans">
          You may now close this page or return to the event portal.
        </p>

        <Link
          href="/events"
          className="inline-block w-full rounded-2xl bg-white/[0.08] hover:bg-white/15 border border-white/15 py-3 text-xs font-semibold text-white transition-all"
        >
          Return to Events Portal →
        </Link>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
