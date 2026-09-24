import { cn } from "@/lib/utils";

/** Centered card from the admin sign-in gate (client-v3/app/admin/components/AdminSignInGate.tsx). */
export function GateCard({
  badge,
  title,
  subtitle,
  tone = "hult",
  children,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  tone?: "hult" | "emerald" | "rose";
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#0e0e12] p-8 text-center shadow-2xl sm:p-10">
        <div
          className={cn(
            "pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl",
            tone === "hult" ? "bg-hult/15" : tone === "rose" ? "bg-rose-500/10" : "bg-emerald-500/10",
          )}
        />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-neutral-800/40 blur-3xl" />
        <div className="relative pt-2">
          {badge && (
            <span
              className={cn(
                "mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest",
                tone === "hult" && "border-hult/40 bg-hult/15 text-pink-300",
                tone === "rose" && "border-rose-500/40 bg-rose-500/15 text-rose-300",
                tone === "emerald" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
              )}
            >
              {badge}
            </span>
          )}
          <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mx-auto mb-8 max-w-xs text-xs text-neutral-300 sm:text-sm">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
