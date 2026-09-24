import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/actor";
import { handle, json } from "@/lib/http";
import { Event, type MirrorEvent } from "@/models/mirror";

export async function GET(req: Request) {
  return handle(async () => {
    await connectDB();
    await requireAdmin(req);
    const events = await Event.find().select("title date").sort({ createdAt: -1 }).lean<MirrorEvent[]>();
    return json({ events: events.map((e) => ({ id: String(e._id), title: e.title, date: e.date })) });
  });
}
