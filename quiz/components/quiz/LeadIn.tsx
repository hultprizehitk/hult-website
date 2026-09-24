"use client";

import { AnimatePresence, motion } from "motion/react";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import { cn } from "@/lib/utils";

export function LeadIn({ openedAt, now, label, big = false }: { openedAt: number; now: number; label: string; big?: boolean }) {
  const n = Math.max(1, Math.ceil((openedAt - now) / 1000));
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <TextShimmer className="font-mono text-xs uppercase tracking-[0.3em] sm:text-sm" duration={1.5}>
        {label}
      </TextShimmer>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={n}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className={cn("font-black text-white tabular-nums", big ? "text-[12rem] leading-none" : "text-8xl")}
        >
          {n}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
