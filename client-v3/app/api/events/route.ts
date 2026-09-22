import { NextResponse } from "next/server";
import { SEED_EVENTS } from "@/lib/seed-data";

/**
 * TEMPORARY frontend-only stub — returns seeded events.
 * SWAP POINT: restore `client/app/api/events/route.ts` (MongoDB) when backend lands.
 */
export async function GET() {
  return NextResponse.json({ events: SEED_EVENTS });
}