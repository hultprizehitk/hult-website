"use client";

import { AnimatePresence, motion } from "motion/react";
import { WifiOff } from "lucide-react";

export function ReconnectingPill({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-500/30 bg-[#241a08] px-4 py-2 text-xs font-medium text-amber-300"
        >
          <WifiOff className="size-4" />
          Reconnecting
        </motion.div>
      )}
    </AnimatePresence>
  );
}
