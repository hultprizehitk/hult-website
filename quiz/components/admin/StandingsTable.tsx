"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle2, Clock, Search, Trophy, User, Zap } from "lucide-react";
import { Movement } from "@/components/quiz/Movement";
import { formatMs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Standing } from "@/lib/quiz/types";

type FilterMode = "all" | "top10" | "rank11";
type SortMode = "rank" | "score" | "time" | "name";

export function StandingsTable({
  rows,
  compact = false,
  playerNames,
  onViewAll,
}: {
  rows: Standing[];
  compact?: boolean;
  playerNames?: Map<string, string>;
  onViewAll?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("rank");

  // Summary statistics
  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const topTeam = rows[0];
    const totalScore = rows.reduce((acc, r) => acc + r.score, 0);
    const avgScore = Math.round(totalScore / rows.length);
    const totalTime = rows.reduce((acc, r) => acc + r.totalTimeMs, 0);
    const avgTime = Math.round(totalTime / rows.length);
    const totalAnswered = rows.reduce((acc, r) => acc + r.answeredCount, 0);
    const totalCorrect = rows.reduce((acc, r) => acc + r.correctCount, 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    return { topTeam, avgScore, avgTime, accuracy, totalAnswered, totalCorrect };
  }, [rows]);

  // Filter and sort
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;

    // Filter mode
    if (filter === "top10") {
      list = list.filter((r) => r.rank <= 10);
    } else if (filter === "rank11") {
      list = list.filter((r) => r.rank > 10);
    }

    // Search query
    if (q) {
      list = list.filter((r) => {
        const teamMatch = r.teamName.toLowerCase().includes(q);
        const codeMatch = r.teamCode ? r.teamCode.toLowerCase().includes(q) : false;
        const player = (r.playerName ?? playerNames?.get(r.teamId) ?? "").toLowerCase();
        const playerMatch = player.includes(q);
        const rankMatch = String(r.rank) === q.replace(/^#/, "");
        return teamMatch || codeMatch || playerMatch || rankMatch;
      });
    }

    // Sort mode
    const sorted = [...list];
    if (sort === "score") {
      sorted.sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs);
    } else if (sort === "time") {
      sorted.sort((a, b) => a.totalTimeMs - b.totalTimeMs || b.score - a.score);
    } else if (sort === "name") {
      sorted.sort((a, b) => a.teamName.localeCompare(b.teamName));
    } else {
      // rank default
      sorted.sort((a, b) => a.rank - b.rank);
    }

    return sorted;
  }, [rows, filter, query, sort, playerNames]);

  if (rows.length === 0) {
    return <div className="py-12 text-center font-mono text-xs text-neutral-500">No results yet</div>;
  }

  const rank11Count = rows.filter((r) => r.rank > 10).length;

  return (
    <div className="flex flex-col">
      {/* Quick summary stats in full mode */}
      {!compact && stats && (
        <div className="grid grid-cols-2 gap-3 border-b border-white/10 bg-white/[0.01] p-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#16161d] p-3 shadow-inner">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Total Ranked</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-white">{rows.length}</span>
              <span className="font-mono text-[11px] text-white/50">teams</span>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 shadow-inner">
            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300/60">Leader Score</span>
            <div className="mt-1 flex items-baseline gap-1.5 truncate">
              <span className="text-xl font-black text-amber-400">{stats.topTeam.score}</span>
              <span className="truncate font-mono text-[11px] text-amber-200/60">pts · {stats.topTeam.teamName}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3 shadow-inner">
            <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300/60">Avg Total Time</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-sky-300">{formatMs(stats.avgTime)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-inner">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/60">Accuracy</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-400">{stats.accuracy}%</span>
              <span className="font-mono text-[11px] text-emerald-200/50">({stats.totalCorrect}/{stats.totalAnswered})</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rank, team name, code, or player..."
            className="w-full rounded-xl border border-white/15 bg-[#16161d] py-1.5 pr-3 pl-8 text-xs text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[10px] text-white/40 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex rounded-xl border border-white/10 bg-[#16161d] p-0.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                filter === "all" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white",
              )}
            >
              All ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("top10")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                filter === "top10" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white",
              )}
            >
              Top 10
            </button>
            {rank11Count > 0 && (
              <button
                type="button"
                onClick={() => setFilter("rank11")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  filter === "rank11" ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white",
                )}
              >
                Rank 11+ ({rank11Count})
              </button>
            )}
          </div>

          {/* Sort Selector */}
          {!compact && (
            <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#16161d] px-2 py-1 text-xs text-white/60">
              <ArrowUpDown className="size-3 text-white/40" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="bg-transparent text-xs text-white/80 focus:outline-none cursor-pointer"
              >
                <option value="rank" className="bg-[#16161d]">Rank (1 &rarr; N)</option>
                <option value="score" className="bg-[#16161d]">Score (High &rarr; Low)</option>
                <option value="time" className="bg-[#16161d]">Time (Fast &rarr; Slow)</option>
                <option value="name" className="bg-[#16161d]">Name (A &rarr; Z)</option>
              </select>
            </div>
          )}

          {compact && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              View all {rows.length} ranks &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={cn("overflow-x-auto", compact && "max-h-[460px] overflow-y-auto")}>
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-white/10 bg-[#0e0e12] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              <th className="w-16 px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Team &amp; Player</th>
              <th className="px-4 py-3 text-right font-medium">Score</th>
              <th className="px-4 py-3 text-right font-medium">Last Q</th>
              <th className="px-4 py-3 text-right font-medium">Total Time</th>
              <th className="px-4 py-3 text-right font-medium">Correct</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-mono text-xs text-neutral-400">
                  No teams match your search or filter
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const player = r.playerName ?? playerNames?.get(r.teamId);
                const isTop1 = r.rank === 1;
                const isTop2 = r.rank === 2;
                const isTop3 = r.rank === 3;
                const isTop10 = r.rank <= 10;

                return (
                  <tr key={r.teamId} className="transition-colors hover:bg-white/[0.02]">
                    {/* Rank with styling */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-lg font-black text-xs tabular-nums",
                            isTop1
                              ? "bg-amber-400 text-black shadow-sm shadow-amber-400/30"
                              : isTop2
                              ? "bg-slate-300 text-black shadow-sm shadow-slate-300/20"
                              : isTop3
                              ? "bg-amber-700 text-white shadow-sm shadow-amber-700/20"
                              : isTop10
                              ? "bg-white/10 text-white font-bold"
                              : "bg-white/[0.04] text-neutral-400 font-mono",
                          )}
                        >
                          {r.rank}
                        </span>
                        <Movement rank={r.rank} prevRank={r.prevRank} />
                      </div>
                    </td>

                    {/* Team Name, Team Code, Player */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white tracking-tight text-xs sm:text-sm">
                            {r.teamName}
                          </span>
                          {r.teamCode && (
                            <span className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-rose-400">
                              {r.teamCode}
                            </span>
                          )}
                          {!isTop10 && (
                            <span className="font-mono text-[10px] text-white/40">
                              Rank #{r.rank}
                            </span>
                          )}
                        </div>
                        {player && (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-white/50">
                            <User className="size-2.5 text-white/30" />
                            <span className="truncate">{player}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-black tabular-nums text-white">{r.score}</span>
                      <span className="block font-mono text-[10px] text-white/40">pts</span>
                    </td>

                    {/* Last Q Response Time */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.lastMs == null ? (
                        <span className="text-neutral-500">-</span>
                      ) : (
                        <span className={r.lastCorrect ? "font-semibold text-emerald-400" : "text-rose-400"}>
                          {formatMs(r.lastMs)}
                        </span>
                      )}
                      {r.lastCorrect != null && (
                        <span className="block text-[9px] uppercase tracking-wider text-white/40">
                          {r.lastCorrect ? "Correct" : "Missed"}
                        </span>
                      )}
                    </td>

                    {/* Total Response Time */}
                    <td className="px-4 py-3 text-right font-mono text-neutral-300 tabular-nums">
                      <span>{formatMs(r.totalTimeMs)}</span>
                    </td>

                    {/* Correct / Total Answered */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <span className="font-semibold text-emerald-400">{r.correctCount}</span>
                      <span className="text-white/30">/{r.answeredCount}</span>
                      {r.answeredCount > 0 && (
                        <span className="block text-[10px] text-white/40">
                          {Math.round((r.correctCount / r.answeredCount) * 100)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count indicator */}
      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.01] px-4 py-2 text-[11px] font-mono text-white/40">
        <span>
          Showing {filteredRows.length} of {rows.length} ranked teams
        </span>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-white/60 hover:text-white transition-colors"
          >
            Reset filter
          </button>
        )}
      </div>
    </div>
  );
}
