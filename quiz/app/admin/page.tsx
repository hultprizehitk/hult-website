"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorPlay, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CreateSessionDialog, type EventOption } from "@/components/admin/CreateSessionDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { api, type ApiError } from "@/lib/client/api";
import type { AdminSessionSummary } from "@/lib/quiz/types";

export default function AdminHome() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AdminSessionSummary[] | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        api<{ sessions: AdminSessionSummary[] }>("/api/admin/sessions"),
        api<{ events: EventOption[] }>("/api/admin/events"),
      ]);
      setSessions(s.sessions);
      setEvents(e.events);
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() only sets state after awaiting the network
    void load();
  }, [load]);

  const remove = async (code: string) => {
    try {
      await api(`/api/admin/sessions/${code}`, { method: "DELETE" });
      await load();
    } catch (err) {
      toast.error((err as ApiError).message);
    }
  };

  const eventTitle = (id: string) => events.find((e) => e.id === id)?.title ?? "Unknown event";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Sessions"
        subtitle="Create a session, add questions, run it live"
        right={
          <>
            <button
              type="button"
              onClick={() => void load()}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium transition-all hover:bg-white/10"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <CreateSessionDialog events={events} onCreated={(code) => router.push(`/admin/s/${code}`)} />
          </>
        }
      />

      {sessions === null ? (
        <div className="py-20 text-center font-mono text-xs text-neutral-500">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-[#0e0e12] py-16 text-center font-mono text-xs text-neutral-400">No sessions yet</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <div key={s.code} className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-[#0e0e12] p-5 shadow-2xl transition-all hover:border-white/25">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-tight">{s.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-rose-400">#{s.code}</span>
                    <span className="truncate text-[11px] text-white/40">• {eventTitle(s.eventId)}</span>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`/admin/s/${s.code}`} className={buttonVariants({ size: "sm", className: "rounded-lg" })}>
                  <SlidersHorizontal />
                  Console
                </Link>
                <Link href={`/present/${s.code}`} target="_blank" className={buttonVariants({ size: "sm", variant: "outline", className: "rounded-lg" })}>
                  <MonitorPlay />
                  Present
                </Link>
                {s.status !== "live" && (
                  <ConfirmButton
                    size="sm"
                    variant="destructive-outline"
                    label="Delete"
                    title={`Delete #${s.code}?`}
                    description="Questions, check-ins and answers are removed."
                    icon={<Trash2 />}
                    className="ml-auto rounded-lg"
                    onConfirm={() => remove(s.code)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
