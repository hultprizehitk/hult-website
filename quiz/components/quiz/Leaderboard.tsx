"use client";

import { AnimatePresence, motion } from "motion/react";
import { User, Users } from "lucide-react";
import { AnimatedNumber } from "@/components/motion-primitives/animated-number";
import { cn } from "@/lib/utils";
import { formatMs } from "@/lib/format";
import type { Standing } from "@/lib/quiz/types";

/**
 * time = "total" (tie-break total), "last" (time on the question just graded; "-" when unanswered),
 * or "both" (question time + total time side-by-side).
 * playerNames: optional map of teamId -> playerName to show the player alongside the team.
 * displayMode = "team" (team name prominent, player sublabel) or "player" (player name prominent, team sublabel).
 * showHeader: render aligned column headers.
 */
export function Leaderboard({
  rows,
  highlightTeamId,
  large = false,
  time = "both",
  playerNames,
  displayMode = "team",
  showHeader = false,
  userStanding,
  totalQuestions,
}: {
  rows: Standing[];
  highlightTeamId?: string;
  large?: boolean;
  time?: "total" | "last" | "both";
  playerNames?: Map<string, string>;
  displayMode?: "team" | "player";
  showHeader?: boolean;
  userStanding?: Standing | null;
  totalQuestions?: number;
}) {
  if (rows.length === 0 && !userStanding) {
    return <p className="py-8 text-center font-mono text-xs text-neutral-500">No scores yet</p>;
  }

  const isUserInTop = highlightTeamId && rows.some((r) => r.teamId === highlightTeamId);
  const showPinnedUser = !isUserInTop && userStanding && userStanding.rank != null;

  const totalQ =
    totalQuestions && totalQuestions > 0
      ? totalQuestions
      : Math.max(...rows.map((r) => r.answeredCount || 0), userStanding?.answeredCount || 0, 1);

  const renderRow = (r: Standing, isHighlight: boolean) => {
    const rawPlayer = playerNames?.get(r.teamId) ?? r.playerName;
    const player = rawPlayer?.trim() || null;
    const primaryTitle = displayMode === "player" ? (player || r.teamName) : r.teamName;
    const subtitle = displayMode === "player" ? (player ? r.teamName : null) : player;

    return (
      <motion.li
        layout
        key={r.teamId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 shadow-2xl transition-all",
          large ? "py-4 text-2xl" : "py-3 text-sm",
          isHighlight ? "border-hult/60 bg-hult/15 shadow-hult/10" : "border-white/10 bg-[#0e0e12]",
        )}
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-xl font-black tabular-nums",
            large ? "size-12 text-xl" : "size-8 text-sm",
            r.rank === 1
              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
              : r.rank === 2
              ? "bg-slate-300 text-black shadow-md shadow-slate-300/20"
              : r.rank === 3
              ? "bg-amber-700 text-white shadow-md shadow-amber-700/20"
              : isHighlight
              ? "bg-hult text-white font-extrabold shadow-md shadow-hult/30"
              : "bg-white/[0.04] text-neutral-400",
          )}
        >
          {r.rank}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5 truncate">
            {displayMode === "player" && player && (
              <User className={cn("shrink-0 opacity-50", large ? "size-4" : "size-3")} />
            )}
            <span className={cn("truncate font-semibold", isHighlight && "text-white")}>{primaryTitle}</span>
          </div>
          {subtitle && (
            <div className="flex items-center gap-1 truncate font-mono text-white/45">
              {displayMode === "team" ? (
                <User className={cn("shrink-0 opacity-40", large ? "size-3.5" : "size-2.5")} />
              ) : (
                <Users className={cn("shrink-0 opacity-40", large ? "size-3.5" : "size-2.5")} />
              )}
              <span className={cn("truncate", large ? "text-sm" : "text-[10px]")}>{subtitle}</span>
            </div>
          )}
        </div>
        {time === "both" ? (
          <>
            <span
              className={cn(
                "shrink-0 font-mono tabular-nums text-right",
                large ? "w-24 text-base" : "w-14 text-[11px]",
                r.lastMs == null
                  ? "text-neutral-500"
                  : r.lastCorrect
                  ? "font-semibold text-emerald-300"
                  : "text-rose-400/80",
              )}
            >
              {r.lastMs == null ? "-" : formatMs(r.lastMs)}
            </span>
            <span
              className={cn(
                "shrink-0 font-mono text-neutral-400 tabular-nums text-right",
                large ? "w-24 text-base" : "w-14 text-[11px]",
              )}
            >
              {formatMs(r.totalTimeMs ?? 0)}
            </span>
          </>
        ) : time === "last" ? (
          <span
            className={cn(
              "shrink-0 font-mono tabular-nums text-right",
              large ? "w-24 text-xl" : "w-14 text-xs",
              r.lastMs == null
                ? "text-neutral-500"
                : r.lastCorrect
                ? "font-semibold text-emerald-300"
                : "text-rose-400/80",
            )}
          >
            {r.lastMs == null ? "-" : formatMs(r.lastMs)}
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 font-mono text-neutral-400 tabular-nums text-right",
              large ? "w-24 text-lg" : "w-14 text-xs",
            )}
          >
            {formatMs(r.totalTimeMs ?? 0)}
          </span>
        )}
        <span
          className={cn(
            "shrink-0 font-mono text-right tabular-nums",
            large ? "w-20 text-base" : "w-12 text-[11px]",
          )}
          title={`${r.answeredCount ?? 0} of ${totalQ} answered (${r.correctCount ?? 0} correct)`}
        >
          <span className="font-semibold text-neutral-200">{r.answeredCount ?? 0}</span>
          <span className="text-white/35">/{totalQ}</span>
        </span>
        <AnimatedNumber
          value={r.score}
          className={cn("shrink-0 text-right font-black tabular-nums", large ? "w-28 text-2xl" : "w-16 text-sm")}
          springOptions={{ bounce: 0, duration: 1200 }}
        />
      </motion.li>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {showHeader && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 font-mono uppercase tracking-wider text-white/40",
            large ? "text-xs pb-1" : "text-[10px] pb-1",
          )}
        >
          <span className={cn("shrink-0 text-center", large ? "w-12" : "w-8")}>#</span>
          <span className="min-w-0 flex-1">{displayMode === "player" ? "Player / Team" : "Team / Player"}</span>
          {time === "both" ? (
            <>
              <span className={cn("shrink-0 text-right", large ? "w-24" : "w-14")}>Q Time</span>
              <span className={cn("shrink-0 text-right", large ? "w-24" : "w-14")}>Total</span>
            </>
          ) : time === "last" ? (
            <span className={cn("shrink-0 text-right", large ? "w-24" : "w-14")}>Q Time</span>
          ) : (
            <span className={cn("shrink-0 text-right", large ? "w-24" : "w-14")}>Total</span>
          )}
          <span className={cn("shrink-0 text-right", large ? "w-20" : "w-12")}>Ans</span>
          <span className={cn("shrink-0 text-right", large ? "w-28" : "w-16")}>Score</span>
        </div>
      )}
      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {rows.map((r) => renderRow(r, r.teamId === highlightTeamId))}
        </AnimatePresence>
        {showPinnedUser && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2 px-2 py-0.5">
              <div className="h-px flex-1 bg-white/10" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-hult font-semibold">
                Your Team Standing
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            {renderRow(userStanding, true)}
          </div>
        )}
      </ol>
    </div>
  );
}
