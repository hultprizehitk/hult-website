"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { INDUSTRIES, STATES, MINIMUM_BALANCE_THRESHOLD } from "@/lib/auction-data";
import { DotPattern } from "@/components/ui/DotPattern";
import { AuctionSoldAnimation } from "@/components/AuctionSoldAnimation";

interface AuctionTeam {
  teamId: string;
  teamName: string;
  teamCode: string;
  quizRank: number;
  startingBudget: number;
  currentBalance: number;
  ownedIndustries: string[];
  ownedState: string | null;
  status: "active" | "disqualified";
  disqualificationReason?: string;
}

interface AuctionLot {
  lotId: string;
  name: string;
  type: "industry" | "state";
  basePrice: number;
  status: "unsold" | "sold";
  winningTeamId?: string | null;
  winningTeamName?: string | null;
  soldPrice?: number | null;
  soldAt?: string | null;
}

interface ILastSoldLot {
  lotId: string;
  name: string;
  type: "industry" | "state";
  winningTeamId: string;
  winningTeamName: string;
  price: number;
  soldAt: string;
}

interface SessionData {
  sessionId: string;
  currentRound: "setup" | "round1" | "intermission" | "round2" | "results";
  activeLotId: string | null;
  stageMode?: "auto" | "spotlight" | "sold" | "board" | "matrix" | "stage";
  viewerMode?: "stage" | "ledger" | "matrix";
  lastSoldLot?: ILastSoldLot | null;
  matrixRevealed: boolean;
  teams: AuctionTeam[];
  lots: AuctionLot[];
  history?: {
    lotId: string;
    lotName: string;
    teamName: string;
    price: number;
  }[];
}

