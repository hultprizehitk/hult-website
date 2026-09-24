"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Lock, LogIn, SearchX, ShieldAlert, Smartphone, UserX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { QuizShell } from "@/components/quiz/QuizShell";
import { StateMessage } from "@/components/quiz/StateMessage";
import { ReconnectingPill } from "@/components/quiz/ReconnectingPill";
import { LeadIn } from "@/components/quiz/LeadIn";
import { usePolling } from "@/hooks/usePolling";
import { useServerNow } from "@/hooks/useServerNow";
import { api, ApiError } from "@/lib/client/api";
import { getDeviceId } from "@/lib/client/device";
import type { AnswerView, StateResponse } from "@/lib/quiz/types";
import { LobbyView } from "./LobbyView";
import { QuestionView } from "./QuestionView";
import { RevealView } from "./RevealView";
import { LeaderboardView } from "./LeaderboardView";

const backLink = (
  <Link href="/" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
    Back
  </Link>
);

export function ParticipantApp({ code }: { code: string }) {
  const valid = /^\d{6}$/.test(code);
  const [deviceId] = useState(() => (typeof window === "undefined" ? "" : getDeviceId()));
  const poll = usePolling<StateResponse>(valid && deviceId ? `/api/s/${code}/state?d=${deviceId}` : null);
  const now = useServerNow(poll.serverNow);
  const s = poll.data;
  const { refresh } = poll;

  // Check in / bind device automatically; retried at most once per server state version.
  const [joinError, setJoinError] = useState<string | null>(null);
  const attempted = useRef<string | null>(null);
  const me = s?.me;
  const registered = me?.role === "taker" || me?.role === "teammate";
  const needsCheckin = registered && !me!.checkedIn && s!.checkinOpen;
  const needsDevice = registered && me!.checkedIn && me!.role === "taker" && !me!.deviceBound;
  const joinKey = needsCheckin || needsDevice ? `${me!.role}:${me!.checkedIn}:${me!.deviceBound}:${s!.stateVersion}` : null;

  useEffect(() => {
    if (!joinKey || attempted.current === joinKey) return;
    attempted.current = joinKey;
    api(`/api/s/${code}/join`, { body: { deviceId } })
      .then(() => {
        setJoinError(null);
        return refresh();
      })
      .catch((e: ApiError) => setJoinError(e.message));
  }, [joinKey, code, deviceId, refresh]);

  // Optimistic answer until the server state includes it.
  const [pending, setPending] = useState<{ questionId: string; optionIndex: number } | null>(null);
  const submit = async (optionIndex: number) => {
    const questionId = s?.question?.id;
    if (!questionId) return;
    setPending({ questionId, optionIndex });
    const body = { questionId, optionIndex, deviceId };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await api(`/api/s/${code}/answer`, { body });
        await refresh();
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

  const answer: AnswerView | null =
    me?.answer ??
    (pending && pending.questionId === s?.question?.id
      ? { optionIndex: pending.optionIndex, isCorrect: null, pointsAwarded: null }
      : null);

  const shell = (children: React.ReactNode) => (
    <QuizShell code={valid ? code : undefined}>
      {children}
      <ReconnectingPill show={poll.reconnecting} />
    </QuizShell>
  );

  if (!valid) return shell(<StateMessage icon={SearchX} title="Invalid code" action={backLink} />);
  if (!s) {
    if (poll.error?.code === "not_found") return shell(<StateMessage icon={SearchX} title="Session not found" action={backLink} />);
    return shell(<StateMessage icon={Loader2} spin title="Connecting" />);
  }
  if (!me) {
    return shell(
      <StateMessage
        icon={LogIn}
        title="Sign in to join"
        subtitle="College account required"
        action={
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(`/s/${code}`)}`}
            className={buttonVariants({ size: "lg", className: "rounded-2xl px-6 font-bold" })}
          >
            Sign in
          </Link>
        }
      />,
    );
  }
  const switchAccount = (
    <Link
      href={`/signin?callbackUrl=${encodeURIComponent(`/s/${code}`)}`}
      className={buttonVariants({ variant: "outline", className: "rounded-full" })}
    >
      Switch account
    </Link>
  );
  if (me.role === "unregistered") {
    return shell(<StateMessage icon={UserX} title="No team found" subtitle={`${me.email} is not on a registered team for this event`} action={switchAccount} />);
  }
  if (me.role === "ineligible") {
    return shell(<StateMessage icon={ShieldAlert} title="Team not eligible" subtitle="Team must be confirmed and submitted" action={switchAccount} />);
  }
  if (!me.checkedIn) {
    if (joinError) return shell(<StateMessage icon={ShieldAlert} title={joinError} />);
    if (!s.checkinOpen) return shell(<StateMessage icon={Lock} title="Check-in closed" subtitle="See an organizer" />);
    return shell(<StateMessage icon={Loader2} spin title="Checking in" />);
  }
  if (me.role === "taker" && me.deviceBound && !me.deviceOk && s.status !== "ended") {
    return shell(<StateMessage icon={Smartphone} title="Active on another device" subtitle="Ask an organizer to reset" />);
  }
  if (s.status === "ended") return shell(<LeaderboardView s={s} title="Final results" />);
  if (s.status === "draft" || s.status === "lobby") return shell(<LobbyView s={s} code={code} onChanged={refresh} />);

  const q = s.question;
  if (s.phase === "question" && q) {
    // !q.text: the client clock says the lead-in is over but the last poll predates openedAt.
    if (now < q.openedAt || !q.text) {
      return shell(<LeadIn openedAt={q.openedAt} now={now} label={`Question ${q.index + 1} of ${s.questionCount}`} />);
    }
    return shell(<QuestionView s={s} now={now} answer={answer} onAnswer={submit} />);
  }
  if (s.phase === "reveal" && q) return shell(<RevealView s={s} answer={answer} />);
  if (s.phase === "leaderboard") return shell(<LeaderboardView s={s} title="Leaderboard" />);
  return shell(<StateMessage icon={Loader2} spin title="Waiting for host" />);
}
