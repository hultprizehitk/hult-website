"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Users,
  MapPin,
  Boxes,
  Wallet,
  TrendingUp,
  History,
} from "lucide-react";
import { DotPattern } from "@/components/ui/DotPattern";

interface TeamView {
  teamName: string;
  teamCode: string;
  quizRank: number;
  currentBalance: number;
  startingBudget: number;
  safeMax: number;
  status: "active" | "disqualified";
  ownedStateId: string | null;
  ownedStateName: string | null;
  stateSectors: { industryId: string; industryName: string; points: number; priority: string }[];
}

interface IndustryView {
  id: string;
  name: string;
  matched: boolean;
  points: number;
  priority: string | null;
}

interface Purchase {
  lotId: string;
  lotName: string;
  type: string;
  price: number;
  timestamp: string;
}

interface ActivityRow {
  _id: string;
  action: string;
  detail: string;
  amount: number | null;
  createdAt: string;
}

interface ScoreView {
  rank: number;
  totalMatchPoints: number;
  finalBalance: number;
  isEligible: boolean;
  disqualificationReason?: string;
  matchedSectors: { industryId: string; industryName: string; points: number }[];
  unmatchedIndustryIds: string[];
}

const ACTION_STYLE: Record<string, { label: string; cls: string }> = {
  allot: { label: "SOLD", cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  revoke: { label: "UNDONE", cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  disqualify: { label: "DQ", cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  reinstate: { label: "BACK", cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  init: { label: "RESET", cls: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
};

export default function TeamPortalPage() {
  const [code, setCode] = useState("");
  const [team, setTeam] = useState<TeamView | null>(null);
  const [score, setScore] = useState<ScoreView | null>(null);
  const [industries, setIndustries] = useState<IndustryView[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (raw: string) => {
    const clean = raw.replace(/^#/, "").trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auction/team/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lookup failed.");
      }
      setTeam(data.team);
      setScore(data.score);
      setIndustries(data.industries || []);
      setPurchases(data.purchases || []);
      setActivity(data.activity || []);
    } catch (err: any) {
      setTeam(null);
      setScore(null);
      setError(err.message || "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const spend = team ? team.startingBudget - team.currentBalance : 0;
  const belowReserve = team ? team.safeMax <= 0 : false;

  return (
    <div className="relative min-h-screen bg-[#000000] text-white font-['Helvetica',Arial,sans-serif] overflow-hidden">
      <DotPattern className="text-white/[0.03]" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#f20089]/10 rounded-full blur-[140px]" />

      <div className="relative z-10 max-w-5xl mx-auto p-5 md:p-8 space-y-5">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="size-8 rounded-xl border border-white/10 bg-[#0e0e12] flex items-center justify-center text-white/50 hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <span className="font-mono text-[10px] text-[#f20089] uppercase tracking-widest block font-bold">
                Team Portal
              </span>
              <h1 className="text-lg md:text-xl font-black">Your Auction Status</h1>
            </div>
          </div>
          <Link
            href="/viewer"
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#0e0e12] border border-white/10 text-white/80 hover:bg-white/[0.08]"
          >
            Projector
          </Link>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(code);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="HULT-XXXX"
              maxLength={24}
              autoCapitalize="characters"
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#0e0e12] border border-white/15 focus:border-[#f20089] focus:outline-none text-sm font-mono font-bold text-white placeholder:text-white/20 placeholder:font-normal tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider bg-[#f20089] hover:bg-[#d00075] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="size-3.5 animate-spin" /> : null}
            <span>Track</span>
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono text-xs flex items-center gap-2">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!team && !error && (
          <div className="py-16 text-center font-mono text-xs text-white/30">
            Enter your team code to view your balance, assets and rank.
          </div>
        )}

        {team && (
          <>
            {/* Identity + Verdict */}
            <div className="p-5 rounded-3xl border border-white/10 bg-[#0e0e12] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                    <span>#{team.quizRank}</span>
                    <span>&bull;</span>
                    <span>{team.teamCode}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white truncate">{team.teamName}</h2>
                </div>

                {score && (
                  <div
                    className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 ${
                      score.isEligible
                        ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                        : "text-rose-300 bg-rose-500/10 border-rose-500/30"
                    }`}
                  >
                    {score.isEligible ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                    <span>{score.isEligible ? "In Evaluation" : "Not Eligible"}</span>
                  </div>
                )}
              </div>

              {score && !score.isEligible && score.disqualificationReason && (
                <p className="font-mono text-[11px] text-rose-300">{score.disqualificationReason}</p>
              )}

              {belowReserve && (
                <p className="font-mono text-[11px] text-amber-300">
                  No further bidding room. Keep the Rs 35 Cr reserve to stay eligible.
                </p>
              )}

              {/* Stat row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/5">
                <Stat
                  icon={<Wallet className="size-3.5" />}
                  label="Balance"
                  value={`Rs ${team.currentBalance} Cr`}
                  tone={
                    team.safeMax <= 0
                      ? "text-rose-400"
                      : team.safeMax <= 10
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                />
                <Stat
                  icon={<TrendingUp className="size-3.5" />}
                  label="Safe Max Bid"
                  value={`Rs ${team.safeMax} Cr`}
                  tone="text-white/80"
                />
                <Stat
                  icon={<Boxes className="size-3.5" />}
                  label="Spent"
                  value={`Rs ${spend} Cr`}
                  tone="text-white/80"
                />
                <Stat
                  icon={<Users className="size-3.5" />}
                  label="Match Points"
                  value={`${score?.totalMatchPoints ?? 0} pts`}
                  tone="text-[#f20089]"
                />
              </div>
            </div>

            {/* Assets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel title="Your State" icon={<MapPin className="size-3.5" />}>
                {team.ownedStateName ? (
                  <div className="space-y-2">
                    <span className="text-lg font-black text-blue-400">{team.ownedStateName}</span>
                    <div className="pt-2 border-t border-white/5 space-y-1 font-mono text-[11px]">
                      {team.stateSectors.map((s) => (
                        <div key={s.industryId} className="flex justify-between gap-2">
                          <span className="text-white/60 truncate">{s.industryName}</span>
                          <span
                            className={`font-bold shrink-0 ${
                              s.points === 90
                                ? "text-emerald-400"
                                : s.points === 75
                                ? "text-blue-400"
                                : "text-purple-400"
                            }`}
                          >
                            +{s.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-white/30">None</span>
                )}
              </Panel>

              <Panel title="Your Industries" icon={<Boxes className="size-3.5" />}>
                {industries.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {industries.map((ind) => (
                      <span
                        key={ind.id}
                        className={`px-2 py-1 rounded-lg border font-mono text-[10px] flex items-center gap-1.5 ${
                          ind.matched
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                            : "bg-white/[0.04] text-white/40 border-white/10"
                        }`}
                      >
                        {ind.name}
                        <span className="font-bold">{ind.matched ? `+${ind.points}` : "0"}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-xs text-white/30">None</span>
                )}
                {industries.some((i) => !i.matched) && (
                  <p className="font-mono text-[10px] text-white/30 pt-1">
                    Greyed industries score 0 - not listed under your state.
                  </p>
                )}
              </Panel>
            </div>

            {/* Purchases */}
            <Panel title="Your Purchases" icon={<History className="size-3.5" />}>
              {purchases.length > 0 ? (
                <div className="space-y-1.5">
                  {purchases.map((p, i) => (
                    <div
                      key={`${p.lotId}-${i}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black border border-white/5 font-mono text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white">{p.lotName}</span>
                        <span className="ml-2 text-[10px] uppercase text-white/30">{p.type}</span>
                      </div>
                      <span className="text-emerald-400 font-bold shrink-0">Rs {p.price} Cr</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="font-mono text-xs text-white/30">No purchases yet</span>
              )}
            </Panel>

            {/* Activity - shows corrections so nothing is a surprise */}
            <Panel title="Recent Activity" icon={<History className="size-3.5" />}>
              {activity.length > 0 ? (
                <div className="space-y-1.5">
                  {activity.map((a) => {
                    const style = ACTION_STYLE[a.action] || {
                      label: a.action.toUpperCase().slice(0, 8),
                      cls: "text-white/60 bg-white/[0.04] border-white/10",
                    };
                    return (
                      <div
                        key={a._id}
                        className="p-2.5 rounded-xl bg-black border border-white/5 font-mono text-[11px] flex items-start gap-2.5"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded border font-bold text-[9px] shrink-0 ${style.cls}`}
                        >
                          {style.label}
                        </span>
                        <span className="text-white/60 flex-1">{a.detail}</span>
                        <span className="text-white/25 shrink-0">
                          {new Date(a.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="font-mono text-xs text-white/30">No activity yet</span>
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="font-mono">
      <span className="text-[10px] uppercase text-white/40 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`text-lg font-black block mt-0.5 ${tone}`}>{value}</span>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-[#0e0e12] space-y-3">
      <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider font-bold flex items-center gap-1.5">
        {icon}
        {title}
      </span>
      {children}
    </div>
  );
}
