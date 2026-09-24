"use client";

import type { LucideIcon } from "lucide-react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { cn } from "@/lib/utils";

export function StateMessage({
  icon: Icon,
  title,
  subtitle,
  action,
  spin = false,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  spin?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-[#16161d] shadow-2xl">
        <Icon className={cn("size-6 text-white/80", spin && "animate-spin")} />
      </div>
      <TextEffect per="word" preset="fade" as="h2" className="text-2xl font-bold tracking-tight">
        {title}
      </TextEffect>
      {subtitle && <p className="max-w-sm text-xs text-neutral-400">{subtitle}</p>}
      {action}
    </div>
  );
}
