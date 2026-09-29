"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, EyeOff, ListFilter, Search, Users, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResultBar } from "@/components/quiz/ResultBar";
import { formatMs, optionLetter } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TeamDoc } from "@/lib/quiz/fs-types";
import type { AdminSessionSummary, QuestionLite } from "@/lib/quiz/types";

interface TeamResponseItem {
  teamId: string;
  teamName: string;
  teamCode: string;
  playerName: string;
  playerEmail: string | null;
  answered: boolean;
  optionIndex: number | null;
  responseMs: number | null;
  isCorrect: boolean | null;
  deviceId: string | null;
  clickRank?: number | null;
}

/**
 * Live Question & Real-Time Responses Inspector for Organizer.
 * Shows live option distributions and detailed breakdown of who clicked what and at what time.
 */
export function CurrentQuestionCard({
  session: s,
  question: q,
  distribution,
  teams = [],
}: {
  session: AdminSessionSummary;
  question: QuestionLite;
  distribution: number[] | null;
  teams?: TeamDoc[];
}) {
  const [peek, setPeek] = useState(false);
  const [viewMode, setViewMode] = useState<"options" | "responses">("options");
  const [selectedFilter, setSelectedFilter] = useState<number | "all" | "unanswered">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const revealed = s.phase === "results" || s.status === "ended";
  const showCorrect = revealed || peek;
  const total = (distribution ?? []).reduce((a, b) => a + b, 0);

  // Compute detailed live response state for every team
  const teamResponses: TeamResponseItem[] = useMemo(() => {
    return teams
      .filter((t) => t.eligible && !!t.checkedInAt)
      .map((t) => {
        const current = t.currentAnswer?.qid === q.id ? t.currentAnswer : null;
        const history = t.perQuestion?.[q.id] ?? null;
        const optionIndex = current ? current.optionIndex : (history?.optionIndex ?? null);
        const responseMs = current ? current.responseMs : (history?.ms ?? null);
        const isCorrect = history ? history.correct : optionIndex !== null && q.correctIndex !== null ? optionIndex === q.correctIndex : null;
        const playerName = t.members.find((m) => m.email.toLowerCase() === t.takerEmail?.toLowerCase())?.name ?? t.takerEmail ?? "Team Member";

        return {
          teamId: t.teamId,
          teamName: t.teamName,
          teamCode: t.teamCode,
          playerName,
          playerEmail: t.takerEmail,
          answered: optionIndex !== null,
          optionIndex,
          responseMs,
          isCorrect,
          deviceId: t.deviceId,
        };
      })
      .sort((a, b) => {
        if (a.answered && !b.answered) return -1;
        if (!a.answered && b.answered) return 1;
        if (a.responseMs != null && b.responseMs != null) return a.responseMs - b.responseMs;
        return a.teamName.localeCompare(b.teamName);
      })
      .map((item, idx) => ({
        ...item,
        clickRank: item.answered ? idx + 1 : null,
      }));
  }, [teams, q.id, q.correctIndex]);

  const answeredList = useMemo(() => teamResponses.filter((r) => r.answered), [teamResponses]);
  const unansweredList = useMemo(() => teamResponses.filter((r) => !r.answered), [teamResponses]);

  const fastestAnswer = useMemo(() => {
    return answeredList.length > 0 && answeredList[0].responseMs != null ? answeredList[0] : null;
  }, [answeredList]);

  const avgResponseTimeMs = useMemo(() => {
    const list = answeredList.filter((r) => r.responseMs != null);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, cur) => acc + (cur.responseMs ?? 0), 0);
    return Math.round(sum / list.length);
  }, [answeredList]);

  // Filtered responses for the live table
  const filteredResponses = useMemo(() => {
    let list = teamResponses;

    if (selectedFilter === "unanswered") {
      list = unansweredList;
    } else if (typeof selectedFilter === "number") {
      list = list.filter((r) => r.optionIndex === selectedFilter);
    }

    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.teamName.toLowerCase().includes(qLower) ||
          r.teamCode.toLowerCase().includes(qLower) ||
          r.playerName.toLowerCase().includes(qLower) ||
          (r.playerEmail && r.playerEmail.toLowerCase().includes(qLower)),
      );
    }

    return list;
  }, [teamResponses, unansweredList, selectedFilter, searchQuery]);

  return (
    <div className="rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl flex flex-col gap-4">
      {/* Top Header & Peeking */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-white/60 tabular-nums">
            Q{s.currentIndex + 1} &middot; {q.points} pts &middot; {q.timeLimitSec}s
          </p>
          <span className="text-white/20">&bull;</span>
          <span className="font-mono text-xs text-sky-400 font-semibold">
            {answeredList.length} / {teamResponses.length} answered ({teamResponses.length > 0 ? Math.round((answeredList.length / teamResponses.length) * 100) : 0}%)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!revealed && (
            <Button variant="ghost" size="xs" onClick={() => setPeek((p) => !p)} aria-pressed={peek} className="text-xs">
              {peek ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {peek ? "Hide answer" : "Peek answer"}
            </Button>
          )}

          {/* View toggle */}
          <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("options")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                viewMode === "options" ? "bg-white text-black shadow" : "text-white/60 hover:text-white",
              )}
            >
              Options
            </button>
            <button
              type="button"
              onClick={() => setViewMode("responses")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                viewMode === "responses" ? "bg-white text-black shadow" : "text-white/60 hover:text-white",
              )}
            >
              <Zap className="size-3 text-amber-400" />
              <span>Clicks ({answeredList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Text */}
      <p className="break-words text-lg font-bold tracking-tight text-white">{q.text || "Loading..."}</p>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl border border-white/10 bg-[#16161d] p-3 text-xs font-mono">
        <div>
          <span className="text-white/40 block text-[10px] uppercase">Responses</span>
          <span className="font-bold text-white text-sm">
            {answeredList.length} <span className="text-white/40 font-normal">/ {teamResponses.length}</span>
          </span>
        </div>
        <div>
          <span className="text-white/40 block text-[10px] uppercase">Avg Speed</span>
          <span className="font-bold text-sky-400 text-sm">{answeredList.length > 0 ? formatMs(avgResponseTimeMs) : "-"}</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-white/40 block text-[10px] uppercase">Fastest Click</span>
          <span className="font-bold text-emerald-400 text-sm truncate block" title={fastestAnswer ? `${fastestAnswer.teamName} (${formatMs(fastestAnswer.responseMs!)})` : ""}>
            {fastestAnswer && fastestAnswer.responseMs != null ? `${formatMs(fastestAnswer.responseMs)} · ${fastestAnswer.teamName}` : "-"}
          </span>
        </div>
      </div>

      {/* Mode 1: Options Distribution Bars */}
      {viewMode === "options" && (
        <div className="flex flex-col gap-2">
          {q.options.map((o, i) => {
            const count = distribution?.[i] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isCorrect = showCorrect && i === q.correctIndex;
            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedFilter(i);
                  setViewMode("responses");
                }}
                className="cursor-pointer group"
                title="Click to view all teams that chose this option"
              >
                <ResultBar index={i} text={o} count={count} total={total} correct={isCorrect ? true : null} />
                <div className="flex items-center justify-between text-[11px] font-mono text-white/40 px-2 pt-0.5 group-hover:text-sky-300 transition-colors">
                  <span>Option {optionLetter(i)}</span>
                  <span>{count} teams ({pct}%) &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Live Clicks & Timing Inspector Table */}
      {viewMode === "responses" && (
        <div className="flex flex-col gap-3">
          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter("all")}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[11px] transition-all shrink-0",
                  selectedFilter === "all" ? "bg-white text-black font-bold" : "bg-white/5 text-white/60 hover:bg-white/10",
                )}
              >
                All ({teamResponses.length})
              </button>
              {q.options.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedFilter(i)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[11px] transition-all shrink-0",
                    selectedFilter === i
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-white/5 text-white/60 hover:bg-white/10",
                  )}
                >
                  {optionLetter(i)} ({distribution?.[i] ?? 0})
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedFilter("unanswered")}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[11px] transition-all shrink-0",
                  selectedFilter === "unanswered" ? "bg-amber-500 text-black font-bold" : "bg-white/5 text-white/60 hover:bg-white/10",
                )}
              >
                Pending ({unansweredList.length})
              </button>
            </div>

            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/40 pointer-events-none" />
              <Input
                placeholder="Search team / taker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-7 rounded-xl"
              />
            </div>
          </div>

          {/* Responses Table */}
          <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#121218] divide-y divide-white/5">
            {filteredResponses.length === 0 ? (
              <div className="p-8 text-center text-white/40 font-mono text-xs">
                No teams match the filter.
              </div>
            ) : (
              filteredResponses.map((r, idx) => {
                const optLetter = r.optionIndex != null ? optionLetter(r.optionIndex) : null;
                const optText = r.optionIndex != null ? q.options[r.optionIndex] : null;
                const isFast = r.responseMs != null && r.responseMs < 2000;

                return (
                  <div key={r.teamId} className="flex items-center justify-between gap-3 p-2.5 hover:bg-white/[0.02] transition-colors">
                    {/* Rank & Team */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs text-white/30 tabular-nums w-6 text-right shrink-0">
                        {r.clickRank != null ? `#${r.clickRank}` : "-"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-white">{r.teamName}</p>
                          <span className="font-mono text-[10px] text-white/40 uppercase">({r.teamCode})</span>
                        </div>
                        <p className="truncate font-sans text-[11px] text-white/50">{r.playerName}</p>
                      </div>
                    </div>

                    {/* Option Chosen & Time */}
                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      {r.answered && optLetter ? (
                        <>
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold",
                                showCorrect && r.isCorrect === true
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : showCorrect && r.isCorrect === false
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-white/10 text-white",
                              )}
                              title={optText ?? undefined}
                            >
                              Opt {optLetter}
                              {showCorrect && r.isCorrect === true && <CheckCircle2 className="size-3 text-emerald-400" />}
                              {showCorrect && r.isCorrect === false && <XCircle className="size-3 text-rose-400" />}
                            </span>
                          </div>

                          <div className="w-16 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums font-bold",
                                isFast ? "text-amber-300" : "text-sky-300",
                              )}
                            >
                              {isFast && <Zap className="size-2.5 text-amber-400" />}
                              {r.responseMs != null ? formatMs(r.responseMs) : "-"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="font-mono text-[11px] text-white/30 italic">Answering...</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
