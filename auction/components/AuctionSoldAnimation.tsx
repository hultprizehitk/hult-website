"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Gavel } from "lucide-react";

interface SoldLotData {
  lotId: string;
  name: string;
  type: "industry" | "state";
  winningTeamName: string;
  winningTeamId?: string;
  price: number;
}

interface AuctionSoldAnimationProps {
  lot: SoldLotData;
  quizRank?: number;
}

export function AuctionSoldAnimation({ lot, quizRank }: AuctionSoldAnimationProps) {
  // Synthesized audio gavel sound on sold reveal
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;

      // Resonant deep wooden thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      // Sharp wooden impact snap
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = "triangle";
      snapOsc.frequency.setValueAtTime(750, now);
      snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      snapGain.gain.setValueAtTime(0.6, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.12);
    } catch (_) {}
  }, [lot.lotId]);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center font-['Helvetica',Arial,sans-serif] select-none py-6">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-[#f20089]/15 blur-[140px] opacity-100" />

      {/* Shockwave Rings */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0.7 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="pointer-events-none absolute size-80 rounded-full border border-[#f20089]/50"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 2.2, delay: 0.1, ease: "easeOut" }}
        className="pointer-events-none absolute size-80 rounded-full border border-amber-400/30"
      />

      <div className="relative z-10 w-full space-y-6">
        {/* SOLD Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-[#f20089]/40 bg-[#f20089]/15 text-[#f20089] font-mono text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_25px_rgba(242,0,137,0.25)]"
        >
          <Gavel className="size-4" />
          <span>SOLD</span>
        </motion.div>

        {/* Item Name */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white uppercase drop-shadow-2xl"
        >
          {lot.name}
        </motion.h2>

        {/* Winning Team & Price Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto pt-2"
        >
          {/* Team Card */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-white/10 bg-[#0e0e12] shadow-2xl space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              TEAM
            </span>
            <div className="flex items-center gap-2">
              {quizRank && (
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-amber-400 text-black">
                  #{quizRank}
                </span>
              )}
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase truncate max-w-[280px]">
                {lot.winningTeamName}
              </h3>
            </div>
          </div>

          {/* Price Card */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-emerald-500/30 bg-[#0e0e12] shadow-2xl space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              HAMMER PRICE
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
              ₹{lot.price} Cr
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
