"use client";

import { motion } from "motion/react";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { optionLetter } from "@/lib/format";
import { OPTION_BG } from "./option-colors";

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "muted";

export function OptionButton({
  index,
  text,
  state = "idle",
  disabled = false,
  large = false,
  onClick,
}: {
  index: number;
  text: string;
  state?: OptionState;
  disabled?: boolean;
  large?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-2xl border px-4 text-left font-medium shadow-2xl transition-colors",
        large ? "py-6 text-3xl" : "py-4 text-base",
        state === "idle" && "cursor-pointer border-white/15 bg-[#0e0e12] enabled:hover:border-white/30 enabled:hover:bg-[#121217]",
        state === "selected" && "border-white/60 bg-white/[0.07]",
        state === "correct" && "border-emerald-500/40 bg-[#0a1f18] text-emerald-200",
        state === "wrong" && "border-rose-500/30 bg-rose-950/20 text-rose-200",
        state === "muted" && "border-white/10 bg-[#0e0e12] opacity-45",
        disabled && state === "idle" && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl font-bold text-white",
          large ? "size-14 text-2xl" : "size-9 text-sm",
          OPTION_BG[index],
        )}
      >
        {optionLetter(index)}
      </span>
      <span className="flex-1 break-words">{text}</span>
      {state === "selected" && <Check className="size-5 shrink-0 text-white" />}
      {state === "correct" && <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />}
      {state === "wrong" && <XCircle className="size-5 shrink-0 text-rose-400" />}
    </motion.button>
  );
}
