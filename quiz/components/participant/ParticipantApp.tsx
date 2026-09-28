"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Loader2, Lock, LogIn, QrCode, SearchX, ShieldAlert, UserX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { QuizShell } from "@/components/quiz/QuizShell";
import { StateMessage } from "@/components/quiz/StateMessage";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { LeadIn } from "@/components/quiz/LeadIn";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { useDocData } from "@/hooks/useFirestore";
import { useServerClock } from "@/hooks/useServerClock";
import { useServerNow } from "@/hooks/useServerNow";
import { useWakeLock } from "@/hooks/useWakeLock";
import { api, ApiError } from "@/lib/client/api";
import { getDeviceId } from "@/lib/client/device";
import { toStateResponse } from "@/lib/quiz/client-state";
import { playPath } from "@/lib/quiz/event";
import { paths, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import type { AnswerView } from "@/lib/quiz/types";
import { LobbyView } from "./LobbyView";
import { QuestionView } from "./QuestionView";
import { ResultsView } from "./ResultsView";
import { LeaderboardView } from "./LeaderboardView";
import { SeatView } from "./SeatView";
import { StartingView } from "./StartingView";

interface JoinOk {
  teamId: string;
  role: "taker" | "teammate";
}

/**
 * Phone app. Listens to exactly two Firestore docs (PRD 9.2.2): the public session and the user's own team.
 * Everything that changes data goes through the API (join, answer). Screens: spec 2026-09-28 §4.
 */
export function ParticipantApp({ code }: { code: string }) {
  const valid = /^\d{6}$/.test(code);
  const [deviceId] = useState(() => (typeof window === "undefined" ? "" : getDeviceId()));
  const fb = useFirebaseUser();
  const sessionLive = useDocData<SessionDoc>(valid ? paths.session(code) : null);
  const session = sessionLive.data;
  const serverNow = useServerClock();
  const now = useServerNow(serverNow);

  const [join, setJoin] = useState<JoinOk | null>(null);
  const [joinError, setJoinError] = useState<ApiError | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const teamLive = useDocData<TeamDoc>(join && fb.status === "signed-in" ? paths.team(code, join.teamId) : null);
  const team = teamLive.data;

  // Join = check in + take the seat. Re-run when the situation changes: new login, session opening or
  // check-in toggling (while not joined), a seat reserved for me by the admin, or an explicit retry.
  // Admin "Reset for event" clears check-ins: such a phone goes back through check-in.
  const joined = !!join && !(team && !team.checkedInAt);
  const reservedForMe = !!team && !!fb.email && team.takerEmail === fb.email && !team.deviceId && !!team.checkedInAt;
  const joinKey =
    fb.status === "signed-in" && session
      ? `${fb.email}:${joined ? "joined" : `${session.status}:${session.checkinOpen}`}:${reservedForMe ? "bind" : ""}:${retryNonce}`
      : null;
  const attempted = useRef<string | null>(null);
  useEffect(() => {
    if (!joinKey || attempted.current === joinKey) return;
    if (joined && !reservedForMe) return;
    attempted.current = joinKey;
    api<JoinOk & { deviceOk: boolean }>(`/api/s/${code}/join`, { body: { deviceId } })
      .then((r) => {
        setJoin({ teamId: r.teamId, role: r.role });
        setJoinError(null);
      })
      .catch((e: ApiError) => setJoinError(e));
  }, [joinKey, joined, reservedForMe, code, deviceId]);

  const [claiming, setClaiming] = useState(false);
  const claim = useCallback(async () => {
    setClaiming(true);
    try {
      const r = await api<JoinOk>(`/api/s/${code}/join`, { body: { deviceId, claim: true } });
      setJoin({ teamId: r.teamId, role: r.role });
    } catch (e) {
      toast.error((e as ApiError).message);
    } finally {
      setClaiming(false);
    }
  }, [code, deviceId]);

  // Optimistic answer until the team doc reflects it. Keyed by question + open time, so a restarted
  // question (same id, new open time) starts clean.
  const [pending, setPending] = useState<{ key: string; optionIndex: number } | null>(null);
  const questionKey = session?.current && session.questionOpenedAt ? `${session.current.id}:${session.questionOpenedAt.toMillis()}` : null;
  const submit = async (optionIndex: number) => {
    const questionId = session?.current?.id;
    if (!questionId || !questionKey) return;
    setPending({ key: questionKey, optionIndex });
    const body = { questionId, optionIndex, deviceId };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await api(`/api/s/${code}/answer`, { body });
        return;
      } catch (e) {
        const err = e as ApiError;
        if (err.code === "network" && attempt === 0) continue;
        setPending(null);
        toast.error(err.message);
        return;
      }
    }
  };

  const status = session?.status;
  const seatMine = !!team && !!fb.email && team.takerEmail === fb.email && team.deviceId === deviceId;
  useWakeLock(status === "live" && seatMine);

  // Wake the answer route during the lead-in so a cold server never delays the first answers.
  const warmed = useRef<string | null>(null);
  useEffect(() => {
    if (!seatMine || !questionKey || session?.phase !== "question" || warmed.current === questionKey) return;
    warmed.current = questionKey;
    void fetch(`/api/s/${code}/answer`, { cache: "no-store" }).catch(() => {});
  }, [seatMine, questionKey, session?.phase, code]);

  const shell = (children: React.ReactNode) => (
    <QuizShell lockSignOut={status === "live"}>
      {children}
      <ReconnectingPill show={sessionLive.offline} />
    </QuizShell>
  );
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(playPath(code))}`;
  const switchAccount = (
    <Link href={signInHref} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
      Switch account
    </Link>
  );
  const retry = (
    <Button variant="outline" className="rounded-full" onClick={() => setRetryNonce((n) => n + 1)}>
      Try again
    </Button>
  );

  if (!valid) return shell(<StateMessage icon={SearchX} title="Invalid link" />);
  if (sessionLive.loading || fb.status === "loading") return shell(<StateMessage icon={Loader2} spin title="Connecting" />);
  if (!session) return shell(<StateMessage icon={Clock} title="Quiz not set up yet" subtitle="This page updates on its own" />);
  if (fb.status === "error") {
    return shell(<StateMessage icon={ShieldAlert} title="Could not connect" subtitle={fb.error ?? undefined} action={<Button variant="outline" className="rounded-full" onClick={fb.retry}>Retry</Button>} />);
  }
  if (fb.status === "anonymous") {
    return shell(
      <StateMessage
        icon={LogIn}
        title="Sign in to play"
        subtitle={fb.error ?? "College Google account"}
        action={
          <Link href={signInHref} className={buttonVariants({ size: "lg", className: "rounded-2xl px-6 font-bold" })}>
            Sign in
          </Link>
        }
      />,
    );
  }

  if (!joined) {
    const c = joinError?.code;
    if (c === "not_registered") {
      return shell(
        <StateMessage
          icon={UserX}
          title="No team found"
          subtitle={`${fb.email} is not on a registered team`}
          action={
            <div className="flex gap-2">
              {switchAccount}
              {fb.admin && (
                <Link href="/admin" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
                  Admin console
                </Link>
              )}
            </div>
          }
        />,
      );
    }
    if (c === "ineligible") return shell(<StateMessage icon={ShieldAlert} title="Team not eligible" subtitle="Team must be confirmed and submitted" action={switchAccount} />);
    if (c === "not_checked_in") return shell(<StateMessage icon={QrCode} title="Scan your pass at the desk" subtitle="Then try again" action={retry} />);
    if (c === "checkin_closed") {
      return shell(
        session.status === "lobby"
          ? <StateMessage icon={Clock} title="Check-in paused" subtitle="This page updates on its own" />
          : <StateMessage icon={Lock} title="Check-in closed" subtitle="The quiz has started" />,
      );
    }
    if (c === "invalid_state") return shell(<StateMessage icon={Clock} title="Check-in opens soon" subtitle="This page updates on its own" />);
    if (joinError) return shell(<StateMessage icon={ShieldAlert} title={joinError.message} action={retry} />);
    return shell(<StateMessage icon={Loader2} spin title="Checking in" />);
  }
  if (!team) return shell(<StateMessage icon={Loader2} spin title="Checking in" />);


  const s = toStateResponse({ session, counts: null, team, email: fb.email, deviceId, nowMs: now });
  const me = s.me!;
  const answer: AnswerView | null = me.answer ?? (pending && pending.key === questionKey ? { optionIndex: pending.optionIndex, isCorrect: null, pointsAwarded: null } : null);

  if (s.status === "ended") return shell(<LeaderboardView s={s} title="Final results" />);
  if (me.seat !== "mine") return shell(<SeatView me={me} onClaim={() => void claim()} claiming={claiming} />);
  if (s.status === "draft" || s.status === "lobby") return shell(<LobbyView s={s} />);

  const q = s.question;
  if (s.phase === "question" && q) {
    if (now < q.openedAt || !q.text) {
      return shell(<LeadIn openedAt={q.openedAt} now={now} label={`Question ${q.index + 1} of ${s.questionCount}`} />);
    }
    return shell(<QuestionView key={questionKey} s={s} now={now} answer={answer} onAnswer={submit} />);
  }
  if (s.phase === "results" && q) return shell(<ResultsView s={s} answer={answer} />);
  return shell(<StartingView s={s} />);
}
