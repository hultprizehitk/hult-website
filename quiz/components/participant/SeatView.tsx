"use client";

import { Loader2, Smartphone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/quiz/StateMessage";
import type { MeView } from "@/lib/quiz/types";

/** This phone is not the team's playing phone (spec U3/U4): one phone per team, never an error screen. */
export function SeatView({ me, onClaim, claiming }: { me: MeView; onClaim: () => void; claiming: boolean }) {
  const team = me.team!.name;
  if (me.seat === "reserved_me") return <StateMessage icon={Loader2} spin title="Connecting" />;
  if (me.seat === "other_device") {
    return (
      <StateMessage
        icon={Smartphone}
        title="Playing on another device"
        subtitle="Your account is active on another phone or browser"
        action={
          <Button size="lg" className="rounded-2xl px-6 font-bold" loading={claiming} onClick={onClaim}>
            Play here
          </Button>
        }
      />
    );
  }
  if (me.seat === "free") {
    return (
      <StateMessage
        icon={UserRound}
        title={`No one is playing for ${team}`}
        subtitle="One phone per team"
        action={
          <Button size="lg" className="rounded-2xl px-6 font-bold" loading={claiming} onClick={onClaim}>
            Play on this phone
          </Button>
        }
      />
    );
  }
  return <StateMessage icon={Smartphone} title={`Playing on ${me.takerName ?? "a teammate"}'s phone`} subtitle={`One phone per team. Follow ${team} on the screen.`} />;
}
