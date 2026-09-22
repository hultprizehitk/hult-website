import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthorizedAdmin } from "@/lib/admin-check";
import { logAdminAction } from "@/lib/audit-logger";
import { auth } from "@/auth";
import SiteContent from "@/models/SiteContent";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get("type");

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (contentType) filter.contentType = contentType;

    const items = await SiteContent.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Admin content GET error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const session = await auth();
    const body = await req.json();

    const {
      contentType,
      title,
      subtitle,
      category,
      description,
      image,
      links,
      badge,
      accentColor,
      order,
      isActive,
    } = body;

    if (!contentType || !title) {
      return NextResponse.json(
        { error: "Missing required fields (contentType, title)" },
        { status: 400 }
      );
    }

    await connectDB();

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
      isActive: isActive ?? true,
    });

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Created ${contentType} content: "${newItem.title}"`,
      targetType: "content",
      targetId: newItem._id.toString(),
      details: { contentType, title: newItem.title },
      req,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Admin content POST error:", error);
    return NextResponse.json({ error: "Failed to create content item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const session = await auth();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing content item ID" }, { status: 400 });
    }

    await connectDB();

    const item = await SiteContent.findByIdAndUpdate(id, updates, { new: true });
    if (!item) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Updated ${item.contentType} content: "${item.title}"`,
      targetType: "content",
      targetId: id,
      details: updates,
      req,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Admin content PUT error:", error);
    return NextResponse.json({ error: "Failed to update content item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const isAuth = await isAuthorizedAdmin(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing content item ID" }, { status: 400 });
    }

    const session = await auth();
    await connectDB();

    const item = await SiteContent.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }

    await logAdminAction({
      adminEmail: session?.user?.email || "admin",
      adminName: session?.user?.name || "Admin",
      adminRole: (session?.user as { role?: string })?.role || "admin",
      action: `Deleted ${item.contentType} content: "${item.title}"`,
      targetType: "content",
      targetId: id,
      details: { title: item.title, contentType: item.contentType },
      req,
    });

    return NextResponse.json({ success: true, message: "Content item removed successfully" });
  } catch (error) {
    console.error("Admin content DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete content item" }, { status: 500 });
  }
}
