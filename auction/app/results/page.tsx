"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react";
import { TeamScoreCalculation } from "@/lib/auction-data";
import { DotPattern } from "@/components/ui/DotPattern";

export default function ResultsPage() {
  const [standings, setStandings] = useState<TeamScoreCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auction/session");
      const data = await res.json();
      if (data.success && data.liveStandings) {
        setStandings(data.liveStandings);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const firstPlace = standings[0];
  const secondPlace = standings[1];
  const thirdPlace = standings[2];

  return (
    <div className="relative min-h-screen bg-[#000000] text-white p-6 md:p-8 font-sans overflow-hidden">
      <DotPattern className="text-white/[0.03]" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#f20089]/10 rounded-full blur-[140px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/viewer"
              className="size-8 rounded-xl border border-white/10 bg-[#0e0e12] flex items-center justify-center text-white/50 hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <span className="font-mono text-[10px] text-amber-400 uppercase tracking-widest block font-bold">
                FINAL EVALUATION
              </span>
              <h1 className="text-xl md:text-2xl font-black text-white">Winners Podium</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchResults}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#0e0e12] text-white/80 border border-white/10 flex items-center gap-1.5"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              <span>Recalculate</span>
            </button>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase bg-[#f20089] text-white"
            >
              Console
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-xs flex items-center gap-2">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Podium Top 3 */}
        {standings.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 relative rounded-3xl border border-white/10 bg-[#0e0e12] p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-slate-300 text-black font-black text-base flex items-center justify-center">
                    2
                  </div>
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider font-bold">
                    SILVER
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">{secondPlace.teamName}</h3>
                  <span className="font-mono text-[10px] text-white/40">#{secondPlace.quizRank} &bull; {secondPlace.teamCode}</span>
                </div>

                <div className="p-3 rounded-2xl bg-black border border-white/10 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Points:</span>
                    <strong className="text-emerald-400 font-bold">{secondPlace.totalMatchPoints} Pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Balance:</span>
                    <strong className="text-white">₹{secondPlace.finalBalance} Cr</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">State:</span>
                    <strong className="text-blue-400">{secondPlace.ownedStateName}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2 relative rounded-3xl border border-amber-400/50 bg-[#0e0e12] p-6 flex flex-col justify-between scale-105 z-10 shadow-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-2xl bg-amber-400 text-black font-black text-xl flex items-center justify-center">
                    1
                  </div>
                  <Trophy className="size-6 text-amber-400" />
                </div>

                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{firstPlace.teamName}</h2>
                  <span className="font-mono text-xs text-white/50">#{firstPlace.quizRank} &bull; {firstPlace.teamCode}</span>
                </div>

                <div className="p-4 rounded-2xl bg-black border border-amber-400/20 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Points:</span>
                    <strong className="text-amber-400 text-lg font-black">{firstPlace.totalMatchPoints} Pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Balance:</span>
                    <strong className="text-emerald-400 font-bold">₹{firstPlace.finalBalance} Cr</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">State:</span>
                    <strong className="text-blue-400">{firstPlace.ownedStateName}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  {firstPlace.matchedSectors.map((m, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {m.industryName} (+{m.points})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 relative rounded-3xl border border-white/10 bg-[#0e0e12] p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-amber-700 text-white font-black text-base flex items-center justify-center">
                    3
                  </div>
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider font-bold">
                    BRONZE
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">{thirdPlace.teamName}</h3>
                  <span className="font-mono text-[10px] text-white/40">#{thirdPlace.quizRank} &bull; {thirdPlace.teamCode}</span>
                </div>

                <div className="p-3 rounded-2xl bg-black border border-white/10 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Points:</span>
                    <strong className="text-emerald-400 font-bold">{thirdPlace.totalMatchPoints} Pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Balance:</span>
                    <strong className="text-white">₹{thirdPlace.finalBalance} Cr</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">State:</span>
                    <strong className="text-blue-400">{thirdPlace.ownedStateName}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Table */}
        <div className="rounded-3xl border border-white/10 bg-[#0e0e12] p-5 space-y-3">
          <span className="font-mono text-xs font-bold text-white/50 uppercase tracking-wider block">
            Rankings
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase text-white/40 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Industries</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((team) => (
                  <tr key={team.teamId} className={!team.isEligible ? "opacity-50" : ""}>
                    <td className="py-2.5 px-3 font-bold">#{team.rank}</td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      <span>{team.teamName}</span>
                      <span className="text-[10px] text-white/40 ml-1.5 font-normal">#{team.quizRank}</span>
                    </td>
                    <td className="py-2.5 px-3 text-blue-400">{team.ownedStateName}</td>
                    <td className="py-2.5 px-3">
                      {team.matchedSectors.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {team.matchedSectors.map((m, idx) => (
                            <span key={idx} className="text-[9px] px-1 py-0.5 rounded bg-white/[0.05] text-white/80">
                              {m.industryName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/30 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={team.finalBalance < 35 ? "text-rose-400" : "text-emerald-400"}>
                        ₹{team.finalBalance} Cr
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-right text-sm text-white">
                      {team.totalMatchPoints}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {team.isEligible ? (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10">
                          Qualified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10">
                          DQ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
