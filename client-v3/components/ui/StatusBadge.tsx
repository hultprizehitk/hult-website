import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

const TONES: Record<StatusTone, { dot: string; text: string }> = {
  success: { dot: "bg-emerald-400", text: "text-emerald-300" },
  info: { dot: "bg-sky-400", text: "text-sky-300" },
  warning: { dot: "bg-amber-400", text: "text-amber-300" },
  danger: { dot: "bg-rose-400", text: "text-rose-300" },
  neutral: { dot: "bg-white/40", text: "text-white/60" },
};

/** Quiet status indicator: a colored dot with tinted text, no pill container. */
export default function StatusBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 text-sm font-medium", TONES[tone].text, className)}>
      <span className={cn("h-2 w-2 rounded-full", TONES[tone].dot)} aria-hidden="true" />
      {children}
    </span>
  );
}
