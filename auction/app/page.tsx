import Link from "next/link";
import { ShieldCheck, Monitor, Trophy, ArrowRight } from "lucide-react";
import { DotPattern } from "@/components/ui/DotPattern";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-[#000000] text-white font-sans">
      <DotPattern className="text-white/[0.03]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#f20089]/10 rounded-full blur-[140px]" />

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center space-y-8">
        <span className="font-mono text-xs font-bold text-[#f20089] uppercase tracking-[0.25em] px-3 py-1 rounded-full border border-white/10 bg-white/[0.04]">
          HULT PRIZE HITK &middot; AUCTION
        </span>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none">
          Tourism &amp; Industry <span className="text-[#f20089]">Auction</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4">
          <Link
            href="/admin"
            className="group p-6 rounded-3xl border border-white/10 bg-[#0e0e12] hover:border-[#f20089]/50 transition-all text-left flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#f20089]">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-[#f20089] transition-colors">
                  Console
                </h2>
                <p className="font-mono text-xs text-white/40 mt-0.5">Floor operator control room</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 font-mono text-xs font-bold text-[#f20089]">
              <span>Enter</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          <Link
            href="/viewer"
            className="group p-6 rounded-3xl border border-white/10 bg-[#0e0e12] hover:border-blue-500/50 transition-all text-left flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-blue-400">
                <Monitor className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  Projector
                </h2>
                <p className="font-mono text-xs text-white/40 mt-0.5">Live audience broadcast</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 font-mono text-xs font-bold text-blue-400">
              <span>Enter</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          <Link
            href="/results"
            className="group p-6 rounded-3xl border border-white/10 bg-[#0e0e12] hover:border-amber-500/50 transition-all text-left flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="size-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-amber-400">
                <Trophy className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Results
                </h2>
                <p className="font-mono text-xs text-white/40 mt-0.5">Final podium evaluation</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1 font-mono text-xs font-bold text-amber-400">
              <span>Enter</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>
        </div>

        <div className="pt-2 font-mono text-xs text-white/40 flex items-center gap-3">
          <span>16 Industries</span>
          <span>&bull;</span>
          <span>10 States</span>
          <span>&bull;</span>
          <span>Budget: ₹200 Cr</span>
          <span>&bull;</span>
          <span>Reserve: ₹35 Cr</span>
        </div>
      </div>
    </main>
  );
}
