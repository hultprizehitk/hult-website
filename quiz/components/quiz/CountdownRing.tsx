import { cn } from "@/lib/utils";
import { secondsLeft } from "@/lib/quiz/clock";

export function CountdownRing({
  openedAt,
  closesAt,
  now,
  size = 64,
  className,
}: {
  openedAt: number;
  closesAt: number;
  now: number;
  size?: number;
  className?: string;
}) {
  const total = Math.max(closesAt - openedAt, 1);
  const frac = Math.min(Math.max(closesAt - now, 0) / total, 1);
  const secs = secondsLeft(closesAt, now);
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-white/10" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className={secs <= 5 ? "stroke-rose-400" : "stroke-white"}
          style={{ transition: "stroke-dashoffset 200ms linear" }}
        />
      </svg>
      <span
        className={cn("absolute inset-0 grid place-items-center font-black tabular-nums", secs <= 5 && "text-rose-300")}
        style={{ fontSize: size * 0.32 }}
      >
        {secs}
      </span>
    </div>
  );
}
