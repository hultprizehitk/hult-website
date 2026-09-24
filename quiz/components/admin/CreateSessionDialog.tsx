"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api, type ApiError } from "@/lib/client/api";
import type { AdminSessionSummary } from "@/lib/quiz/types";

export interface EventOption {
  id: string;
  title: string;
  date: string;
}

export function CreateSessionDialog({ events, onCreated }: { events: EventOption[]; onCreated: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [requireSubmitted, setRequireSubmitted] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { session } = await api<{ session: AdminSessionSummary }>("/api/admin/sessions", {
        body: { title, eventId, requireSubmitted },
      });
      setOpen(false);
      onCreated(session.code);
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="rounded-xl" onClick={() => setOpen(true)}>
        <Plus />
        New session
      </Button>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New session</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" className="font-mono text-[11px] uppercase tracking-wider text-white/60">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-white/60">Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
            <Label htmlFor="req" className="text-sm">
              Submitted teams only
            </Label>
            <Switch id="req" checked={requireSubmitted} onCheckedChange={setRequireSubmitted} />
          </div>
          <DialogFooter>
            <Button type="submit" loading={busy} disabled={!title.trim() || !eventId}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
