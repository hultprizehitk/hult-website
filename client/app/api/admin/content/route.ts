import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import SiteContent from "@/models/SiteContent";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { TEAM_SECTIONS, INITIAL_TEAM_MEMBERS } from "@/lib/team-data";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// GET: Fetch all content items for admin CMS
export async function GET(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const contentType = url.searchParams.get("type");

    await connectDB();

    const filter: Record<string, any> = {};
    if (contentType) filter.contentType = contentType;

    const items = await SiteContent.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ items }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to fetch content items" }, { status: 500 });
  }
}

// POST: Create new content item or seed defaults
export async function POST(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();

    await connectDB();

    // 1. One-click seed default committee from team-data.ts if empty
    if (body.action === "seed_default_committee") {
      const existingCount = await SiteContent.countDocuments({ contentType: "committee" });
      if (existingCount > 0) {
        return NextResponse.json(
          { message: "Committee already has entries in database.", count: existingCount },
          { status: 200 }
        );
      }

      const seedDocs = [];
      let orderIndex = 0;
      for (const member of INITIAL_TEAM_MEMBERS) {
        const section = TEAM_SECTIONS.find((s) => s.key === member.category);
        seedDocs.push({
          contentType: "committee",
          title: member.name,
          subtitle: member.role || section?.title || "Committee Member",
          category: member.category,
          description: member.department || "",
          image: member.image || "",
          links: {
            linkedin: member.socials?.linkedin || "",
            github: member.socials?.github || "",
            email: member.socials?.email || "",
          },
          badge: section?.badge || "Member",
          accentColor: section?.accentColor || "#f20089",
          order: orderIndex++,
          isActive: true,
        });
      }

      if (seedDocs.length > 0) {
        await SiteContent.insertMany(seedDocs);
      }

      return NextResponse.json(
        { success: true, message: `Seeded ${seedDocs.length} default committee members!`, count: seedDocs.length },
        { status: 201 }
      );
    }

    // 2. Standard creation
    const { contentType, title, subtitle, category, description, image, links, badge, accentColor, order } = body;

    if (!contentType || !title) {
      return NextResponse.json({ error: "contentType and title are required." }, { status: 400 });
    }

    const newItem = await SiteContent.create({
      contentType,
      title: title.trim(),
      subtitle: subtitle?.trim() || "",
      category: category?.trim() || "general",
      description: description?.trim() || "",
      image: image?.trim() || "",
      links: links || {},
      badge: badge?.trim() || "",
      accentColor: accentColor || "#f20089",
      order: Number(order) || 0,
      isActive: true,
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to create content item" }, { status: 500 });
  }
}

// PUT: Update a content item
export async function PUT(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid content ID is required." }, { status: 400 });
    }

    await connectDB();

    const updated = await SiteContent.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated }, { status: 200 });
  } catch (error: unknown) {
    console.error("PUT /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to update content item" }, { status: 500 });
  }
}

// DELETE: Remove a content item
export async function DELETE(req: Request) {
  const isAdmin = await isAuthorizedAdmin(req);
  if (!isAdmin) return unauthorizedResponse();

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid content ID is required." }, { status: 400 });
    }

    await connectDB();
    const deleted = await SiteContent.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to delete content item" }, { status: 500 });
  }
}
