import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const NOTICE_TONES = {
  success: { box: "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-200", icon: CheckCircle2, iconClass: "text-emerald-400" },
  error: { box: "border-rose-500/25 bg-rose-500/[0.08] text-rose-200", icon: AlertCircle, iconClass: "text-rose-400" },
  warning: { box: "border-amber-500/25 bg-amber-500/[0.08] text-amber-200", icon: Info, iconClass: "text-amber-400" },
};

export default function Notice({
  tone,
  className,
  children,
}: {
  tone: keyof typeof NOTICE_TONES;
  className?: string;
  children: React.ReactNode;
}) {
  const { box, icon: Icon, iconClass } = NOTICE_TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed animate-fadeIn", box, className)}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", iconClass)} />
      <span>{children}</span>
    </div>
  );
}
