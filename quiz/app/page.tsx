"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, Loader2, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { QuizShell } from "@/components/quiz/QuizShell";
import { GateCard } from "@/components/quiz/GateCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { GoogleIcon } from "@/components/quiz/GoogleIcon";
import { AuthErrorDialog } from "@/components/quiz/AuthErrorDialog";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";

interface ActiveSessionInfo {
  active: boolean;
  code?: string;
  status?: string;
  phase?: string;
  title?: string;
  eventTitle?: string;
}

export default function JoinPage() {
  const router = useRouter();
  const fb = useFirebaseUser();
  const [sessionInfo, setSessionInfo] = useState<ActiveSessionInfo | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadActiveSession() {
      try {
        const res = await fetch("/api/session/active");
        if (res.ok) {
          const data = (await res.json()) as ActiveSessionInfo;
          if (!cancelled) setSessionInfo(data);
        }
      } catch (err) {
        console.warn("Failed to check active quiz session:", err);
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    }
    loadActiveSession();
    const interval = setInterval(loadActiveSession, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleEnterQuiz = () => {
    router.push("/quiz");
  };

  return (
    <QuizShell>
      <AuthErrorDialog />
      <GateCard
        badge="HULT ASCEND"
        title="Live Quiz Arena"
        subtitle="Heritage Institute of Technology • SV Auditorium"
      >
        {fb.status === "signed-in" && (
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#141418] px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 text-left">
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-hult to-pink-600 text-xs font-bold text-white">
                  {(fb.name || fb.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">{fb.name || fb.email?.split("@")[0]}</span>
                  <span className="max-w-[170px] truncate text-[10px] text-neutral-400 sm:max-w-[210px]">{fb.email}</span>
                </div>
              </div>
              {fb.admin ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25"
                >
                  <ShieldCheck className="size-3" />
                  Console
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  <UserCheck className="size-3" />
                  Checked In
                </span>
              )}
            </div>

            {loadingSession ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-neutral-400">
                <Loader2 className="size-6 animate-spin text-pink-500" />
                <span className="text-xs">Connecting to Hult Ascend arena...</span>
              </div>
            ) : sessionInfo?.active && sessionInfo.code ? (
              <div className="flex flex-col gap-3">
                <Button
                  size="xl"
                  onClick={handleEnterQuiz}
                  className="relative w-full rounded-2xl bg-hult py-6 text-base font-extrabold text-white shadow-xl shadow-pink-500/20 transition-all hover:bg-pink-600 hover:shadow-pink-500/30 active:scale-[0.99]"
                >
                  <Sparkles className="size-5" />
                  <span>Enter Hult Ascend Quiz</span>
                  <ArrowRight className="size-5" />
                </Button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Arena Session Active • 1 Player Per Team</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 bg-[#121217] py-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-pink-500/10 text-pink-400">
                  <Clock className="size-5 animate-pulse" />
                </div>
                <div className="text-sm font-bold text-white">Waiting for Host to Start</div>
                <p className="max-w-xs text-xs text-neutral-400">
                  The organizer has not opened the quiz lobby yet. Please keep this screen open—you will be connected automatically.
                </p>
              </div>
            )}
          </div>
        )}

        {fb.status === "anonymous" && (
          <div className="flex flex-col gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-[#141418] p-4">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-pink-400">
                Participant Access Gate
              </div>
              <p className="mb-4 text-xs leading-relaxed text-neutral-300">
                Sign in with your registered college account (@heritageit.edu.in). Only participants verified & checked-in at the SV Auditorium desk can enter.
              </p>
              <Link
                href="/signin"
                className={buttonVariants({
                  size: "xl",
                  className: "w-full rounded-xl bg-white font-bold text-black transition-all hover:bg-neutral-200",
                })}
              >
                <GoogleIcon />
                Sign in with College Account
              </Link>
            </div>
          </div>
        )}
      </GateCard>
    </QuizShell>
  );
}

