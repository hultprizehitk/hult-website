import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SiteContent from "@/models/SiteContent";

// GET: Public endpoint to fetch active website content
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const contentType = url.searchParams.get("type");
    const category = url.searchParams.get("category");

    await connectDB();

    const filter: Record<string, any> = { isActive: true };
    if (contentType) filter.contentType = contentType;
    if (category) filter.category = category;

    const items = await SiteContent.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json(
      { items },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/content error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
