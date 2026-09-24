import { formatMs } from "@/lib/format";
import type { Standing } from "@/lib/quiz/types";

export function StandingsTable({ rows }: { rows: Standing[] }) {
  if (rows.length === 0) return <div className="py-12 text-center font-mono text-xs text-neutral-500">No teams checked in</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            <th className="w-12 px-4 py-3.5 font-medium">#</th>
            <th className="px-4 py-3.5 font-medium">Team</th>
            <th className="px-4 py-3.5 text-right font-medium">Score</th>
            <th className="px-4 py-3.5 text-right font-medium">Time</th>
            <th className="px-4 py-3.5 text-right font-medium">Correct</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r.teamId} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-black tabular-nums">{r.rank}</td>
              <td className="px-4 py-3 text-sm font-semibold tracking-tight">{r.teamName}</td>
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">{r.score}</td>
              <td className="px-4 py-3 text-right font-mono text-neutral-400 tabular-nums">{formatMs(r.totalTimeMs)}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400">
                {r.correctCount}
                <span className="text-white/30">/{r.answeredCount}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
