"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Loader2, Lock, LogIn, SearchX, ShieldAlert, Smartphone, UserX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { QuizShell } from "@/components/quiz/QuizShell";
import { StateMessage } from "@/components/quiz/StateMessage";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { LeadIn } from "@/components/quiz/LeadIn";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { useDocData } from "@/hooks/useFirestore";
import { useServerClock } from "@/hooks/useServerClock";
import { useServerNow } from "@/hooks/useServerNow";
import { api, ApiError } from "@/lib/client/api";
import { getDeviceId } from "@/lib/client/device";
import { toStateResponse } from "@/lib/quiz/client-state";
import { paths, type SessionDoc, type TeamDoc } from "@/lib/quiz/fs-types";
import type { AnswerView } from "@/lib/quiz/types";
import { LobbyView } from "./LobbyView";
import { QuestionView } from "./QuestionView";
import { RevealView } from "./RevealView";
import { LeaderboardView } from "./LeaderboardView";
import { ComingSoonView } from "./ComingSoonView";

const backLink = (
  <Link href="/" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
    Back
  </Link>
);

interface JoinOk {
  teamId: string;
  role: "taker" | "teammate";
}

/**
 * Phone app. Listens to exactly two Firestore docs (PRD 9.2.2): the public session and the user's own team.
 * Everything that changes data goes through the API (join, taker, answer).
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
  const teamLive = useDocData<TeamDoc>(join && fb.status === "signed-in" ? paths.team(code, join.teamId) : null);
  const team = teamLive.data;

  // Join = check in + bind device. Retried once per distinct situation: new login, session opening,
  // check-in toggling, or the taker losing their device binding (admin reset / taker change).
  const needsBind = !!team && !!fb.email && team.takerEmail === fb.email && !team.deviceId;
  const joinKey =
    fb.status === "signed-in" && session
      ? `${fb.email}:${join ? "joined" : `${session.status}:${session.checkinOpen}`}:${needsBind ? `bind:${team?.takerEmail}` : ""}`
      : null;
  const attempted = useRef<string | null>(null);
  useEffect(() => {
    if (!joinKey || attempted.current === joinKey) return;
    if (join && !needsBind) return;
    attempted.current = joinKey;
    api<JoinOk & { deviceOk: boolean }>(`/api/s/${code}/join`, { body: { deviceId } })
      .then((r) => {
        setJoin({ teamId: r.teamId, role: r.role });
        setJoinError(null);
      })
      .catch((e: ApiError) => setJoinError(e));
  }, [joinKey, join, needsBind, code, deviceId]);

  // Optimistic answer until the team doc reflects it.
  const [pending, setPending] = useState<{ questionId: string; optionIndex: number } | null>(null);
  const submit = async (optionIndex: number) => {
    const questionId = session?.current?.id;
    if (!questionId) return;
    setPending({ questionId, optionIndex });
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

  const shell = (children: React.ReactNode) => (
    <QuizShell>
      {children}
      <ReconnectingPill show={sessionLive.offline} />
    </QuizShell>
  );

  if (!valid) return shell(<StateMessage icon={SearchX} title="Invalid code" action={backLink} />);
  if (sessionLive.loading || fb.status === "loading") return shell(<StateMessage icon={Loader2} spin title="Connecting" />);
  if (!session) return shell(<StateMessage icon={SearchX} title="Session not found" action={backLink} />);
  if (fb.status === "error") {
    return shell(<StateMessage icon={ShieldAlert} title="Could not connect" subtitle={fb.error ?? undefined} action={<button type="button" onClick={fb.retry} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>Retry</button>} />);
  }
  if (fb.status === "anonymous") {
    return shell(
      <StateMessage
        icon={LogIn}
        title="Sign in to join"
        subtitle={fb.error ?? "College account required"}
        action={
          <Link href={`/signin?callbackUrl=${encodeURIComponent(code === "470009" ? "/quiz" : `/s/${code}`)}`} className={buttonVariants({ size: "lg", className: "rounded-2xl px-6 font-bold" })}>
            Sign in
          </Link>
        }
      />,
    );
  }

  const switchAccount = (
    <Link href={`/signin?callbackUrl=${encodeURIComponent(code === "470009" ? "/quiz" : `/s/${code}`)}`} className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
      Switch account
    </Link>
  );
  if (!join) {
    const c = joinError?.code;
    if (c === "team_already_active") {
      return shell(
        <StateMessage
          icon={Smartphone}
          title="Device limit reached"
          subtitle={joinError?.message || "A teammate is already playing on another device. Only 1 player per team is allowed. They must sign out to hand over the device."}
          action={switchAccount}
        />
      );
    }
    if (c === "not_registered") return shell(<StateMessage icon={UserX} title="No team found" subtitle={`${fb.email} is not on a registered team for this event`} action={switchAccount} />);
    if (c === "ineligible") return shell(<StateMessage icon={ShieldAlert} title="Team not eligible" subtitle="Team must be confirmed and submitted" action={switchAccount} />);
    if (c === "checkin_closed") return shell(<StateMessage icon={Lock} title="Check-in closed" subtitle="See an organizer" />);
    if (c === "invalid_state") return shell(<StateMessage icon={Clock} title={session.status === "ended" ? "Quiz has ended" : "Not open yet"} subtitle="This page updates on its own" />);
    if (joinError) return shell(<StateMessage icon={ShieldAlert} title={joinError.message} />);
    return shell(<StateMessage icon={Loader2} spin title="Checking in" />);
  }
  if (!team) return shell(<StateMessage icon={Loader2} spin title="Checking in" />);

  const s = toStateResponse({ session, counts: null, team, email: fb.email, deviceId, nowMs: now });
  const me = s.me!;
  const answer: AnswerView | null =
    me.answer ?? (pending && pending.questionId === s.question?.id ? { optionIndex: pending.optionIndex, isCorrect: null, pointsAwarded: null } : null);

  if (me.role === "taker" && me.deviceBound && !me.deviceOk && s.status !== "ended") {
    return shell(<StateMessage icon={Smartphone} title="Active on another device" subtitle="Ask an organizer to reset" />);
  }
  if (s.status === "ended") return shell(<LeaderboardView s={s} title="Final results" />);
  if (s.status === "draft" || s.status === "lobby") return shell(<LobbyView s={s} code={code} />);

  const q = s.question;
  if (s.phase === "question" && q) {
    if (now < q.openedAt || !q.text) {
      return shell(<LeadIn openedAt={q.openedAt} now={now} label={`Question ${q.index + 1} of ${s.questionCount}`} />);
    }
    return shell(<QuestionView s={s} now={now} answer={answer} onAnswer={submit} />);
  }
  if (s.phase === "reveal" && q) return shell(<RevealView s={s} answer={answer} />);
  if (s.phase === "leaderboard") return shell(<LeaderboardView s={s} title="Leaderboard" />);
  if (s.status === "live") return shell(<ComingSoonView s={s} />);
  return shell(<StateMessage icon={Loader2} spin title="Waiting for host" />);
}
