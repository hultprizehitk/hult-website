import { NextResponse } from "next/server";

/**
 * TEMPORARY frontend-only stub for CMS content (announcements, committee).
 * Returns empty items so UI falls back to static data (team-data.ts) and the
 * announcement banner stays hidden until live content is configured.
 * SWAP POINT: restore `client/app/api/content/route.ts` (MongoDB) when backend lands.
 */
export async function GET() {
  return NextResponse.json({ items: [] });
}