export default function ViewerPage() {
  const [session, setSession] = useState<SessionData | null>(null);

  const loadSession = async () => {
    try {
      const res = await fetch("/api/auction/session");
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadSession();
    const interval = setInterval(loadSession, 1200);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Press 'F' to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeLot = session?.lots.find((l) => l.lotId === session?.activeLotId);

  // Determine Viewer Mode (explicitly managed by Admin)
  const viewerMode =
    session?.viewerMode ||
    (session?.stageMode === "matrix"
      ? "matrix"
      : session?.stageMode === "board"
      ? "ledger"
      : "stage");

  // Determine Display Mode within Stage Mode
  const isSold =
    activeLot?.status === "sold" ||
    session?.stageMode === "sold" ||
    Boolean(session?.lastSoldLot && session?.activeLotId === session?.lastSoldLot.lotId);

  const soldLotData =
    activeLot && activeLot.status === "sold" && activeLot.winningTeamName && activeLot.soldPrice
      ? {
          lotId: activeLot.lotId,
          name: activeLot.name,
          type: activeLot.type,
          winningTeamName: activeLot.winningTeamName,
          winningTeamId: activeLot.winningTeamId || undefined,
          price: activeLot.soldPrice,
        }
      : session?.lastSoldLot
      ? {
          lotId: session.lastSoldLot.lotId,
          name: session.lastSoldLot.name,
          type: session.lastSoldLot.type,
          winningTeamName: session.lastSoldLot.winningTeamName,
          winningTeamId: session.lastSoldLot.winningTeamId,
          price: session.lastSoldLot.price,
        }
      : null;

  const soldTeam = soldLotData
    ? session?.teams.find((t) => t.teamId === soldLotData.winningTeamId || t.teamName === soldLotData.winningTeamName)
    : null;

  let currentDisplay: "stage_blank" | "stage_spotlight" | "stage_sold" | "ledger" | "matrix" = "stage_blank";

  if (viewerMode === "ledger") {
    currentDisplay = "ledger";
  } else if (viewerMode === "matrix") {
    currentDisplay = "matrix";
  } else {
    // Mode 1: Stage
    if (isSold && soldLotData) {
      currentDisplay = "stage_sold";
    } else if (activeLot && activeLot.status === "unsold") {
      currentDisplay = "stage_spotlight";
    } else {
      currentDisplay = "stage_blank";
    }
  }

  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 md:p-8 select-none overflow-hidden font-['Helvetica',Arial,sans-serif]">
      <DotPattern className="text-white/[0.03]" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#f20089]/10 rounded-full blur-[150px]" />

      {/* Minimal Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-black text-[#f20089] px-2 py-0.5 rounded bg-white/[0.05] border border-white/10">
            HULT
          </span>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
              {session?.currentRound === "round1"
                ? "ROUND 1: INDUSTRIES"
                : session?.currentRound === "round2"
                ? "ROUND 2: STATES"
                : session?.currentRound === "intermission"
                ? "INTERMISSION"
                : session?.currentRound.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Current Screen Indicator */}
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40">
          <span>VIEWER:</span>
          <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-[#f20089] font-bold">
            {currentDisplay === "stage_sold"
              ? "STAGE &bull; SOLD"
              : currentDisplay === "stage_spotlight"
              ? "STAGE &bull; ITEM"
              : currentDisplay === "stage_blank"
              ? "STAGE &bull; STANDBY"
              : currentDisplay === "ledger"
              ? "LEDGER"
              : "MATRIX"}
          </span>
        </div>
      </header>

      {/* Main Stage Viewports */}
      <main className="relative z-10 flex-1 my-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* MODE 1A: BLANK STAGE (Waiting for item selection from admin)              */}
          {/* ========================================================================= */}
          {currentDisplay === "stage_blank" && (
            <motion.div
              key="stage-blank"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full py-12 space-y-6"
            >
              <div className="size-20 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-white/20">
                <span className="size-3 rounded-full bg-[#f20089] animate-ping" />
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#f20089] font-bold">
                  STAGE STANDBY
                </span>
                <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white/90 uppercase">
                  Awaiting Next Lot
                </h2>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1B: ITEM SPOTLIGHT (When selected to stage)                          */}
          {/* ========================================================================= */}
          {currentDisplay === "stage_spotlight" && activeLot && (
            <motion.div
              key={`spotlight-${activeLot.lotId}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full py-8 space-y-6"
            >
              {/* Type pill */}
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#f20089] font-bold px-3 py-1 rounded-full border border-[#f20089]/30 bg-[#f20089]/10">
                {activeLot.type === "industry" ? "INDUSTRY LOT" : "STATE LOT"}
              </span>

              {/* Massive Item Name */}
              <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none text-white drop-shadow-2xl uppercase">
                {activeLot.name}
              </h2>

              {/* Base Price */}
              <div className="flex flex-col items-center p-6 md:p-8 rounded-3xl border border-white/10 bg-[#0e0e12] shadow-2xl">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/40 font-semibold mb-1">
                  BASE PRICE
                </span>
                <span className="font-mono text-5xl md:text-7xl font-black text-emerald-400 tracking-tight">
                  ₹{activeLot.basePrice} Cr
                </span>
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>BIDDING ACTIVE</span>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1C: SLOW AUCTION VIBE SOLD THEATRICS (Remains until admin changes)   */}
          {/* ========================================================================= */}
          {currentDisplay === "stage_sold" && soldLotData && (
            <motion.div
              key={`sold-${soldLotData.lotId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <AuctionSoldAnimation lot={soldLotData} quizRank={soldTeam?.quizRank} />
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: TEAMS FINANCIAL LEDGER                                            */}
          {/* ========================================================================= */}
          {currentDisplay === "ledger" && (
            <motion.div
              key="financial-board"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 w-full max-w-7xl mx-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs text-white/50">
                <span className="uppercase tracking-[0.2em] text-[#f20089] font-bold">
                  TEAMS LEDGER
                </span>
                <span>RESERVE THRESHOLD: ₹35 CR</span>
              </div>

              {/* 10-Team Ledger Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {session?.teams.map((team) => {
                  const isDQ = team.status === "disqualified";
                  const isBelowReserve = team.currentBalance < MINIMUM_BALANCE_THRESHOLD;
                  const isCritical = team.currentBalance <= 45 && !isBelowReserve;
                  const stateObj = team.ownedState ? STATES.find((s) => s.id === team.ownedState) : null;

                  return (
                    <div
                      key={team.teamId}
                      className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-4 shadow-xl ${
                        isDQ
                          ? "border-rose-500/40 bg-rose-950/10 opacity-70"
                          : isBelowReserve
                          ? "border-rose-500/50 bg-rose-950/15"
                          : "border-white/10 bg-[#0e0e12]"
                      }`}
                    >
                      {/* Row Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-xl font-mono font-black text-xs tabular-nums ${
                              team.quizRank === 1
                                ? "bg-amber-400 text-black"
                                : team.quizRank === 2
                                ? "bg-slate-300 text-black"
                                : team.quizRank === 3
                                ? "bg-amber-700 text-white"
                                : "bg-white/[0.05] text-white/60"
                            }`}
                          >
                            #{team.quizRank}
                          </span>

                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-white truncate">{team.teamName}</h3>
                            <span className="font-mono text-[10px] text-white/40">{team.teamCode}</span>
                          </div>
                        </div>

                        {/* Balance */}
                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono text-lg font-black ${
                              isBelowReserve || isDQ
                                ? "text-rose-400"
                                : isCritical
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            ₹{team.currentBalance} Cr
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isBelowReserve
                              ? "bg-rose-500"
                              : isCritical
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, (team.currentBalance / 200) * 100))}%`,
                          }}
                        />
                      </div>

                      {/* Assets Won */}
                      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/40">State:</span>
                          <span className="text-blue-400 font-semibold">{stateObj?.name || "None"}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-white/40">Industries:</span>
                          {team.ownedIndustries && team.ownedIndustries.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {team.ownedIndustries.map((indId) => {
                                const ind = INDUSTRIES.find((i) => i.id === indId);
                                return (
                                  <span
                                    key={indId}
                                    className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]"
                                  >
                                    {ind?.name || indId}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-white/30">0</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE 3: GEOGRAPHIC SYNERGY MATRIX                                         */}
          {/* ========================================================================= */}
          {currentDisplay === "matrix" && (
            <motion.div
              key="synergy-matrix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 w-full max-w-7xl mx-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs text-white/50">
                <span className="uppercase tracking-[0.2em] text-[#f20089] font-bold">
                  GEOGRAPHIC MATRIX
                </span>
                <span>10 STATES</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 max-h-[640px] overflow-y-auto pr-1">
                {STATES.map((state) => {
                  const ownerLot = session?.lots.find((l) => l.lotId === state.id && l.status === "sold");

                  return (
                    <div
                      key={state.id}
                      className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-3.5 ${
                        ownerLot
                          ? "border-blue-500/40 bg-blue-950/20"
                          : "border-white/10 bg-[#0e0e12]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h3 className="font-bold text-sm text-white">{state.name}</h3>
                          {ownerLot && (
                            <p className="font-mono text-[10px] text-blue-300 truncate max-w-[110px]">
                              {ownerLot.winningTeamName}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400 font-bold shrink-0">
                          ₹{state.basePrice} Cr
                        </span>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-white/5 font-mono text-[11px]">
                        {state.sectors.map((sec, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1 rounded border border-white/5 bg-white/[0.02]"
                          >
                            <span className="text-white/80 truncate text-[10px] max-w-[110px]">
                              {sec.industryName}
                            </span>
                            <span
                              className={`font-bold text-[10px] px-1 rounded ${
                                sec.points === 90
                                  ? "text-emerald-400"
                                  : sec.points === 75
                                  ? "text-blue-400"
                                  : "text-purple-400"
                              }`}
                            >
                              +{sec.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-white/40">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[#f20089] font-bold">SALES:</span>
          {session?.history && session.history.length > 0 ? (
            <span className="text-white/70 truncate">
              {session.history[0].lotName} &rarr;{" "}
              <strong className="text-white">{session.history[0].teamName}</strong> (₹
              {session.history[0].price} Cr)
            </span>
          ) : (
            <span className="text-white/30">None</span>
          )}
        </div>
        <span className="hidden sm:inline">MIN RESERVE: ₹35 CR</span>
      </footer>
    </div>
  );
}
